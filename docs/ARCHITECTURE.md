# Architecture Overview

Aliento Pay follows a **Clean/Hexagonal Architecture** pattern, ensuring separation of concerns and maintainability.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (Astro Pages & UI Components)        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│        Application Layer                │
│    (Use Cases & Application Services)   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Domain Layer                   │
│    (Entities, Value Objects, Ports)     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│       Infrastructure Layer              │
│  (Adapters: Keychain, HTTP, Storage)    │
└─────────────────────────────────────────┘
```

## Directory Structure

### `/src/pages` - Routes & Presentation
Astro pages that handle routing and SSR:
- `index.astro` - Login page
- `dashboard.astro` - Main delegation dashboard
- `calculate.astro` - Payment calculator
- `payments.astro` - Payment execution interface
- `404.astro` - Error page

### `/src/layouts` - Templates
- `Layout.astro` - Base layout with global styles and metadata

### `/src/ui` - UI Components

#### `/ui/base` - Design System
Reusable, unstyled components following brand guidelines:
- `BrandButton.astro` - Button component
- `BrandCard.astro` - Card container
- `BrandInput.astro` - Form inputs
- `BrandModal.astro` - Modal dialogs
- `BrandTitle.astro` - Typography

#### `/ui/components` - Feature Components
Business logic components:
- `Login.astro` - Authentication UI
- `Filters.astro` - Delegation filters (62KB - complex)
- `tableDelegations.astro` - Delegation table (27KB)
- `PaymentsList.astro` - Payment history
- `CurationStats.astro` - Statistics display

### `/src/domain` - Business Logic

Domain entities and value objects that represent core business concepts:

```typescript
// Example: Delegation entity
class Delegation {
  constructor(
    public delegator: string,
    public vestingShares: number,
    public timestamp: Date
  ) {}
}
```

### `/src/application` - Use Cases

Application-level business logic:
- Orchestrates domain entities
- Coordinates infrastructure services
- Implements application-specific workflows

Example modules:
- `authentication/` - Login, logout, session management
- `payments/` - Payment calculation and execution
- `delegations/` - Delegation tracking

### `/src/infrastructure` - External Services

Adapters for external systems:
- **Keychain Adapter** - Hive Keychain integration
- **HTTP Client** - RPC communication
- **Storage Adapters** - localStorage/sessionStorage wrappers

### `/src/lib` - Utilities

Shared utilities and helpers:
- `auth/` - Authentication utilities
- `calculate-curation.ts` - Curation reward calculations
- `caching/` - Cache management (10-minute TTL)

## Key Design Patterns

### 1. Dependency Inversion
Domain layer defines ports (interfaces), infrastructure provides adapters (implementations).

```typescript
// Domain port
interface IAuthRepository {
  authenticate(username: string): Promise<Session>;
}

// Infrastructure adapter
class KeychainAuthRepository implements IAuthRepository {
  async authenticate(username: string): Promise<Session> {
    // Keychain implementation
  }
}
```

### 2. Repository Pattern
Abstracts data access logic:
- `CurationRepository` - Fetch curation data
- `DelegationRepository` - Manage delegations
- `PaymentRepository` - Handle payments

### 3. Use Case Pattern
Encapsulates business operations:
- `AuthenticateUser` - Login flow
- `CalculateDistribution` - Payment calculations
- `ExecuteBatchPayment` - Process payments

### 4. Value Objects
Immutable objects representing domain concepts:
- `HivePower` - Represents HP amounts
- `Percentage` - Percentage values with validation
- `Username` - Validated Hive username

## Data Flow Example

```
User clicks "Calculate Payments"
          ↓
[Presentation Layer]
calculate.astro receives form data
          ↓
[Application Layer]
CalculateDistribution use case
          ↓
[Domain Layer]
Payment entities created with business rules
          ↓
[Infrastructure Layer]
Fetch curation data via HTTP adapter
          ↓
[Application Layer]
Returns calculation results
          ↓
[Presentation Layer]
Display results in UI
```

## State Management

### Client-Side State
- **localStorage** - User preferences, filter settings
- **sessionStorage** - Payment history (temporary)
- **In-memory cache** - Curation data (10-min TTL)

### Server-Side State
- **Session tokens** - Encrypted cookies for authentication
- **No database** - Stateless architecture (blockchain as source of truth)

## API Design

### RESTful Endpoints

```
POST /api/auth/login
  ├─ Body: { username }
  └─ Response: { success, session }

GET /api/auth/validate
  ├─ Headers: Cookie
  └─ Response: { valid, user }

POST /api/calculate
  ├─ Body: { delegations, filters, adjustments }
  └─ Response: { distributions, totals }

GET /api/curation-stats
  ├─ Query: ?username=...
  └─ Response: { stats, history }
```

## Security Considerations

### Authentication
- **Keychain-based** - No passwords stored
- **Session tokens** - Encrypted with `SESSION_SECRET`
- **Middleware protection** - Routes guarded by `middleware.ts`

### Input Validation
- TypeScript strict mode for type safety
- Schema validation on API boundaries
- Sanitization of user inputs

### XSS Prevention
- Astro auto-escapes output
- CSP headers on Vercel deployment
- No `dangerouslySetInnerHTML` usage

## Performance Optimizations

### Caching Strategy
```typescript
// Per-user cache with TTL
{
  [username]: {
    data: CurationData,
    timestamp: Date,
    ttl: 600000 // 10 minutes
  }
}
```

### View Transitions
- Astro View Transitions API
- Smooth page navigation
- Reduced layout shifts

### Code Splitting
- Astro island architecture
- Lazy-load heavy components
- Vercel serverless optimization

## Testing Strategy

### Current State
- Architecture validation tests in `/src`
- TypeScript for compile-time safety
- ESLint/Prettier for code quality

### Future Improvements
- Unit tests for domain logic
- Integration tests for use cases
- E2E tests with Playwright

## Deployment Architecture

### Vercel Serverless
```
User Request → Vercel Edge → Serverless Function
                                    ↓
                            Astro SSR Handler
                                    ↓
                              Application Logic
                                    ↓
                            Hive Blockchain RPC
```

### Environment Variables
Managed in Vercel dashboard:
- `WAX_RPC_URL` - RPC endpoint
- `SESSION_SECRET` - Session encryption
- `NODE_ENV` - Production flag

## Extending the Application

### Adding a New Feature

1. **Define domain entities** in `/src/domain`
2. **Create use case** in `/src/application`
3. **Implement adapters** in `/src/infrastructure`
4. **Build UI components** in `/src/ui`
5. **Add page route** in `/src/pages`
6. **Update middleware** if authentication required

### Example: Adding Notifications

```typescript
// 1. Domain
class Notification {
  constructor(
    public id: string,
    public message: string,
    public type: 'info' | 'success' | 'error'
  ) {}
}

// 2. Use Case
class NotifyUser {
  execute(message: string, type: string): Notification {
    return new Notification(generateId(), message, type);
  }
}

// 3. Adapter
class LocalStorageNotificationRepository {
  save(notification: Notification): void {
    // Implementation
  }
}

// 4. UI Component
<NotificationToast notification={notification} />

// 5. Page integration
const notification = await notifyUser.execute('Payment sent!', 'success');
```

## Further Reading

- [Getting Started Guide](./GETTING_STARTED.md)
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing Guidelines](../README.md#contributing)

---

This architecture ensures scalability, testability, and maintainability for Aliento Pay.
