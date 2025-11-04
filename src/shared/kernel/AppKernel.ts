/**
 * 🚀 APPLICATION KERNEL
 *
 * Main application bootstrapper for the new architecture.
 * Configures and initializes all modules and their dependencies.
 */

import { Container, getContainer, setContainer } from './Container';
import type { Module } from './Container';
import { InMemoryEventBus } from './EventBus';
import type { EventBus } from './EventBus';

// Shared services
import { InMemoryCache } from '../adapters/cache/InMemoryCache';
import type { CacheService } from '../adapters/cache/CacheService';

// Modules
import { AuthModule } from '../../authentication/config/AuthModule';

// Service tokens for shared services
import { createServiceToken } from './Container';

export const SHARED_TOKENS = {
  EventBus: createServiceToken<EventBus>('EventBus'),
  CacheService: createServiceToken<CacheService>('CacheService'),
} as const;

export interface AppKernelConfig {
  environment?: 'development' | 'production' | 'test';
  enableEventBus?: boolean;
  cacheMaxSize?: number;
  modules?: Module[];
}

export class AppKernel {
  private container: Container;
  private initialized = false;

  constructor(private readonly config: AppKernelConfig = {}) {
    const env = config.environment || 'development';
    this.container = new Container(env);
  }

  /**
   * Initialize the application kernel
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 1. Configure shared services
      await this.configureSharedServices();

      // 2. Register core modules
      await this.registerCoreModules();

      // 3. Register custom modules
      await this.registerCustomModules();

      // 4. Configure all registered modules
      await this.container.configure();

      // 5. Set as global container
      setContainer(this.container);

      this.initialized = true;

      console.log('🚀 Aliento Pay - Application Kernel initialized successfully');
      console.log(`📊 Environment: ${this.container.getEnvironment()}`);
      console.log(`📦 Registered services: ${this.container.getRegisteredServices().length}`);
    } catch (error) {
      console.error('❌ Failed to initialize Application Kernel:', error);
      throw error;
    }
  }

  /**
   * Get the configured container
   */
  getContainer(): Container {
    if (!this.initialized) {
      throw new Error('AppKernel must be initialized before getting container');
    }
    return this.container;
  }

  /**
   * Shutdown the kernel (cleanup resources)
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      // Clear event bus
      const eventBus = await this.container.resolve(SHARED_TOKENS.EventBus);
      if (eventBus instanceof InMemoryEventBus) {
        eventBus.clearHandlers();
      }

      // Clear cache
      const cache = await this.container.resolve(SHARED_TOKENS.CacheService);
      await cache.clear();

      // Clear container singletons
      this.container.clearSingletons();

      this.initialized = false;

      console.log('🛑 Application Kernel shutdown complete');
    } catch (error) {
      console.error('❌ Error during kernel shutdown:', error);
    }
  }

  private async configureSharedServices(): Promise<void> {
    // Event Bus
    if (this.config.enableEventBus !== false) {
      this.container.registerSingleton(SHARED_TOKENS.EventBus, {
        create: () => new InMemoryEventBus(),
      });
    }

    // Cache Service
    this.container.registerSingleton(SHARED_TOKENS.CacheService, {
      create: () => new InMemoryCache(this.config.cacheMaxSize || 1000),
    });
  }

  private async registerCoreModules(): Promise<void> {
    // Authentication Module
    const authModule = new AuthModule();
    this.container.registerModule(authModule);
  }

  private async registerCustomModules(): Promise<void> {
    if (this.config.modules) {
      for (const module of this.config.modules) {
        this.container.registerModule(module);
      }
    }
  }
}

/**
 * Global kernel instance
 */
let globalKernel: AppKernel | null = null;

/**
 * Initialize the application kernel
 */
export async function initializeApp(config?: AppKernelConfig): Promise<AppKernel> {
  if (globalKernel) {
    return globalKernel;
  }

  globalKernel = new AppKernel(config);
  await globalKernel.initialize();

  return globalKernel;
}

/**
 * Get the global kernel instance
 */
export function getAppKernel(): AppKernel {
  if (!globalKernel) {
    throw new Error('Application kernel not initialized. Call initializeApp() first.');
  }
  return globalKernel;
}

/**
 * Shutdown the application
 */
export async function shutdownApp(): Promise<void> {
  if (globalKernel) {
    await globalKernel.shutdown();
    globalKernel = null;
  }
}

/**
 * Get container from global kernel
 */
export function getAppContainer(): Container {
  return getAppKernel().getContainer();
}
