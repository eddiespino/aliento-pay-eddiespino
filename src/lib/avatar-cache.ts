/**
 * Servicio Global de Cache de Avatares
 * Centraliza la lógica de cache de avatares para toda la aplicación
 * Optimizado para compartir cache entre rutas (/dashboard y /calculate)
 */

export interface AvatarCacheEntry {
  url: string;
  timestamp: number;
  isDefault: boolean;
}

export interface AvatarCacheOptions {
  maxAge?: number; // Tiempo de vida en ms (default: 1 hora)
  maxEntries?: number; // Máximo número de entries en cache (default: 500)
  preloadBatch?: number; // Número de avatares a precargar en batch (default: 20)
}

export class AvatarCacheService {
  private static instance: AvatarCacheService;
  private memoryCache: Map<string, AvatarCacheEntry> = new Map();
  private readonly options: Required<AvatarCacheOptions>;
  private readonly STORAGE_KEY = 'hive_avatars_cache';
  private readonly VERSION_KEY = 'hive_avatars_cache_version';
  private readonly CACHE_VERSION = '1.0.0';

  private constructor(options: AvatarCacheOptions = {}) {
    this.options = {
      maxAge: options.maxAge || 60 * 60 * 1000, // 1 hora
      maxEntries: options.maxEntries || 500,
      preloadBatch: options.preloadBatch || 20,
    };
    
    this.initializeCache();
  }

  static getInstance(options?: AvatarCacheOptions): AvatarCacheService {
    if (!AvatarCacheService.instance) {
      AvatarCacheService.instance = new AvatarCacheService(options);
    }
    return AvatarCacheService.instance;
  }

  /**
   * Inicializa el cache desde localStorage
   */
  private initializeCache(): void {
    try {
      // Verificar versión del cache
      const cacheVersion = localStorage.getItem(this.VERSION_KEY);
      if (cacheVersion !== this.CACHE_VERSION) {
        console.log('🔄 Avatar cache version mismatch, clearing cache');
        this.clearAll();
        localStorage.setItem(this.VERSION_KEY, this.CACHE_VERSION);
        return;
      }

      const cached = localStorage.getItem(this.STORAGE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        const now = Date.now();
        
        // Cargar solo entries que no han expirado
        Object.entries(data).forEach(([username, entry]) => {
          const cacheEntry = entry as AvatarCacheEntry;
          if (now - cacheEntry.timestamp < this.options.maxAge) {
            this.memoryCache.set(username, cacheEntry);
          }
        });
        
        console.log(`📦 Loaded ${this.memoryCache.size} avatar entries from cache`);
      }
    } catch (error) {
      console.warn('⚠️ Error initializing avatar cache:', error);
      this.clearAll();
    }
  }

  /**
   * Genera URL de avatar de Hive
   */
  private generateAvatarUrl(username: string): string {
    if (!username) return '';
    const normalized = username.replace('@', '').trim().toLowerCase();
    return `https://images.hive.blog/u/${normalized}/avatar`;
  }

