/**
 * 🔌 DOMINIO - Puerto CurationRepository
 *
 * Define el contrato para obtener datos de curación de la blockchain.
 * Las implementaciones concretas van en infrastructure/
 */

import type {
  CurationReward,
  CurationStats,
  TimePeriod,
  HiveAccountName,
} from '../entities/CurationStats.js';

export interface CurationRepository {
  /**
   * Obtiene las recompensas de curación para una cuenta en un período específico
   */
  getCurationRewards(account: HiveAccountName, period: TimePeriod): Promise<CurationReward[]>;

  /**
   * Obtiene las estadísticas consolidadas de curación para una cuenta
   */
  getCurationStats(account: HiveAccountName): Promise<CurationStats>;

  /**
   * Convierte una cantidad en VESTS a Hive Power (HP)
   */
  convertVestsToHP(vests: number): Promise<number>;

  /**
   * Limpia caches para optimizar memoria
   */
  clearCache(): void;
}

/**
 * Puerto para obtener propiedades globales de la blockchain
 */
export interface GlobalPropsRepository {
  /**
   * Obtiene las propiedades globales dinámicas de Hive
   */
  getGlobalProperties(): Promise<{
    totalVestingFundHive: {
      amount: string;
      precision: number;
    };
    totalVestingShares: {
      amount: string;
      precision: number;
    };
  }>;
}

/**
 * Puerto para manejo de cache
 */
export interface CacheRepository<T> {
  get(key: string): T | null;
  set(key: string, value: T, ttlMs?: number): void;
  delete(key: string): void;
  clear(): void;
  size(): number;
}
