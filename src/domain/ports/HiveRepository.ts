import type { HiveAccount, Delegation } from '../entities/HiveAccount';

/**
 * Puerto: Contrato para acceso a datos de Hive
 * Define QUÉ se puede hacer, no CÓMO
 */
export interface HiveRepository {
  /**
   * Obtiene información de una cuenta por username
   */
  getAccount(username: string): Promise<HiveAccount | null>;

  /**
   * Obtiene información de múltiples cuentas
   */
  getAccounts(usernames: string[]): Promise<HiveAccount[]>;

  /**
   * Obtiene delegaciones activas hacia una cuenta
   */
  getActiveDelegations(username: string): Promise<Delegation[]>;
}

/**
 * Puerto: Contrato para conversión de VESTS a HP
 */
export interface VestsConverter {
  /**
   * Convierte VESTS a HP usando datos de la blockchain
   */
  vestsToHP(vests: string): Promise<number>;
}

/**
 * Puerto: Contrato para autenticación
 */
export interface AuthenticationPort {
  /**
   * Verifica si Hive Keychain está disponible
   */
  isKeychainAvailable(): boolean;

  /**
   * Firma un mensaje con Hive Keychain
   */
  signMessage(username: string, message: string): Promise<string>;

  /**
   * Obtiene el usuario autenticado actual
   */
  getCurrentUser(): string | null;

  /**
   * Guarda la sesión del usuario
   */
  saveSession(username: string): void;

  /**
   * Cierra la sesión
   */
  clearSession(): void;
}
