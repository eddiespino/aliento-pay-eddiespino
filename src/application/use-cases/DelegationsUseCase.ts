import type { HiveRepository } from '../../domain/ports/HiveRepository';
import type { Delegation, UserProfile } from '../../domain/entities/HiveAccount';
import { HiveAccountService } from '../../domain/services/HiveAccountService';

/**
 * Caso de uso: Gestión de delegaciones
 */
export class DelegationsUseCase {
  constructor(private readonly hiveRepository: HiveRepository) {}

  /**
   * Obtiene delegaciones activas para un usuario con información de delegadores
   */
  async getDelegationsWithDelegatorInfo(username: string): Promise<DelegationWithDelegatorInfo[]> {
    // 1. Validar username
    const normalizedUsername = HiveAccountService.normalizeUsername(username);
    if (!HiveAccountService.isValidUsername(normalizedUsername)) {
      throw new Error('Nombre de usuario inválido');
    }

    // 2. Obtener delegaciones activas
    const delegations = await this.hiveRepository.getActiveDelegations(normalizedUsername);

    if (delegations.length === 0) {
      return [];
    }

    // 3. Obtener información de los delegadores
    const delegatorUsernames = delegations.map(d => d.delegator);
    const delegatorAccounts = await this.hiveRepository.getAccounts(delegatorUsernames);

    // 4. Crear mapa de perfiles de delegadores
    const delegatorProfiles = new Map<string, UserProfile>();
    delegatorAccounts.forEach(account => {
      const profileResult = HiveAccountService.toUserProfile(account);
      if (profileResult.success) {
        delegatorProfiles.set(account.name, profileResult.data);
      }
    });

    // 5. Combinar delegaciones con información de delegadores
    return delegations.map(delegation => ({
      ...delegation,
      delegatorProfile: delegatorProfiles.get(delegation.delegator) || null,
      formattedHP: HiveAccountService.formatHP(delegation.hpAmount),
      formattedDate: this.formatDate(delegation.timestamp),
    }));
  }

  /**
   * Obtiene el total de HP delegado a un usuario
   */
  async getTotalDelegatedHP(username: string): Promise<number> {
    const normalizedUsername = HiveAccountService.normalizeUsername(username);
    const delegations = await this.hiveRepository.getActiveDelegations(normalizedUsername);

    return delegations.reduce((total, delegation) => total + delegation.hpAmount, 0);
  }

  /**
   * Obtiene estadísticas de delegaciones
   */
  async getDelegationStats(username: string): Promise<DelegationStats> {
    const normalizedUsername = HiveAccountService.normalizeUsername(username);
    const delegations = await this.hiveRepository.getActiveDelegations(normalizedUsername);

    const totalHP = delegations.reduce((sum, d) => sum + d.hpAmount, 0);
    const delegatorsCount = delegations.length;
    const averageHP = delegatorsCount > 0 ? totalHP / delegatorsCount : 0;

    // Encontrar la delegación más grande y más pequeña
    let largestDelegation: Delegation | null = null;
    let smallestDelegation: Delegation | null = null;

    if (delegations.length > 0) {
      largestDelegation = delegations.reduce((max, current) =>
        current.hpAmount > max.hpAmount ? current : max
      );

      smallestDelegation = delegations.reduce((min, current) =>
        current.hpAmount < min.hpAmount ? current : min
      );
    }

    return {
      totalHP,
      delegatorsCount,
      averageHP,
      largestDelegation,
      smallestDelegation,
      formattedTotalHP: HiveAccountService.formatHP(totalHP),
      formattedAverageHP: HiveAccountService.formatHP(averageHP),
    };
  }

  /**
   * Filtra delegaciones por HP mínimo
   */
  async getDelegationsAboveThreshold(username: string, minHP: number): Promise<Delegation[]> {
    const normalizedUsername = HiveAccountService.normalizeUsername(username);
    const delegations = await this.hiveRepository.getActiveDelegations(normalizedUsername);

    return delegations.filter(delegation => delegation.hpAmount >= minHP);
  }

  /**
   * Formatea fecha para visualización
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

/**
 * Interfaces para los tipos de retorno
 */
export interface DelegationWithDelegatorInfo extends Delegation {
  delegatorProfile: UserProfile | null;
  formattedHP: string;
  formattedDate: string;
}

export interface DelegationStats {
  totalHP: number;
  delegatorsCount: number;
  averageHP: number;
  largestDelegation: Delegation | null;
  smallestDelegation: Delegation | null;
  formattedTotalHP: string;
  formattedAverageHP: string;
}
