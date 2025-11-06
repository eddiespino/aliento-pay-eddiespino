# Getting Started with Aliento Pay

Welcome to Aliento Pay! This guide will help you set up and start using the platform for managing Hive blockchain curation rewards and delegations.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Git** for version control

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd aliento-pay
npm install
```

### 2. Environment Setup

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Hive blockchain RPC endpoint
WAX_RPC_URL=https://api.hive.blog

# Hive blockchain chain ID
WAX_CHAIN_ID=beeab0de00000000000000000000000000000000000000000000000000000000

# Application settings
NODE_ENV=development
PORT=3000

# Security: Generate a strong random secret
SESSION_SECRET=your_secure_random_secret_here
```

**Important:** Generate a secure `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:3000`

## First Login

1. Navigate to `http://localhost:3000`
2. Click "Login with Keychain"
3. Approve the connection in your Hive Keychain browser extension
4. You'll be redirected to the dashboard

## Key Features

### Dashboard
- View all delegations to your account
- Filter by delegation period, minimum HP, and exclusion lists
- See real-time curation statistics

### Calculator
- Calculate fair distribution of curation rewards
- Adjust return percentages with visual sliders
- Preview payment distributions before execution

### Payments
- Execute batch payments (20 transfers per transaction)
- Track payment history in current session
- Secure transactions via Hive Keychain

## Common Tasks

### Running Type Checks

```bash
npm run type-check
```

### Linting and Formatting

```bash
# Check code quality
npm run quality

# Auto-fix issues
npm run quality:fix
```

### Building for Production

```bash
npm run build
npm run preview
```

## Troubleshooting

### Keychain Connection Issues

- Ensure Hive Keychain extension is installed and unlocked
- Try refreshing the page
- Check browser console for errors

### Session Expired

- Sessions expire after inactivity
- Simply log in again with Keychain

### Curation Data Not Loading

- Check your RPC endpoint in `.env`
- Verify your account has delegations
- Clear cache (10-minute TTL)

## Next Steps

- Read the [Architecture Guide](./ARCHITECTURE.md) to understand the codebase
- Check [API Documentation](./API.md) for endpoint details
- Review [Contributing Guidelines](../README.md#contributing) if you want to contribute

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review the main [README.md](../README.md)

---

Happy curating! 🚀
