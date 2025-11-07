// @ts-check
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Server-side rendering for dynamic content
  adapter: vercel({}),
  integrations: [tailwind()],
  // Internationalization configuration
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false, // /dashboard = English, /es/dashboard = Spanish
    },
  },
  // Vercel optimizations
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    ssr: {
      noExternal: ['@hiveio/wax', 'keychain-sdk'],
    },
  },
});
