/**
 * 📦 MODULE SYSTEM
 *
 * Base classes and interfaces for the module system.
 * Each bounded context (authentication, payments, etc.) will have its own module.
 */

import type { Container, Module } from './Container';

/**
 * Abstract base class for modules
 */
export abstract class BaseModule implements Module {
  abstract configure(container: Container): void | Promise<void>;

  protected getEnvironment(container: Container) {
    return container.getEnvironment();
  }

  protected isDevelopment(container: Container): boolean {
    return container.getEnvironment() === 'development';
  }

  protected isProduction(container: Container): boolean {
    return container.getEnvironment() === 'production';
  }

  protected isTest(container: Container): boolean {
    return container.getEnvironment() === 'test';
  }
}

/**
 * Module configuration interface
 */
export interface ModuleConfig {
  readonly enabled: boolean;
  readonly dependencies?: string[];
  readonly [key: string]: any;
}

/**
 * Module metadata
 */
export interface ModuleMetadata {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly author?: string;
}

/**
 * Enhanced module with metadata and configuration
 */
export abstract class ConfigurableModule extends BaseModule {
  abstract readonly metadata: ModuleMetadata;

  constructor(protected readonly config: ModuleConfig) {
    super();
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  getDependencies(): string[] {
    return this.config.dependencies || [];
  }

  getConfig<T = any>(key: string): T | undefined {
    return this.config[key];
  }
}
