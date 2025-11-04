/**
 * 🗄️ SISTEMA DE CACHÉ POR USUARIO
 * 
 * Maneja el caché de datos específico por usuario autenticado.
 * Incluye el username como parte de las claves para evitar contaminación entre usuarios.
 */

import { getCurrentAuthenticatedUser } from './guards';

/**
 * Tipos de datos cacheables por usuario
 */
export type CacheableDataType = 
  | 'curation_stats' 
  | 'delegation_stats' 
  | 'dashboard_data' 
  | 'calculate_results'
  | 'payment_config'
  | 'user_preferences';

/**
 * Configuración de TTL (tiempo de vida) por tipo de dato
 */
const CACHE_TTL: Record<CacheableDataType, number> = {
  curation_stats: 10 * 60 * 1000, // 10 minutos
  delegation_stats: 15 * 60 * 1000, // 15 minutos
  dashboard_data: 15 * 60 * 1000, // 15 minutos
  calculate_results: 5 * 60 * 1000, // 5 minutos
  payment_config: 60 * 60 * 1000, // 1 hora
  user_preferences: 24 * 60 * 60 * 1000, // 24 horas
};

/**
 * Estructura de datos en caché
 */
export interface CachedData<T = any> {
  data: T;
  timestamp: number;
  user: string;
  version: string;
  ttl: number;
}

/**
 * ✅ Clase principal del sistema de caché por usuario
 */
export class UserCacheManager {
  private readonly version = '1.0.0';

  /**
   * Genera clave de caché específica por usuario
   */
  private generateCacheKey(dataType: CacheableDataType, user: string, subKey?: string): string {
    const baseKey = `${dataType}_${user}`;
    return subKey ? `${baseKey}_${subKey}` : baseKey;
  }

  /**
   * Valida que el usuario tenga acceso a los datos
   */
  private validateUserAccess(cachedUser: string, currentUser: string): boolean {
    return cachedUser === currentUser;
  }

  /**
   * Verifica si los datos han expirado
   */
  private isExpired(cached: CachedData, dataType: CacheableDataType): boolean {
    const age = Date.now() - cached.timestamp;
    return age > CACHE_TTL[dataType];
  }

  /**
   * ✅ Obtener datos del caché para el usuario autenticado
   */
  get<T>(dataType: CacheableDataType, subKey?: string): T | null {
    try {
      const currentUser = getCurrentAuthenticatedUser();
      if (!currentUser) {
        console.warn('⚠️ UserCache: Usuario no autenticado, no se puede acceder al caché');
        return null;
      }

      const cacheKey = this.generateCacheKey(dataType, currentUser, subKey);
      const cachedItem = localStorage.getItem(cacheKey);

      if (!cachedItem) {
        return null;
      }

      const cached: CachedData<T> = JSON.parse(cachedItem);

      // Verificar acceso del usuario
      if (!this.validateUserAccess(cached.user, currentUser)) {
        console.warn(`⚠️ UserCache: Acceso denegado a datos de usuario diferente`);
        this.remove(dataType, subKey); // Limpiar datos no válidos
        return null;
      }

      // Verificar expiración
      if (this.isExpired(cached, dataType)) {
        console.log(`⏰ UserCache: Datos expirados para ${dataType}, limpiando...`);
        this.remove(dataType, subKey);
        return null;
      }

      console.log(`✅ UserCache: Datos obtenidos del caché para ${currentUser}:${dataType}`);
      return cached.data;

    } catch (error) {
      console.error('❌ UserCache: Error obteniendo datos del caché:', error);
      return null;
    }
  }

