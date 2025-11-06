# API Documentation

This document describes the API endpoints available in Aliento Pay.

## Base URL

```
Development: http://localhost:3000
Production: https://your-deployment-url.vercel.app
```

## Authentication

All authenticated endpoints require a valid session cookie. Authentication is handled via Hive Keychain.

### Headers

```http
Cookie: session=<encrypted-session-token>
Content-Type: application/json
```

---

## Authentication Endpoints

### POST /api/auth/login

Authenticate a user with Hive Keychain.

**Request Body:**

```json
{
  "username": "string"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "username": "string",
    "authenticated": true
  }
}
```

**Response (401 Unauthorized):**

```json
{
  "success": false,
  "error": "Authentication failed"
}
```

**Example:**

```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ username: 'myusername' })
});

const data = await response.json();
```

---

### GET /api/auth/validate

Validate the current session.

**Response (200 OK):**

```json
{
  "valid": true,
  "user": {
    "username": "string",
    "authenticated": true
  }
}
```

**Response (401 Unauthorized):**

```json
{
  "valid": false,
  "error": "Session invalid or expired"
}
```

---

### GET /api/auth/logout

Log out the current user and destroy the session.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Curation Endpoints

### GET /api/curation-stats

Get curation statistics for a user.

**Query Parameters:**

- `username` (required): Hive username
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "username": "string",
    "totalRewards": "number",
    "rewardsPending": "number",
    "rewardsClaimed": "number",
    "averageDailyRewards": "number",
    "delegations": [
      {
        "delegator": "string",
        "vestingShares": "number",
        "hivePower": "number",
        "timestamp": "string"
      }
    ],
    "statistics": {
      "totalDelegators": "number",
      "totalHivePower": "number",
      "activeDelegations": "number"
    }
  }
}
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Username is required"
}
```

**Example:**

```javascript
const response = await fetch(
  '/api/curation-stats?username=myusername&startDate=2025-01-01'
);
const data = await response.json();
```

---

## Payment Endpoints

### POST /api/calculate

Calculate payment distributions based on delegations and filters.

**Request Body:**

```json
{
  "username": "string",
  "filters": {
    "minHivePower": "number",
    "delegationPeriod": "7d | 30d | all",
    "excludeList": ["string"]
  },
  "adjustments": {
    "percentage": "number",
    "hpPercentage": "number"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "distributions": [
      {
        "delegator": "string",
        "amount": "number",
        "percentage": "number",
        "hivePower": "number"
      }
    ],
    "totals": {
      "totalAmount": "number",
      "totalHivePower": "number",
      "numberOfRecipients": "number"
    },
    "metadata": {
      "calculatedAt": "string",
      "appliedFilters": "object"
    }
  }
}
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Invalid request parameters"
}
```

**Example:**

```javascript
const response = await fetch('/api/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'myusername',
    filters: {
      minHivePower: 100,
      delegationPeriod: '30d',
      excludeList: ['badactor1', 'badactor2']
    },
    adjustments: {
      percentage: 95,
      hpPercentage: 10
    }
  })
});

const data = await response.json();
```

---

### POST /api/payments/execute

Execute batch payments (requires Keychain signing).

**Request Body:**

```json
{
  "payments": [
    {
      "to": "string",
      "amount": "number",
      "memo": "string"
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "transactionId": "string",
    "paymentsProcessed": "number",
    "totalAmount": "number",
    "timestamp": "string"
  }
}
```

**Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Invalid payment data"
}
```

**Response (402 Payment Required):**

```json
{
  "success": false,
  "error": "Insufficient balance"
}
```

---

## Filter Endpoints

### POST /api/filters

Save user filter preferences.

**Request Body:**

```json
{
  "username": "string",
  "filters": {
    "minHivePower": "number",
    "delegationPeriod": "string",
    "excludeList": ["string"]
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Filters saved successfully"
}
```

---

### GET /api/filters

Get saved filter preferences.

**Query Parameters:**

- `username` (required): Hive username

**Response (200 OK):**

```json
{
  "success": true,
  "filters": {
    "minHivePower": "number",
    "delegationPeriod": "string",
    "excludeList": ["string"]
  }
}
```

---

## Error Responses

All endpoints may return these common error responses:

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "Access denied"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

---

## Rate Limiting

API endpoints are subject to rate limiting:

- **Rate:** 100 requests per 15 minutes per IP
- **Headers:**
  - `X-RateLimit-Limit`: Total allowed requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

**Response (429 Too Many Requests):**

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": "number (seconds)"
}
```

---

## Caching

Curation data is cached for 10 minutes per user:

- Cache is stored server-side in memory
- Cache key: `curation-${username}`
- TTL: 600 seconds (10 minutes)
- Cache headers: `Cache-Control: private, max-age=600`

---

## Webhooks (Future)

Webhook support is planned for future releases:

- Payment completion notifications
- Delegation change events
- Curation milestone alerts

---

## SDK Examples

### JavaScript/TypeScript

```typescript
class AlientoPayClient {
  constructor(private baseUrl: string) {}

  async login(username: string) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return response.json();
  }

  async getCurationStats(username: string) {
    const response = await fetch(
      `${this.baseUrl}/api/curation-stats?username=${username}`
    );
    return response.json();
  }

  async calculatePayments(data: any) {
    const response = await fetch(`${this.baseUrl}/api/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

// Usage
const client = new AlientoPayClient('https://aliento-pay.vercel.app');
const stats = await client.getCurationStats('myusername');
```

---

## Additional Resources

- [Getting Started Guide](./GETTING_STARTED.md)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

For questions or issues with the API, please open an issue on GitHub.
