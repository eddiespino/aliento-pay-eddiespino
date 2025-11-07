# Aliento Pay

A modern two-portal platform for Hive blockchain delegation and curation rewards management. Built with Astro, TypeScript, and Tailwind CSS.

![Aliento Pay](https://files.peakd.com/file/peakd-hive/aliento/1000911907.jpg)

## 🌟 Overview

Aliento Pay is a comprehensive platform that serves two distinct user groups:

1. **Delegator Portal** 🟠 - Public-facing portal where users can delegate Hive Power to @aliento and earn rewards
2. **Curator Dashboard** 🔵 - Administrative dashboard for managing delegations and distributing curation rewards

## ✨ Features

### Delegator Portal
- **Real-time Earnings Calculator** - Calculate daily, weekly, monthly, and yearly earnings based on HP delegation (8.5% APR)
- **Payment Preferences** - Choose how you receive rewards:
  - 💰 **HIVE** - Liquid HIVE tokens
  - 💵 **HBD** - Hive Backed Dollars (stablecoin)
  - ⚡ **HP** - Automatic power-up to Hive Power
  - ❤️ **DONATE** - Donate earnings to support Aliento
- **On-Chain Preference Storage** - Preferences saved to Hive blockchain via custom_json operations
- **Direct Delegation** - Delegate HP to @aliento directly through Hive Keychain
- **Transparent APR** - Current 8.5% annual percentage rate with real-time calculations

### Curator Dashboard
- **Delegation Management** - View and manage all delegators to @aliento
- **Curation Stats** - Real-time curation reward statistics (24h, 7d, 30d)
- **Distribution Calculator** - Calculate reward distribution based on delegation percentages
- **Batch Payments** - Send rewards to multiple delegators efficiently
- **Custom Memos** - Personalized payment memos with template support
- **Payment History** - Track all payment transactions

### Technical Features
- 🌐 **Internationalization** - Full support for English and Spanish
- 🔐 **Hive Keychain Integration** - Secure authentication and transactions
- 🌙 **Dark Mode** - Automatic theme switching
- 📱 **Responsive Design** - Mobile-first approach
- ⚡ **Performance Optimized** - Built with Astro for lightning-fast page loads
- 🎨 **Anakiwa Branding** - Consistent color scheme matching Aliento's brand

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build/) v5.11.0 - Modern static site generator with SSR
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Blockchain**: [Hive](https://hive.io/) - Decentralized social blockchain
- **Wallet Integration**: [Hive Keychain](https://hive-keychain.com/) - Secure wallet for signing transactions
- **API Client**: [@hiveio/wax](https://www.npmjs.com/package/@hiveio/wax) - Hive blockchain API wrapper
- **Build Tool**: Vite - Next-generation frontend tooling

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Hive Keychain browser extension (for testing wallet features)

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/aliento-pay.git
   cd aliento-pay-eddiespino
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:4321`

## 🏗️ Project Structure

```
src/
├── pages/                 # Astro pages and routes
│   ├── index.astro       # Landing page with dual portal cards
│   ├── delegate.astro    # Delegator portal (calculator & preferences)
│   ├── login.astro       # Curator login page
│   ├── dashboard.astro   # Curator dashboard
│   ├── calculate.astro   # Distribution calculator
│   └── payments.astro    # Batch payment processor
├── layouts/              # Page layouts
│   └── Layout.astro     # Base layout with theme support
├── ui/                   # UI components
│   ├── base/            # Base components (BrandCard, BrandNav, etc.)
│   └── components/      # Feature components (header, tables, etc.)
├── lib/                  # Core business logic
│   ├── earnings-calculator.ts      # APR calculations
│   ├── preference-storage.ts       # On-chain preference management
│   ├── get-delegations.ts          # Delegation data fetching
│   └── api-curation-rewards.ts     # Curation reward calculations
├── i18n/                 # Internationalization
│   ├── index.ts         # i18n utilities
│   ├── en.json          # English translations
│   └── es.json          # Spanish translations
└── middleware.ts         # Authentication & routing middleware
```

## 🚀 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run astro` - Run Astro CLI commands

## 🎯 Key Pages

### Landing Page (`/`)
- Hero section with animated background
- Two portal cards (Delegator & Curator)
- Language switcher (EN/ES)
- How it works section
- FAQ section

### Delegator Portal (`/delegate`)
- Earnings calculator with HP input
- Payment preference selector
- Current delegation display
- Hive Keychain connection
- Save preferences to blockchain

### Curator Dashboard (`/dashboard`)
- Protected route (authentication required)
- Real-time curation statistics
- Quick action cards
- Navigation to calculate and payments

### Distribution Calculator (`/calculate`)
- Filter delegators by HP range and time period
- Calculate distribution percentages
- Export to payments page

### Batch Payments (`/payments`)
- Review and edit payment list
- Batch processing (customize batch size)
- Custom memo templates
- Real-time payment status

## 🔐 Authentication

The platform uses Hive Keychain for secure authentication:

1. **Delegators** - Can view calculator without login, but need Keychain to:
   - Save payment preferences to blockchain
   - Delegate HP to @aliento

2. **Curators** - Must authenticate with Keychain to access:
   - Dashboard
   - Distribution calculator
   - Payment processor

## 🌐 Internationalization

The platform supports English and Spanish with real-time language switching:

```javascript
// Translation files
src/i18n/en.json  // English translations
src/i18n/es.json  // Spanish translations

// Usage in components
const t = (key: string) => getTranslation(currentLocale, key);
```

## 🎨 Branding & Colors

### Color Scheme

- **Anakiwa Blue** (`#09b1ee`) - Primary brand color, used for Curator features
- **Orange** (`#f97316`) - Secondary color, used for Delegator features
- **Dark Mode** - Automatic theme switching with CSS variables

### Design System

- **Cards**: `BrandCard.astro` - Consistent card component with Anakiwa accents
- **Navigation**: `BrandNav.astro` - Responsive navigation with active state
- **Buttons**: Gradient effects with hover animations
- **Shadows**: Colored shadows matching button/card themes

## 🔄 Hive Blockchain Integration

### Custom JSON Operations

Delegator preferences are stored on-chain using `custom_json` operations:

```typescript
// Custom JSON ID
const ALIENTO_PREFERENCE_ID = 'aliento_pay_preference';

// Preference structure
interface DelegatorPreference {
  username: string;
  paymentType: 'HIVE' | 'HBD' | 'HP' | 'DONATE';
  delegatedHP: number;
  updatedAt: string;
}
```

### Delegation Queries

```typescript
// Get current delegation to @aliento
const delegation = await getCurrentDelegation(username);

// Get account history for preferences
const preference = await fetchPreferenceFromChain(username);
```

## 📊 Curation Rewards Calculation

The platform uses the Hive account history API to calculate curation rewards:

```typescript
// Time periods
- 24 hours (daily)
- 7 days (weekly)
- 30 days (monthly)

// Calculates from curation_reward operations
- Converts VESTS to HP
- Aggregates by time period
- Caches results for performance
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect GitHub repository to Vercel**
2. **Configure build settings:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables:**
   - `NODE_ENV=production`

4. **Deploy** - Automatic deployments on push to main branch

### Manual Deployment

```bash
# Build the project
npm run build

# The built files will be in dist/
# Deploy dist/ to your hosting provider
```

## 🔒 Security Features

- **Authentication Middleware** - Protected routes for curator dashboard
- **Client-Side Keychain** - No private keys stored on server
- **LocalStorage Caching** - Preferences cached locally for performance
- **On-Chain Verification** - All preferences verifiable on Hive blockchain
- **Type Safety** - Full TypeScript coverage

## 🐛 Known Issues & Limitations

- **VESTS to HP Conversion** - Uses approximate ratio (1 HP ≈ 2000 VESTS). For exact conversion, query `get_dynamic_global_properties`
- **APR Updates** - APR is currently hardcoded at 8.5%, may change with Hive hardforks
- **Keychain Required** - Users must have Hive Keychain installed for wallet operations

## 📝 Environment Variables

```env
# No environment variables required for basic functionality
# All configuration is in code or fetched from Hive blockchain
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- TypeScript for type safety
- Prettier for code formatting
- Tailwind CSS for styling (no custom CSS unless necessary)
- Astro components for pages
- Inline scripts for client-side interactivity (no external TS imports in `<script>` tags)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Hive**: [@aliento](https://peakd.com/@aliento)
- **GitHub Issues**: [Create an issue](https://github.com/yourusername/aliento-pay/issues)
- **Documentation**: Check the `/docs` folder

## 🙏 Acknowledgments

- **Aliento Community** - For supporting content creators on Hive
- **Hive Blockchain** - For providing the infrastructure
- **Astro Team** - For the amazing framework
- **Hive Keychain** - For secure wallet integration

## 📈 Roadmap

- [ ] Add support for multiple delegation targets
- [ ] Implement payment history dashboard
- [ ] Add analytics and charts
- [ ] Support for recurring automatic payments
- [ ] Mobile app (React Native)
- [ ] Integration with HiveSigner as alternative to Keychain

---

**Built with ❤️ for the Hive community**

**Powered by [Aliento](https://peakd.com/@aliento) • [Hive Blockchain](https://hive.io/)**
