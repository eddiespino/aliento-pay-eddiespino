/**
 * 📦 KERNEL EXPORTS
 *
 * Public API for the application kernel and shared services.
 */

// Core kernel
export {
  AppKernel,
  initializeApp,
  getAppKernel,
  shutdownApp,
  getAppContainer,
  SHARED_TOKENS,
} from './AppKernel';
export type { AppKernelConfig } from './AppKernel';

// Container system
export {
  Container,
  getContainer,
  setContainer,
  resetContainer,
  createServiceToken,
} from './Container';
export type {
  ServiceToken,
  ServiceProvider,
  ServiceFactory,
  Module,
  Environment,
} from './Container';

// Module system
export { BaseModule, ConfigurableModule } from './Module';
export type { ModuleConfig, ModuleMetadata } from './Module';

// Event system
export { InMemoryEventBus, BaseDomainEvent, BaseEventHandler, TypedEventHandler } from './EventBus';
export type { DomainEvent, EventHandler, EventBus } from './EventBus';

// Cache system
export type {
  CacheService,
  CacheKey,
  CacheOptions,
  CacheStats,
} from '../adapters/cache/CacheService';
export { createCacheKey, CacheKeyBuilder } from '../adapters/cache/CacheService';
export { InMemoryCache } from '../adapters/cache/InMemoryCache';
