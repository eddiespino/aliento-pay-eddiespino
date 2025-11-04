# Aliento Pay

A modern payment processing platform built with Astro, TypeScript, and Tailwind CSS, designed for secure and efficient blockchain-based transactions.

## 🚀 Features

- **Server-Side Rendering**: Built with Astro for optimal performance
- **TypeScript**: Full type safety and better developer experience
- **Tailwind CSS**: Modern, utility-first CSS framework
- **Blockchain Integration**: Support for WAX blockchain and keychain authentication
- **Payment Processing**: Secure payment handling and delegation management
- **Internationalization**: Multi-language support
- **Authentication**: Secure user authentication system
- **Curation System**: Content curation and management features

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build/) - Modern static site generator
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **Blockchain**: [WAX](https://wax.io/) - EOSIO-based blockchain
- **Authentication**: [Keychain SDK](https://github.com/AnchorLink/keychain-sdk) - Secure wallet integration
- **Build Tool**: Node.js with ES modules
- **Code Quality**: ESLint, Prettier, Stylelint

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd aliento-pay
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── application/     # Application layer (use cases, services)
├── domain/         # Domain layer (entities, value objects)
├── infrastructure/ # Infrastructure layer (external services, DB)
├── pages/          # Astro pages and routes
├── layouts/        # Page layouts and templates
├── components/     # Reusable UI components
├── styles/         # Global styles and CSS
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
├── i18n/           # Internationalization
├── authentication/ # Authentication logic
├── payments/       # Payment processing
├── delegations/    # Delegation management
├── curation/       # Content curation
└── services/       # External service integrations
```

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run lint:css` - Run Stylelint
- `npm run lint:css:fix` - Fix Stylelint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run quality` - Run all quality checks
- `npm run quality:fix` - Fix all quality issues

## 🚀 Deployment

### Vercel Deployment

This project is optimized for deployment on Vercel. Follow these steps:

1. **Install Vercel CLI** (optional)

   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**

   ```bash
   # Using Vercel CLI
   vercel

   # Or connect your GitHub repository to Vercel dashboard
   ```

3. **Environment Variables**
   Set the following environment variables in your Vercel dashboard:
   - `WAX_RPC_URL` - Your WAX RPC endpoint
   - `WAX_CHAIN_ID` - WAX blockchain chain ID
   - `SESSION_SECRET` - Secure session secret
   - `NODE_ENV` - Set to "production"

4. **Automatic Deployments**
   - Push to `main` branch triggers production deployment
   - Push to other branches creates preview deployments

### Manual Deployment

```bash
# Build the project
npm run build

# The built files will be in the `dist/` directory
# Deploy the contents of `dist/` to your hosting provider
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Blockchain Configuration
WAX_RPC_URL=your_wax_rpc_url
WAX_CHAIN_ID=your_chain_id

# Application Configuration
NODE_ENV=development
PORT=3000

# Security
SESSION_SECRET=your_session_secret
```

### TypeScript Configuration

The project uses a strict TypeScript configuration with path mapping:

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

## 🎨 Styling

This project uses Tailwind CSS with a custom configuration. Key features:

- **JIT Mode**: Just-in-time compilation for optimal performance
- **Custom Colors**: Brand-specific color palette
- **Dark Mode**: Support for dark/light theme switching
- **Responsive Design**: Mobile-first approach

## 🔒 Security

- **Type Safety**: Full TypeScript coverage
- **Input Validation**: Comprehensive input sanitization
- **Authentication**: Secure blockchain-based authentication
- **HTTPS**: Production-ready with SSL/TLS
- **Environment Variables**: Secure configuration management

## 🧪 Testing

```bash
# Run architecture tests
npm run test:architecture

# Run type checking
npm run type-check
```

## 📚 Documentation

- [Astro Documentation](https://docs.astro.build/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WAX Developer Portal](https://developer.wax.io/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Quality Standards

- All code must pass TypeScript compilation
- ESLint rules must be satisfied
- Prettier formatting must be applied
- Stylelint must pass for CSS/SCSS files

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the documentation in the `docs/` folder
- Review the existing issues and discussions

## 🔄 Version History

- **v0.0.1** - Initial release with core payment functionality

---

Built with ❤️ using modern web technologies
