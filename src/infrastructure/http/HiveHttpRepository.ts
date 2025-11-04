import { createHiveChain } from '@hiveio/wax';
import type { Delegation, HiveAccount } from '../../domain/entities/HiveAccount';
import type { HiveRepository, VestsConverter } from '../../domain/ports/HiveRepository';

/**
 * Adaptador HTTP: Implementación concreta de HiveRepository
 * Usa APIs reales de Hive
 */
// Cache para propiedades globales de Hive
interface GlobalPropsCache {
  totalVestingFundHive: string;
  totalVestingShares: string;
  cachedAt: number;
  vestsToHpRatio: number;
}

export class HiveHttpRepository implements HiveRepository, VestsConverter {
  private globalPropsCache: GlobalPropsCache | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en ms
  private readonly accountsApiUrl = 'https://hafsql-api.mahdiyari.info/accounts/by-names';

  /**
   * Obtiene información de una cuenta por username
   */
  async getAccount(username: string): Promise<HiveAccount | null> {
    try {
      const response = await fetch(`${this.accountsApiUrl}?names=${username}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const accounts: HiveAccount[] = await response.json();

      if (accounts.length === 0) {
        return null;
      }

      return accounts[0] ?? null;
    } catch (error) {
      console.error('Error fetching Hive account:', error);
      return null;
    }
  }

  /**
   * Obtiene información de múltiples cuentas
   */
  async getAccounts(usernames: string[]): Promise<HiveAccount[]> {
    try {
      const namesParam = usernames.join(',');
      const response = await fetch(`${this.accountsApiUrl}?names=${namesParam}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const accounts: HiveAccount[] = await response.json();
      return accounts;
    } catch (error) {
      console.error('Error fetching Hive accounts:', error);
      return [];
    }
  }

  /**
   * Obtiene delegaciones activas hacia una cuenta
   */
  async getActiveDelegations(username: string): Promise<Delegation[]> {
    try {
      const chain = await createHiveChain();

      // Crear la estructura de API extendida (igual que antes)
      const chainExtendedRestApi = {
        'hafah-api': {
          accounts: {
            operations: {
              urlPath: '{accountName}/operations',
            },
          },
        },
      };

      const extended = chain.extendRest(chainExtendedRestApi);

      // Obtener metadatos primero
      const metadata = await this.getOperationsMetadata(extended, username);

      if (metadata.total_operations === 0) {
        return [];
      }

      let allDelegations: any[] = [];

      // Estrategia optimizada según número de operaciones
      if (metadata.total_operations <= 500) {
        const firstBatch = await this.getDelegationsPage(extended, username);
        allDelegations.push(...firstBatch);

        const realTotalPages = await this.getRealTotalPages(extended, username);

        if (realTotalPages > 1) {
          for (let index = 1; index < realTotalPages; index++) {
            const currentPage = realTotalPages - index;
            if (currentPage < 1) break;

            try {
              const pageDelegations = await this.getDelegationsPage(
                extended,
                username,
                currentPage
              );
              allDelegations.push(...pageDelegations);
            } catch (error) {
              console.error(`Error en página ${currentPage}:`, error);
            }

            // Delay entre peticiones
            await new Promise(resolve => setTimeout(resolve, 150));
          }
        }
      } else {
        // Estrategia para muchas operaciones
        const firstBatch = await this.getDelegationsPage(extended, username);
        allDelegations.push(...firstBatch);

        const realTotalPages = await this.getRealTotalPages(extended, username);

        if (realTotalPages > 1) {
          for (let index = 1; index < realTotalPages; index++) {
            const currentPage = realTotalPages - index;
            if (currentPage < 1) break;

            try {
              const pageDelegations = await this.getDelegationsPage(
                extended,
                username,
                currentPage
              );
              allDelegations.push(...pageDelegations);
            } catch (error) {
              console.error(`Error en página ${currentPage}:`, error);
            }

            await new Promise(resolve => setTimeout(resolve, 150));
          }
        }
      }

      // Procesar delegaciones y convertir a entidades del dominio
      return this.processRawDelegations(allDelegations, username);
    } catch (error) {
      console.error('Error fetching delegations:', error);
      return [];
    }
  }

  /**
   * Parsea un asset de Hive (string o {amount, precision}) a número decimal
   */
  private parseAsset(asset: any): number {
    if (typeof asset === 'string') {
      // Ejemplo: "12345.678 HIVE"
      return parseFloat(asset.replace(/[^\d.]/g, ''));
    }
    if (asset && typeof asset === 'object' && 'amount' in asset && 'precision' in asset) {
      // Ejemplo: { amount: "187213744879", precision: 3 }
      return parseInt(asset.amount, 10) / Math.pow(10, asset.precision);
    }
    return 0;
  }

  /**
   * Obtiene las propiedades globales con cache
   */
  private async getGlobalPropsWithCache(): Promise<GlobalPropsCache> {
    const now = Date.now();

    // Verificar si el cache es válido
    if (this.globalPropsCache && now - this.globalPropsCache.cachedAt < this.CACHE_DURATION) {
      return this.globalPropsCache;
    }

    try {
      const chain = await createHiveChain();
      const globalProps = await (chain.api.database_api as any).get_dynamic_global_properties();

      // Calcular el ratio una vez
      const totalVestingFundHive = this.parseAsset(globalProps.total_vesting_fund_hive);
      const totalVestingShares = this.parseAsset(globalProps.total_vesting_shares);
      const vestsToHpRatio = totalVestingFundHive / totalVestingShares;

      this.globalPropsCache = {
        totalVestingFundHive: globalProps.total_vesting_fund_hive,
        totalVestingShares: globalProps.total_vesting_shares,
        vestsToHpRatio,
        cachedAt: now,
      };

      console.log(
        `🔄 Propiedades globales actualizadas. Ratio VESTS→HP: ${vestsToHpRatio.toFixed(8)}`
      );
      return this.globalPropsCache;
    } catch (error) {
      console.error('Error obteniendo propiedades globales:', error);

      // Si tenemos cache expirado, usarlo como fallback
      if (this.globalPropsCache) {
        console.warn('⚠️ Usando cache expirado como fallback');
        return this.globalPropsCache;
      }

      // Fallback con valores aproximados
      const fallbackRatio = 0.0005993102;
      this.globalPropsCache = {
        totalVestingFundHive: '0 HIVE',
        totalVestingShares: '0 VESTS',
        vestsToHpRatio: fallbackRatio,
        cachedAt: now,
      };

      console.warn(`⚠️ Usando ratio fallback: ${fallbackRatio}`);
      return this.globalPropsCache;
    }
  }

  /**
   * Convierte VESTS a HP usando cache optimizado
   */
  async vestsToHP(vests: string): Promise<number> {
    try {
      const globalProps = await this.getGlobalPropsWithCache();
      const vestsAmount = parseFloat(vests.replace(' VESTS', '')) || 0;
      return vestsAmount * globalProps.vestsToHpRatio;
    } catch (error) {
      console.error('Error converting VESTS to HP:', error);
      // Fallback con ratio aproximado
      const vestsAmount = parseFloat(vests.replace(' VESTS', '')) || 0;
      return vestsAmount * 0.0005993102;
    }
  }

  /**
   * Convierte múltiples VESTS a HP en lote usando el mismo cache
   */
  async batchVestsToHP(vestsList: (string | number | any)[]): Promise<number[]> {
    if (vestsList.length === 0) return [];

    try {
      // Obtener propiedades globales UNA SOLA VEZ
      const globalProps = await this.getGlobalPropsWithCache();

      // Convertir todas las delegaciones usando el mismo ratio
      return vestsList.map(vests => {
        // ✅ MANEJO ROBUSTO DE DIFERENTES TIPOS DE VESTS
        let vestsAmount = 0;

        if (typeof vests === 'string') {
          // Si es string, remover ' VESTS' y convertir
          vestsAmount = parseFloat(vests.replace(' VESTS', '')) || 0;
        } else if (typeof vests === 'number') {
          // Si ya es número, usarlo directamente
          vestsAmount = vests;
        } else if (vests && typeof vests === 'object' && vests.amount) {
          // Si es objeto con propiedad amount
          vestsAmount = parseFloat(vests.amount.toString().replace(' VESTS', '')) || 0;
        } else {
          // Fallback: intentar convertir a string y luego a número
          const vestsString = String(vests || '0');
          vestsAmount = parseFloat(vestsString.replace(' VESTS', '')) || 0;
        }

        return vestsAmount * globalProps.vestsToHpRatio;
      });
    } catch (error) {
      console.error('Error en conversión por lotes VESTS to HP:', error);
      // Fallback
      const fallbackRatio = 0.0005993102;
      return vestsList.map(vests => {
        // ✅ Mismo manejo robusto en fallback
        let vestsAmount = 0;

        if (typeof vests === 'string') {
          vestsAmount = parseFloat(vests.replace(' VESTS', '')) || 0;
        } else if (typeof vests === 'number') {
          vestsAmount = vests;
        } else if (vests && typeof vests === 'object' && vests.amount) {
          vestsAmount = parseFloat(vests.amount.toString().replace(' VESTS', '')) || 0;
        } else {
          const vestsString = String(vests || '0');
          vestsAmount = parseFloat(vestsString.replace(' VESTS', '')) || 0;
        }

        return vestsAmount * fallbackRatio;
      });
    }
  }

  // Métodos privados auxiliares...
  private async getOperationsMetadata(extended: any, username: string) {
    const query = {
      accountName: username,
      'operation-types': '40',
      'page-size': 400,
      'data-size-limit': 200000,
    };

    const result = await (extended.restApi as any)['hafah-api'].accounts.operations(query);
    return {
      total_operations: result.total_operations,
      total_pages: result.total_pages,
    };
  }

  private async getRealTotalPages(extended: any, username: string): Promise<number> {
    const query = {
      accountName: username,
      'operation-types': '40',
      'page-size': 400,
      'data-size-limit': 200000,
    };

    const result = await (extended.restApi as any)['hafah-api'].accounts.operations(query);
    return result.total_pages;
  }

  private async getDelegationsPage(extended: any, username: string, page?: number) {
    const query: any = {
      accountName: username,
      'operation-types': '40',
      page,
      'page-size': 400,
      'data-size-limit': 200000,
    };

    const result = await (extended.restApi as any)['hafah-api'].accounts.operations(query);
    return result.operations_result || [];
  }

  private async processRawDelegations(
    rawDelegations: any[],
    username: string
  ): Promise<Delegation[]> {
    // Agrupar por delegador y obtener la más reciente que NO sea 0
    const delegationsByDelegator = new Map<string, any>();

    rawDelegations.forEach(operation => {
      const { delegator, delegatee, vesting_shares } = operation.op.value;
      const existing = delegationsByDelegator.get(delegator);

      const shouldReplace =
        !existing || new Date(operation.timestamp) > new Date(existing.timestamp);

      if (shouldReplace) {
        delegationsByDelegator.set(delegator, operation);
      }
    });

    // Filtrar operaciones relevantes
    const relevantOperations = Array.from(delegationsByDelegator.values()).filter(
      operation => operation.op.value.delegatee === username
    );

    if (relevantOperations.length === 0) {
      return [];
    }

    // OPTIMIZACIÓN: Convertir todos los VESTS en lote con UNA SOLA llamada a API
    const vestsList = relevantOperations.map(op => op.op.value.vesting_shares);

    // ✅ DEBUG: Log para ver qué tipos de datos llegan
    console.log(
      '🔍 Tipos de VESTS recibidos:',
      vestsList
        .slice(0, 3)
        .map(v => ({ value: v, type: typeof v, constructor: v?.constructor?.name }))
    );

    const hpAmounts = await this.batchVestsToHP(vestsList);

    // Crear delegaciones usando los HP ya convertidos
    const delegations: Delegation[] = relevantOperations.map((operation, index) => {
      const { delegator, delegatee, vesting_shares } = operation.op.value;

      return {
        delegator,
        delegatee,
        hpAmount: hpAmounts[index] || 0, // ✅ Asegurar que siempre sea número
        vestsAmount: vesting_shares,
        timestamp: new Date(operation.timestamp),
        blockNumber: operation.block_num,
        transactionId: operation.trx_id,
      };
    });

    // Filtrar solo las delegaciones activas y ordenar
    return delegations
      .filter(delegation => delegation.hpAmount > 0)
      .sort((a, b) => b.hpAmount - a.hpAmount);
  }
}
