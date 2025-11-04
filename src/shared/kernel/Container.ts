/**
 * 🔧 ENHANCED DEPENDENCY INJECTION CONTAINER
 *
 * Features:
 * - Environment-aware configuration
 * - Lazy loading support
 * - Factory pattern support
 * - Async resolution
 * - Module system
 * - Type-safe tokens
 */

export type Environment = 'development' | 'production' | 'test';

export interface ServiceToken<T = any> {
  readonly name: string;
  readonly description?: string;
}

export interface ServiceProvider<T> {
  create(container: Container): T | Promise<T>;
  singleton?: boolean;
}

export interface ServiceFactory<T> {
  (container: Container): T | Promise<T>;
}

export interface Module {
  configure(container: Container): void | Promise<void>;
}

export class Container {
  private readonly providers = new Map<string, ServiceProvider<any>>();
  private readonly singletons = new Map<string, any>();
  private readonly modules: Module[] = [];

  constructor(private readonly environment: Environment = 'development') {}

  /**
   * Register a service provider
   */
  register<T>(token: ServiceToken<T>, provider: ServiceProvider<T>): void {
    this.providers.set(token.name, provider);
  }

  /**
   * Register a factory function
   */
  registerFactory<T>(
    token: ServiceToken<T>,
    factory: ServiceFactory<T>,
    singleton: boolean = false
  ): void {
    this.register(token, { create: factory, singleton });
  }

  /**
   * Register a singleton instance
   */
  registerSingleton<T>(token: ServiceToken<T>, provider: ServiceProvider<T>): void {
    this.register(token, { ...provider, singleton: true });
  }

  /**
   * Register a module
   */
  registerModule(module: Module): void {
    this.modules.push(module);
  }

  /**
   * Resolve a service (with lazy loading and caching)
   */
  async resolve<T>(token: ServiceToken<T>): Promise<T> {
    const provider = this.providers.get(token.name);

    if (!provider) {
      throw new Error(`Service not registered: ${token.name}`);
    }

    // Return singleton if exists
    if (provider.singleton && this.singletons.has(token.name)) {
      return this.singletons.get(token.name);
    }

    // Create instance
    const instance = await provider.create(this);

    // Cache singleton
    if (provider.singleton) {
      this.singletons.set(token.name, instance);
    }

    return instance;
  }

  /**
   * Resolve synchronously (for non-async services)
   */
  resolveSync<T>(token: ServiceToken<T>): T {
    const provider = this.providers.get(token.name);

    if (!provider) {
      throw new Error(`Service not registered: ${token.name}`);
    }

    // Return singleton if exists
    if (provider.singleton && this.singletons.has(token.name)) {
      return this.singletons.get(token.name);
    }

    // Create instance synchronously
    const instance = provider.create(this);

    if (instance instanceof Promise) {
      throw new Error(`Service ${token.name} is async, use resolve() instead`);
    }

    // Cache singleton
    if (provider.singleton) {
      this.singletons.set(token.name, instance);
    }

    return instance;
  }

  /**
   * Configure all registered modules
   */
  async configure(): Promise<void> {
    for (const module of this.modules) {
      await module.configure(this);
    }
  }

  /**
   * Get environment
   */
  getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Check if service is registered
   */
  isRegistered<T>(token: ServiceToken<T>): boolean {
    return this.providers.has(token.name);
  }

  /**
   * Clear all singletons (useful for testing)
   */
  clearSingletons(): void {
    this.singletons.clear();
  }

  /**
   * Get all registered service names
   */
  getRegisteredServices(): string[] {
    return Array.from(this.providers.keys());
  }
}

/**
 * Helper to create typed service tokens
 */
export function createServiceToken<T>(name: string, description?: string): ServiceToken<T> {
  return { name, description };
}

/**
 * Global container instance
 */
let globalContainer: Container | null = null;

export function getContainer(): Container {
  if (!globalContainer) {
    const env = (process.env.NODE_ENV as Environment) || 'development';
    globalContainer = new Container(env);
  }
  return globalContainer;
}

export function setContainer(container: Container): void {
  globalContainer = container;
}

/**
 * Reset container (useful for testing)
 */
export function resetContainer(): void {
  globalContainer = null;
}