  /**
   * ✅ Guardar datos en caché para el usuario autenticado
   */
  set<T>(dataType: CacheableDataType, data: T, subKey?: string): boolean {
    try {
      const currentUser = getCurrentAuthenticatedUser();
      if (!currentUser) {
        console.warn('⚠️ UserCache: Usuario no autenticado, no se puede guardar en caché');
        return false;
      }

      const cacheKey = this.generateCacheKey(dataType, currentUser, subKey);
      const cachedData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        user: currentUser,
        version: this.version,
        ttl: CACHE_TTL[dataType]
      };

      localStorage.setItem(cacheKey, JSON.stringify(cachedData));
      console.log(`✅ UserCache: Datos guardados para ${currentUser}:${dataType}`);
      return true;

    } catch (error) {
      console.error('❌ UserCache: Error guardando datos en caché:', error);
      return false;
    }
  }

  /**
   * ✅ Remover datos del caché
   */
  remove(dataType: CacheableDataType, subKey?: string): boolean {
    try {
      const currentUser = getCurrentAuthenticatedUser();
      if (!currentUser) {
        return false;
      }

      const cacheKey = this.generateCacheKey(dataType, currentUser, subKey);
      localStorage.removeItem(cacheKey);
      console.log(`🗑️ UserCache: Datos removidos para ${currentUser}:${dataType}`);
      return true;

    } catch (error) {
      console.error('❌ UserCache: Error removiendo datos del caché:', error);
      return false;
    }
  }

  /**
   * ✅ Limpiar todo el caché del usuario actual
   */
  clearUserCache(): void {
    try {
      const currentUser = getCurrentAuthenticatedUser();
      if (!currentUser) {
        return;
      }

      const keysToRemove: string[] = [];
      
      // Buscar todas las claves que pertenecen al usuario
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(`_${currentUser}`)) {
          keysToRemove.push(key);
        }
      }

      // Remover todas las claves encontradas
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`🧹 UserCache: Caché limpiado para usuario ${currentUser} (${keysToRemove.length} elementos)`);

    } catch (error) {
      console.error('❌ UserCache: Error limpiando caché de usuario:', error);
    }
  }

  /**
   * ✅ Limpiar caché de usuario específico (para cambio de usuario)
   */
  clearCacheForUser(username: string): void {
    try {
      const keysToRemove: string[] = [];
      
      // Buscar todas las claves que pertenecen al usuario específico
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(`_${username}`)) {
          keysToRemove.push(key);
        }
      }

      // Remover todas las claves encontradas
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`🧹 UserCache: Caché limpiado para usuario específico ${username} (${keysToRemove.length} elementos)`);

    } catch (error) {
      console.error('❌ UserCache: Error limpiando caché de usuario específico:', error);
    }
  }

  /**
   * ✅ Limpiar caché expirado de todos los usuarios
   */
  cleanupExpiredCache(): number {
    try {
      let cleanedCount = 0;
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        // Solo procesar claves que parecen ser de nuestro sistema de caché
        const dataTypes = Object.keys(CACHE_TTL) as CacheableDataType[];
        const isOurCacheKey = dataTypes.some(type => key.startsWith(type));
        
        if (!isOurCacheKey) continue;

        try {
          const cachedItem = localStorage.getItem(key);
          if (!cachedItem) continue;

          const cached: CachedData = JSON.parse(cachedItem);
          
          // Determinar tipo de dato desde la clave
          const dataType = dataTypes.find(type => key.startsWith(type));
          if (!dataType) continue;

          // Verificar expiración
          if (this.isExpired(cached, dataType)) {
            keysToRemove.push(key);
          }

        } catch (parseError) {
          // Si no se puede parsear, probablemente está corrupto, removelo
          keysToRemove.push(key);
        }
      }

      // Remover claves expiradas o corruptas
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        cleanedCount++;
      });

      if (cleanedCount > 0) {
        console.log(`🧹 UserCache: Limpieza automática completada (${cleanedCount} elementos expirados removidos)`);
      }

      return cleanedCount;

    } catch (error) {
      console.error('❌ UserCache: Error en limpieza automática:', error);
      return 0;
    }
  }

  /**
   * ✅ Obtener información del caché para debugging
   */
  getCacheInfo(): {
    totalItems: number;
    userItems: number;
    currentUser: string | null;
    itemsByType: Record<CacheableDataType, number>;
  } {
    const currentUser = getCurrentAuthenticatedUser();
    let totalItems = 0;
    let userItems = 0;
    const itemsByType: Record<CacheableDataType, number> = {
      curation_stats: 0,
      delegation_stats: 0,
      dashboard_data: 0,
      calculate_results: 0,
      payment_config: 0,
      user_preferences: 0,
    };

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        const dataTypes = Object.keys(CACHE_TTL) as CacheableDataType[];
        const dataType = dataTypes.find(type => key.startsWith(type));
        
        if (dataType) {
          totalItems++;
          itemsByType[dataType]++;

          if (currentUser && key.includes(`_${currentUser}`)) {
            userItems++;
          }
        }
      }

      return {
        totalItems,
        userItems,
        currentUser,
        itemsByType
      };

    } catch (error) {
      console.error('❌ UserCache: Error obteniendo información del caché:', error);
      return {
        totalItems: 0,
        userItems: 0,
        currentUser,
        itemsByType
      };
    }
  }

  /**
   * ✅ Verificar si hay datos en caché para un tipo específico
   */
  has(dataType: CacheableDataType, subKey?: string): boolean {
    return this.get(dataType, subKey) !== null;
  }

  /**
   * ✅ Obtener edad de los datos en caché (en milisegundos)
   */
  getAge(dataType: CacheableDataType, subKey?: string): number | null {
    try {
      const currentUser = getCurrentAuthenticatedUser();
      if (!currentUser) return null;

      const cacheKey = this.generateCacheKey(dataType, currentUser, subKey);
      const cachedItem = localStorage.getItem(cacheKey);

      if (!cachedItem) return null;

      const cached: CachedData = JSON.parse(cachedItem);
      return Date.now() - cached.timestamp;

    } catch (error) {
      return null;
    }
  }
}

