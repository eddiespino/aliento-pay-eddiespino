import type { Result } from '../../types/global';
import type { HiveAccount, HPAmount, UserProfile, ValidUsername } from '../entities/HiveAccount';
import { createHPAmount, createValidUsername, isValidUsername } from '../entities/HiveAccount';

/**
 * Domain Service: Business logic for Hive accounts
 * Pure domain logic without infrastructure dependencies
 * Enhanced with type safety and proper error handling
 */
export class HiveAccountService {
  /**
   * Calculates personal HP with type safety and validation
   */
  static calculatePersonalHP(incomingHP: string, outgoingHP: string): Result<HPAmount> {
    try {
      const incoming = parseFloat(incomingHP) || 0;
      const outgoing = parseFloat(outgoingHP) || 0;

      if (!Number.isFinite(incoming) || !Number.isFinite(outgoing)) {
        return { success: false, error: new Error('Invalid HP values provided') };
      }

      const personalHP = incoming === 0 ? outgoing : incoming - outgoing;
      const hpAmount = createHPAmount(Math.max(0, personalHP));

      return { success: true, data: hpAmount };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Converts a Hive account to user profile with enhanced type safety
   */
  static toUserProfile(account: HiveAccount): Result<UserProfile> {
    try {
      const personalHPResult = this.calculatePersonalHP(account.incoming_hp, account.outgoing_hp);

      if (!personalHPResult.success) {
        return { success: false, error: personalHPResult.error };
      }

      const reputation = this.parseReputation(account.reputation);
      const validUsername = createValidUsername(account.name);

      const userProfile: UserProfile = {
        username: validUsername,
        displayName: account.posting_metadata?.profile?.name || account.name,
        reputation,
        personalHP: personalHPResult.data,
        incomingHP: parseFloat(account.incoming_hp) || 0,
        outgoingHP: parseFloat(account.outgoing_hp) || 0,
        profileImage: account.posting_metadata?.profile?.profile_image || undefined,
        createdAt: new Date(account.created_at),
      };

      return { success: true, data: userProfile };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Formatea HP para visualización
   */
  static formatHP(hp: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(hp);
  }

  /**
   * Parsea y formatea reputación
   */
  static parseReputation(reputation: string): number {
    return parseFloat(reputation) || 0;
  }

  /**
   * Formatea reputación para visualización
   */
  static formatReputation(reputation: number): string {
    return reputation.toFixed(2);
  }

  /**
   * Validates and creates a ValidUsername
   */
  static validateUsername(username: string): Result<ValidUsername> {
    try {
      const validUsername = createValidUsername(username);
      return { success: true, data: validUsername };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use validateUsername instead
   */
  static isValidUsername(username: string): boolean {
    return isValidUsername(username);
  }

  /**
   * Normalizes a username (trim, lowercase)
   */
  static normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
  }

  /**
   * Obtiene el HP equivalente de una cuenta desde la API de Hive
   */
  static async getHPEquivalent(username: string): Promise<Result<number>> {
    try {
      const normalizedUsername = this.normalizeUsername(username);
      const response = await fetch(
        `https://hafsql-api.mahdiyari.info/balances/by-names?names=${normalizedUsername}`
      );

      if (!response.ok) {
        return { success: false, error: new Error(`HTTP error! status: ${response.status}`) };
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        return { success: false, error: new Error('No account data found') };
      }

      const accountData = data[0];
      const hpEquivalent = parseFloat(accountData.hp_equivalent);

      if (!Number.isFinite(hpEquivalent)) {
        return { success: false, error: new Error('Invalid HP equivalent value') };
      }

      return { success: true, data: hpEquivalent };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Obtiene el incoming HP de una cuenta desde la API de Hive
   */
  static async getIncomingHP(username: string): Promise<Result<number>> {
    try {
      const normalizedUsername = this.normalizeUsername(username);
      const response = await fetch(
        `https://hafsql-api.mahdiyari.info/accounts/by-names?names=${normalizedUsername}`
      );

      if (!response.ok) {
        return { success: false, error: new Error(`HTTP error! status: ${response.status}`) };
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        return { success: false, error: new Error('No account data found') };
      }

      const accountData = data[0];
      const incomingHP = parseFloat(accountData.incoming_hp);

      if (!Number.isFinite(incomingHP)) {
        return { success: false, error: new Error('Invalid incoming HP value') };
      }

      return { success: true, data: incomingHP };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Calcula el porcentaje de HP de la cuenta logueada
   * Formula: hp_equivalent / (incoming_hp + hp_equivalent)
   */
  static async calculateHPPercentage(username: string): Promise<Result<number>> {
    try {
      // Obtener ambos valores de HP de forma paralela
      const [hpEquivalentResult, incomingHPResult] = await Promise.all([
        this.getHPEquivalent(username),
        this.getIncomingHP(username),
      ]);

      if (!hpEquivalentResult.success) {
        return { success: false, error: hpEquivalentResult.error };
      }

      if (!incomingHPResult.success) {
        return { success: false, error: incomingHPResult.error };
      }

      const hpEquivalent = hpEquivalentResult.data;
      const incomingHP = incomingHPResult.data;
      const totalHP = incomingHP + hpEquivalent;

      if (totalHP === 0) {
        return {
          success: false,
          error: new Error('Total HP is zero, cannot calculate percentage'),
        };
      }

      const percentage = (hpEquivalent / totalHP) * 100;

      return { success: true, data: percentage };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }
}

export function getHiveAvatarUrl(userName?: string): string {
  if (userName) {
    const normalized = userName.replace('@', '').trim().toLowerCase();
    return `https://images.hive.blog/u/${normalized}/avatar`;
  } else {
    return '';
  }
}
