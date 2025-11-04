/**
 * 🧠 IN-MEMORY CACHE IMPLEMENTATION
 *
 * Simple in-memory cache with TTL support.
 * Good for development and small-scale production.
 */

import type { CacheService, CacheKey, CacheOptions, CacheStats } from './CacheService';

interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
  tags?: string[];
}

export class InMemoryCache implements CacheService {
  private readonly cache = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;

  constructor(private readonly maxSize: number = 1000) {}

  async get<T>(key: CacheKey): Promise<T | null> {
    const fullKey = this.buildKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(fullKey);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  async set<T>(key: CacheKey, value: T, options?: CacheOptions): Promise<void> {
    const fullKey = this.buildKey(key);

    // Evict oldest entries if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(fullKey)) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      value,
      tags: options?.tags,
    };

    if (options?.ttl) {
      entry.expiresAt = Date.now() + options.ttl * 1000;
    }

    this.cache.set(fullKey, entry);
  }

  async delete(key: CacheKey): Promise<void> {
    const fullKey = this.buildKey(key);
    this.cache.delete(fullKey);
  }

  async exists(key: CacheKey): Promise<boolean> {
    const fullKey = this.buildKey(key);
    const entry = this.cache.get(fullKey);

    if (!entry) return false;

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(fullKey);
      return false;
    }

    return true;
  }

  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    const keysToDelete: string[] = [];

    for (const key of Array.from(this.cache.keys())) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = [];

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  async getStats(): Promise<CacheStats> {
    // Clean expired entries first
    await this.cleanExpired();

    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }

  private buildKey(key: CacheKey): string {
    return key.namespace ? `${key.namespace}:${key.key}` : key.key;
  }

  private evictOldest(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
    }
  }

  private async cleanExpired(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.expiresAt && now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}