  /**
   * Obtiene avatar desde cache o genera nuevo
   */
  getAvatarUrl(username: string): string {
    if (!username) return '';
    
    const normalizedUsername = username.trim().toLowerCase();
    const cached = this.memoryCache.get(normalizedUsername);
    
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < this.options.maxAge) {
        return cached.url;
      } else {
        // Entry expirado, remover del cache
        this.memoryCache.delete(normalizedUsername);
      }
    }
    
    // Generar nueva URL y cachear
    const url = this.generateAvatarUrl(normalizedUsername);
    this.setCacheEntry(normalizedUsername, url, false);
    
    return url;
  }

  /**
   * Precarga avatares para múltiples usuarios
   */
  async preloadAvatars(usernames: string[]): Promise<void> {
    if (!usernames || usernames.length === 0) return;
    
    const uniqueUsernames = [...new Set(usernames.map(u => u.trim().toLowerCase()))];
    const uncachedUsers = uniqueUsernames.filter(u => !this.memoryCache.has(u));
    
    if (uncachedUsers.length === 0) {
      console.log('✅ All avatars already cached');
      return;
    }
    
    console.log(`⚡ Preloading ${uncachedUsers.length} avatars...`);
    
    // Procesar en batches para evitar sobrecarga
    const batches = this.chunkArray(uncachedUsers, this.options.preloadBatch);
    
    for (const batch of batches) {
      await this.preloadBatch(batch);
    }
    
    console.log(`✅ Preloaded ${uncachedUsers.length} avatars`);
  }

  /**
   * Precarga un batch de avatares
   */
  private async preloadBatch(usernames: string[]): Promise<void> {
    const promises = usernames.map(username => this.preloadSingleAvatar(username));
    await Promise.allSettled(promises);
  }

  /**
   * Precarga un avatar individual
   */
  private async preloadSingleAvatar(username: string): Promise<void> {
    try {
      const url = this.generateAvatarUrl(username);
      
      // Verificar si la imagen existe
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          this.setCacheEntry(username, url, false);
          resolve();
        };
        
        img.onerror = () => {
          // Marcar como default si no se puede cargar
          this.setCacheEntry(username, url, true);
          reject(new Error(`Failed to load avatar for ${username}`));
        };
        
        img.src = url;
      });
    } catch (error) {
      console.warn(`⚠️ Error preloading avatar for ${username}:`, error);
    }
  }

  /**
   * Establece una entrada en el cache
   */
  private setCacheEntry(username: string, url: string, isDefault: boolean): void {
    const entry: AvatarCacheEntry = {
      url,
      timestamp: Date.now(),
      isDefault,
    };
    
    this.memoryCache.set(username, entry);
    this.maintainCacheSize();
    this.persistToStorage();
  }

  /**
   * Mantiene el tamaño del cache dentro de los límites
   */
  private maintainCacheSize(): void {
    if (this.memoryCache.size > this.options.maxEntries) {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remover las entradas más antiguas
      const toRemove = entries.slice(0, this.memoryCache.size - this.options.maxEntries);
      toRemove.forEach(([username]) => this.memoryCache.delete(username));
      
      console.log(`🧹 Cleaned ${toRemove.length} old avatar cache entries`);
    }
  }

  /**
   * Persiste el cache en localStorage
   */
  private persistToStorage(): void {
    try {
      const data = Object.fromEntries(this.memoryCache.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ Error persisting avatar cache:', error);
      // Si hay error de espacio, limpiar cache antiguo
      this.clearExpiredEntries();
      try {
        const data = Object.fromEntries(this.memoryCache.entries());
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      } catch (retryError) {
        console.warn('⚠️ Retry persisting avatar cache failed:', retryError);
      }
    }
  }

  /**
   * Limpia entradas expiradas del cache
   */
  clearExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.memoryCache.forEach((entry, username) => {
      if (now - entry.timestamp > this.options.maxAge) {
        expiredKeys.push(username);
      }
    });
    
    expiredKeys.forEach(key => this.memoryCache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleared ${expiredKeys.length} expired avatar cache entries`);
      this.persistToStorage();
    }
  }

  /**
   * Limpia todo el cache
   */
  clearAll(): void {
    this.memoryCache.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.VERSION_KEY);
    console.log('🧹 Cleared all avatar cache');
  }

  /**
   * Obtiene estadísticas del cache
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number | null;
  } {
    const entries = Array.from(this.memoryCache.values());
    const oldestEntry = entries.length > 0 
      ? Math.min(...entries.map(e => e.timestamp))
      : null;
    
    return {
      size: this.memoryCache.size,
      maxSize: this.options.maxEntries,
      hitRate: 0, // TODO: Implementar tracking de hit rate
      oldestEntry,
    };
  }

  /**
   * Utility: Divide array en chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Función helper para obtener la instancia global
export const getAvatarCache = (options?: AvatarCacheOptions): AvatarCacheService => {
  return AvatarCacheService.getInstance(options);
};

// Función helper para obtener avatar URL de forma síncrona
export const getAvatarUrl = (username: string): string => {
  return getAvatarCache().getAvatarUrl(username);
};

// Función helper para precargar avatares
export const preloadAvatars = async (usernames: string[]): Promise<void> => {
  return getAvatarCache().preloadAvatars(usernames);
};