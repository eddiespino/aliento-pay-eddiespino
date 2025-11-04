import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';

export default [
  // Base ESLint configuration
  eslint.configs.recommended,
  
  // TypeScript configuration
  ...tseslint.configs.recommended,
  
  // Astro configuration
  ...astro.configs.recommended,
  
  // Custom rules for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  
  // Custom rules for JavaScript files
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  
  // Browser environment for client-side JavaScript files
  {
    files: ['**/debug/**/*.js', '**/lib/**/*.js', 'src/pages/index.astro'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        setTimeout: 'readonly',
        URLSearchParams: 'readonly',
        URL: 'readonly',
      },
    },
  },
  
  // Prettier configuration (disable conflicting rules)
  prettier,
  
  // Ignore patterns
  {
    ignores: [
      'dist/**/*',
      '.astro/**/*',
      'node_modules/**/*',
      '**/*.d.ts',
    ],
  },
];