/**
 * ✅ Instancia singleton del gestor de caché por usuario
 */
export const userCache = new UserCacheManager();

/**
 * ✅ Hooks de conveniencia para tipos específicos de datos
 */
export const cacheHelpers = {
  /**
   * Caché específico para estadísticas de curación
   */
  curationStats: {
    get: () => userCache.get<any>('curation_stats'),
    set: (data: any) => userCache.set('curation_stats', data),
    remove: () => userCache.remove('curation_stats'),
    has: () => userCache.has('curation_stats'),
    getAge: () => userCache.getAge('curation_stats'),
  },

  /**
   * Caché específico para datos del dashboard
   */
  dashboardData: {
    get: () => userCache.get<any>('dashboard_data'),
    set: (data: any) => userCache.set('dashboard_data', data),
    remove: () => userCache.remove('dashboard_data'),
    has: () => userCache.has('dashboard_data'),
    getAge: () => userCache.getAge('dashboard_data'),
  },

  /**
   * Caché específico para resultados de cálculos
   */
  calculateResults: {
    get: (subKey?: string) => userCache.get<any>('calculate_results', subKey),
    set: (data: any, subKey?: string) => userCache.set('calculate_results', data, subKey),
    remove: (subKey?: string) => userCache.remove('calculate_results', subKey),
    has: (subKey?: string) => userCache.has('calculate_results', subKey),
    getAge: (subKey?: string) => userCache.getAge('calculate_results', subKey),
  },

  /**
   * Caché específico para configuración de pagos
   */
  paymentConfig: {
    get: () => userCache.get<any>('payment_config'),
    set: (data: any) => userCache.set('payment_config', data),
    remove: () => userCache.remove('payment_config'),
    has: () => userCache.has('payment_config'),
    getAge: () => userCache.getAge('payment_config'),
  },
};

/**
 * ✅ Utilidad para migrar caché legacy a nuevo formato
 */
export function migrateLegacyCache(): void {
  try {
    const currentUser = getCurrentAuthenticatedUser();
    if (!currentUser) return;

    // Migrar claves legacy conocidas
    const legacyMappings = [
      { legacy: 'dashboard_curation_stats', new: userCache.generateCacheKey('curation_stats', currentUser) },
      { legacy: 'dashboard_delegation_stats', new: userCache.generateCacheKey('delegation_stats', currentUser) },
      { legacy: 'dashboard_last_update', new: userCache.generateCacheKey('dashboard_data', currentUser) },
    ];

    let migratedCount = 0;

    legacyMappings.forEach(({ legacy, new: newKey }) => {
      const legacyData = localStorage.getItem(legacy);
      if (legacyData) {
        try {
          // Intentar convertir al nuevo formato
          const data = JSON.parse(legacyData);
          const cachedData: CachedData = {
            data,
            timestamp: Date.now(),
            user: currentUser,
            version: '1.0.0',
            ttl: CACHE_TTL.dashboard_data
          };

          localStorage.setItem(newKey, JSON.stringify(cachedData));
          localStorage.removeItem(legacy);
          migratedCount++;

        } catch (error) {
          console.warn(`⚠️ Error migrando caché legacy ${legacy}:`, error);
          // Si hay error, simplemente remover el dato legacy corrupto
          localStorage.removeItem(legacy);
        }
      }
    });

    if (migratedCount > 0) {
      console.log(`✅ UserCache: Migración completada (${migratedCount} elementos migrados)`);
    }

  } catch (error) {
    console.error('❌ UserCache: Error en migración legacy:', error);
  }
}

/**
 * ✅ Inicialización automática del sistema de caché
 */
export function initializeUserCache(): void {
  if (typeof window === 'undefined') return;

  // Migrar datos legacy
  migrateLegacyCache();

  // Limpiar caché expirado
  setTimeout(() => {
    userCache.cleanupExpiredCache();
  }, 1000);

  console.log('✅ UserCache: Sistema inicializado correctamente');
}