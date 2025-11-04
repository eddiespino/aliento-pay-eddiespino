/**
 * 💾 CACHE SERVICE ABSTRACTION
 *
 * Port interface for caching services.
 * Supports multiple implementations (in-memory, Redis, etc.)
 */

export interface CacheKey {
  readonly key: string;
  readonly namespace?: string;
}

export interface CacheOptions {
  readonly ttl?: number; // Time to live in seconds
  readonly tags?: string[]; // For cache invalidation by tags
}

export interface CacheService {
  get<T>(key: CacheKey): Promise<T | null>;
  set<T>(key: CacheKey, value: T, options?: CacheOptions): Promise<void>;
  delete(key: CacheKey): Promise<void>;
  exists(key: CacheKey): Promise<boolean>;
  invalidate(pattern: string): Promise<void>;
  invalidateByTags(tags: string[]): Promise<void>;
  clear(): Promise<void>;
  getStats(): Promise<CacheStats>;
}

export interface CacheStats {
  readonly hits: number;
  readonly misses: number;
  readonly hitRate: number;
  readonly size: number;
  readonly maxSize: number;
}

/**
 * Helper to create cache keys
 */
export function createCacheKey(key: string, namespace?: string): CacheKey {
  return { key, namespace };
}

/**
 * Helper to create namespaced cache keys
 */
export class CacheKeyBuilder {
  constructor(private readonly namespace: string) {}

  key(key: string): CacheKey {
    return createCacheKey(key, this.namespace);
  }

  userKey(username: string, suffix: string): CacheKey {
    return this.key(`user:${username}:${suffix}`);
  }

  listKey(prefix: string, ...parts: string[]): CacheKey {
    return this.key(`${prefix}:${parts.join(':')}`);
  }
}
