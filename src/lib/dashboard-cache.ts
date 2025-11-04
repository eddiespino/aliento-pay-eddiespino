/**
 * 🗂️ SISTEMA DE CACHÉ DEL DASHBOARD
 *
 * Maneja el almacenamiento persistente de datos del Dashboard
 * para evitar recálculos innecesarios al navegar.
 */

export interface CurationStatsCache {
  readonly curation24h: number;
  readonly curation7d: number;
  readonly curation30d: number;
  readonly lastUpdate: string;
  readonly timestamp: number;
  readonly error: boolean;
}

export interface DelegationStatsCache {
  readonly totalHP: number;
  readonly delegatorsCount: number;
  readonly timestamp: number;
}

export interface DashboardCache {
  readonly curationStats: CurationStatsCache | null;
  readonly delegationStats: DelegationStatsCache | null;
  readonly lastFullUpdate: number;
}

// Constantes de configuración
const CACHE_KEYS = {
  DASHBOARD: 'aliento_dashboard_cache',
  CURATION_STATS: 'dashboard_curation_stats',
  DELEGATION_STATS: 'dashboard_delegation_stats',
  LAST_UPDATE: 'dashboard_last_update',
} as const;

const CACHE_DURATION = {
  CURATION_STATS: 10 * 60 * 1000, // 10 minutos
  DELEGATION_STATS: 5 * 60 * 1000, // 5 minutos
  FULL_DASHBOARD: 15 * 60 * 1000, // 15 minutos
} as const;

/**
 * Clase para gestionar el caché del Dashboard
 */
export class DashboardCacheManager {
  /**
   * Guarda las estadísticas de curación en caché
   */
  static saveCurationStats(stats: Omit<CurationStatsCache, 'timestamp'>): void {
    try {
      const cacheData: CurationStatsCache = {
        ...stats,
        timestamp: Date.now(),
      };

      localStorage.setItem(CACHE_KEYS.CURATION_STATS, JSON.stringify(cacheData));
      console.log('💾 Estadísticas de curación guardadas en caché');
    } catch (error) {
      console.warn('⚠️ Error guardando estadísticas de curación:', error);
    }
  }

  /**
   * Obtiene las estadísticas de curación del caché
   */
  static getCurationStats(): CurationStatsCache | null {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.CURATION_STATS);
      if (!cached) return null;

      const data: CurationStatsCache = JSON.parse(cached);

      // Verificar si no ha expirado
      if (Date.now() - data.timestamp > CACHE_DURATION.CURATION_STATS) {
        this.clearCurationStats();
        return null;
      }

      return data;
    } catch (error) {
      console.warn('⚠️ Error obteniendo estadísticas de curación del caché:', error);
      return null;
    }
  }

  /**
   * Verifica si las estadísticas de curación están disponibles y válidas
   */
  static hasFreshCurationStats(): boolean {
    const stats = this.getCurationStats();
    return stats !== null && !stats.error;
  }

  /**
   * Guarda las estadísticas de delegaciones en caché
   */
  static saveDelegationStats(stats: Omit<DelegationStatsCache, 'timestamp'>): void {
    try {
      const cacheData: DelegationStatsCache = {
        ...stats,
        timestamp: Date.now(),
      };

      localStorage.setItem(CACHE_KEYS.DELEGATION_STATS, JSON.stringify(cacheData));
      console.log('💾 Estadísticas de delegaciones guardadas en caché');
    } catch (error) {
      console.warn('⚠️ Error guardando estadísticas de delegaciones:', error);
    }
  }

  /**
   * Obtiene las estadísticas de delegaciones del caché
   */
  static getDelegationStats(): DelegationStatsCache | null {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.DELEGATION_STATS);
      if (!cached) return null;

      const data: DelegationStatsCache = JSON.parse(cached);

      // Verificar si no ha expirado
      if (Date.now() - data.timestamp > CACHE_DURATION.DELEGATION_STATS) {
        this.clearDelegationStats();
        return null;
      }

      return data;
    } catch (error) {
      console.warn('⚠️ Error obteniendo estadísticas de delegaciones del caché:', error);
      return null;
    }
  }

  /**
   * Obtiene todo el caché del Dashboard
   */
  static getDashboardCache(): DashboardCache {
    return {
      curationStats: this.getCurationStats(),
      delegationStats: this.getDelegationStats(),
      lastFullUpdate: this.getLastUpdateTimestamp(),
    };
  }

  /**
   * Verifica si el Dashboard necesita una actualización completa
   */
  static needsFullUpdate(): boolean {
    const lastUpdate = this.getLastUpdateTimestamp();
    return Date.now() - lastUpdate > CACHE_DURATION.FULL_DASHBOARD;
  }

  /**
   * Marca el timestamp de la última actualización completa
   */
  static markFullUpdate(): void {
    try {
      localStorage.setItem(CACHE_KEYS.LAST_UPDATE, Date.now().toString());
    } catch (error) {
      console.warn('⚠️ Error marcando actualización completa:', error);
    }
  }

  /**
   * Obtiene el timestamp de la última actualización
   */
  static getLastUpdateTimestamp(): number {
    try {
      const timestamp = localStorage.getItem(CACHE_KEYS.LAST_UPDATE);
      return timestamp ? parseInt(timestamp, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Limpia las estadísticas de curación del caché
   */
  static clearCurationStats(): void {
    try {
      localStorage.removeItem(CACHE_KEYS.CURATION_STATS);
      console.log('🧹 Estadísticas de curación limpiadas del caché');
    } catch (error) {
      console.warn('⚠️ Error limpiando estadísticas de curación:', error);
    }
  }

  /**
   * Limpia las estadísticas de delegaciones del caché
   */
  static clearDelegationStats(): void {
    try {
      localStorage.removeItem(CACHE_KEYS.DELEGATION_STATS);
      console.log('🧹 Estadísticas de delegaciones limpiadas del caché');
    } catch (error) {
      console.warn('⚠️ Error limpiando estadísticas de delegaciones:', error);
    }
  }

  /**
   * Limpia todo el caché del Dashboard
   */
  static clearAll(): void {
    try {
      Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('🧹 Todo el caché del Dashboard limpiado');
    } catch (error) {
      console.warn('⚠️ Error limpiando todo el caché:', error);
    }
  }

  /**
   * Obtiene información sobre el estado del caché
   */
  static getCacheInfo(): {
    hasCurationStats: boolean;
    hasDelegationStats: boolean;
    curationAge: number;
    delegationAge: number;
    lastFullUpdate: number;
    needsUpdate: boolean;
  } {
    const curationStats = this.getCurationStats();
    const delegationStats = this.getDelegationStats();
    const lastUpdate = this.getLastUpdateTimestamp();

    return {
      hasCurationStats: curationStats !== null,
      hasDelegationStats: delegationStats !== null,
      curationAge: curationStats ? Date.now() - curationStats.timestamp : -1,
      delegationAge: delegationStats ? Date.now() - delegationStats.timestamp : -1,
      lastFullUpdate: lastUpdate,
      needsUpdate: this.needsFullUpdate(),
    };
  }
}

/**
 * Función de conveniencia para usar en componentes
 */
export function useDashboardCache() {
  return DashboardCacheManager;
}

/**
 * Hook para verificar si hay datos frescos disponibles
 */
export function hasValidDashboardData(): boolean {
  const cache = DashboardCacheManager;
  return cache.hasFreshCurationStats() && cache.getDelegationStats() !== null;
}

/**
 * Hook para obtener datos de curación para Calculate
 */
export function getCurationDataForCalculate(): CurationStatsCache | null {
  return DashboardCacheManager.getCurationStats();
}
