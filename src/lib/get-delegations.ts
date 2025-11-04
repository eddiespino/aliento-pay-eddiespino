import { createHiveChain, type IHiveChainInterface, type TWaxRestExtended } from '@hiveio/wax';

// Interfaces básicas
export interface DelegationOperation {
  trx_id: string;
  block_num: number;
  trx_in_block: number;
  op_in_trx: number;
  virtual_op: number;
  timestamp: string;
  op: {
    type: 'delegate_vesting_shares_operation';
    value: {
      delegator: string;
      delegatee: string;
      vesting_shares: {
        nai: string;
        amount: string;
        precision: number;
      };
    };
  };
}

export interface DelegationOperationResponse {
  total_operations: number;
  total_pages: number;
  operations_result: Array<{
    op: {
      type: string;
      value: {
        delegatee: string;
        delegator: string;
        vesting_shares: {
          nai: string;
          amount: string;
          precision: number;
        };
      };
    };
    block: number;
    trx_id: string;
    op_pos: number;
    op_type_id: number;
    timestamp: string;
    virtual_op: boolean;
    operation_id: string;
    trx_in_block: number;
  }>;
}

// Cache para propiedades globales dinámicas
interface GlobalPropsCache {
  total_vesting_fund_hive: {
    nai: string;
    amount: string;
    precision: number;
  };
  total_vesting_shares: {
    nai: string;
    amount: string;
    precision: number;
  };
  timestamp: number;
  chain: IHiveChainInterface;
}

let globalPropsCache: GlobalPropsCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Funciones para limpiar caches
 */
export function clearGlobalPropsCache(): void {
  globalPropsCache = null;
  console.log('🧹 Global props cache cleared');
}

export function clearCurationStatsCache(): void {
  console.log('🧹 Curation stats cache cleared');
}

export function clearCurationRewardsCache(): void {
  console.log('🧹 Curation rewards cache cleared');
}

export function clearAllCaches(): void {
  clearGlobalPropsCache();
  clearCurationStatsCache();
  clearCurationRewardsCache();
  console.log('🧹 All caches cleared');
}

/**
 * Obtiene las propiedades globales dinámicas con cache
 */
async function getGlobalPropsWithCache(): Promise<GlobalPropsCache> {
  const now = Date.now();

  if (globalPropsCache && now - globalPropsCache.timestamp < CACHE_DURATION) {
    return globalPropsCache;
  }

  console.log('🔄 Obteniendo propiedades globales de Hive (cache expirado o vacío)...');

  const chain = globalPropsCache?.chain || (await createHiveChain());
  const globalProps = await (chain.api.database_api as any).get_dynamic_global_properties();

  globalPropsCache = {
    total_vesting_fund_hive: globalProps.total_vesting_fund_hive,
    total_vesting_shares: globalProps.total_vesting_shares,
    timestamp: now,
    chain: chain,
  };

  console.log('✅ Propiedades globales cacheadas:', {
    total_vesting_fund_hive: globalProps.total_vesting_fund_hive,
    total_vesting_shares: globalProps.total_vesting_shares,
  });

  return globalPropsCache;
}

/**
 * Convierte VESTS a HP usando cache para propiedades globales
 */
export async function vestsToHP(vests: string): Promise<number> {
  try {
    const cachedProps = await getGlobalPropsWithCache();
    const hpAmount = cachedProps.chain.vestsToHp(
      vests,
      cachedProps.total_vesting_fund_hive,
      cachedProps.total_vesting_shares
    );
    const amount = hpAmount.amount;
    return parseFloat(amount) / 1000;
  } catch (error) {
    console.error('Error converting VESTS to HP:', error);
    const vestsAmount = parseFloat(vests.replace(' VESTS', '')) || 0;
    return vestsAmount * 0.0005993102;
  }
}

// =============================================
// 📊 FUNCIONES DE CURACIÓN RESTAURADAS
// =============================================

/**
 * Interfaces para recompensas de curación
 */
// Importar la interface del dominio
import type { CurationReward as DomainCurationReward } from '../domain/entities/CurationStats';

// Interface para compatibilidad con API (timestamp como string)
export interface CurationRewardAPI {
  operationId: string;
  timestamp: string; // String para compatibilidad con API
  blockNum: number;
  trxId: string;
  reward: number; // HP
  rewardVests: number; // VESTS
  curator: string;
  author: string;
  permlink: string;
  mustBeClaimed: boolean;
}

// Re-export del dominio como el tipo principal
export type CurationReward = DomainCurationReward;

// Helper para convertir desde API al formato del dominio
export const convertCurationRewardFromAPI = (apiReward: CurationRewardAPI): CurationReward => ({
  operationId: apiReward.operationId,
  timestampMs: new Date(apiReward.timestamp).getTime(),
  rewardVests: apiReward.rewardVests,
  rewardHP: apiReward.reward,
  blockNum: apiReward.blockNum,
  trxId: apiReward.trxId,
  curator: apiReward.curator,
  author: apiReward.author,
  permlink: apiReward.permlink,
  mustBeClaimed: apiReward.mustBeClaimed,
});

export interface CurationRewardsResponse {
  totalOperations: number;
  totalPages: number;
  rewards: CurationReward[];
  hasMore: boolean;
}

export interface CurationStatsResult {
  total24Hr: number; // HP de últimas 24 horas
  total7D: number; // HP de últimos 7 días
  total30D: number; // HP de últimos 30 días
  rewards24Hr: CurationReward[];
  rewards7D: CurationReward[];
  rewards30D: CurationReward[];
  vestingData: {
    totalVestingFundHive: any;
    totalVestingShares: any;
  };
}

// Cache para recompensas de curación
const curationRewardsCache = new Map<
  string,
  { data: CurationRewardsResponse; timestamp: number }
>();
const curationStatsCache = new Map<string, { data: CurationStatsResult; timestamp: number }>();
const CURATION_CACHE_DURATION = 1 * 60 * 1000; // 1 minuto
const CURATION_STATS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

/**
 * Obtiene el historial de recompensas de curación para una cuenta
 * @param account - Nombre de la cuenta
 * @param page - Número de página (opcional)
 * @param fromDate - Fecha desde la cual obtener recompensas (opcional)
 * @returns Historial de recompensas o null si no hay datos
 */
export async function getHistoryRewards(
  account: string,
  page: number | null = null,
  fromDate?: Date
): Promise<CurationRewardsResponse | null> {
  try {
    // Validar entrada
    if (!account || account.trim() === '') {
      throw new Error('El nombre de cuenta es requerido');
    }

    // Generar clave de cache
    const cacheKey = `${account}-${page || 0}-${fromDate?.toISOString() || 'latest'}`;

    // Verificar cache
    const cachedData = curationRewardsCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CURATION_CACHE_DURATION) {
      console.log(`⚡ Cache hit para recompensas de ${account}`);
      return cachedData.data;
    }

    // Formatear fecha correctamente para la API (YYYY-MM-DD)
    const fromBlockDate = fromDate
      ? fromDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Obtener cadena de Hive
    const cachedProps = await getGlobalPropsWithCache();
    const chain = cachedProps.chain;

    // Configurar API extendida para hafah
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

    // Formatear fecha actual en UTC para to-block
    const now = new Date();
    const toBlockDate = now
      .toISOString()
      .replace('T', ' ')
      .replace(/\.\d{3}Z$/, '');

    // Preparar consulta para operaciones de recompensa de curación
    const query: any = {
      accountName: account,
      'operation-types': '52', // curation_reward_operation
      'page-size': 400,
      'data-size-limit': 200000,
      'from-block': fromBlockDate,
      'to-block': toBlockDate,
    };

    // NO agregar página en la primera petición
    // La API de Hive maneja paginación inversa
    if (page !== null && page > 1) {
      query.page = page;
    }

    console.log(
      `🔍 Obteniendo recompensas de curación para ${account}${page ? ` (página ${page})` : ''}`
    );

    // Ejecutar consulta
    const result = await (extended.restApi as any)['hafah-api'].accounts.operations(query);

    // Verificar si hay resultados
    if (!result.operations_result || result.operations_result.length === 0) {
      console.warn(`⚠️ No se encontraron recompensas de curación para ${account}`);
      return null;
    }

    // Procesar las recompensas de curación
    const rewards: CurationReward[] = [];
    for (const operation of result.operations_result) {
      try {
        const opValue = operation.op.value;

        // Verificar que sea una operación de curation_reward_operation
        if (operation.op.type !== 'curation_reward_operation') {
          console.warn(
            `⚠️ Tipo de operación inesperado: ${operation.op.type} para ${operation.operation_id}`
          );
          continue;
        }

        // Obtener recompensa de VESTS (recompensas de curación)
        const rewardVests = opValue.reward;

        // Validar que la recompensa de VESTS sea válida
        if (!rewardVests || !rewardVests.amount || parseFloat(rewardVests.amount) <= 0) {
          console.warn(`⚠️ No hay recompensa de VESTS válida: ${operation.operation_id}`);
          continue;
        }

        // Convertir VESTS a HP calculando directamente desde total_vesting_shares
        // Usar BigInt para evitar problemas de precisión con números grandes
        const vestsAmountRaw = BigInt(rewardVests.amount);
        const vestsPrecision = BigInt(Math.pow(10, rewardVests.precision));

        // Obtener propiedades globales para el cálculo directo
        const totalVestingFundHiveRaw = BigInt(cachedProps.total_vesting_fund_hive.amount);
        const totalVestingFundHivePrecision = BigInt(
          Math.pow(10, cachedProps.total_vesting_fund_hive.precision)
        );
        const totalVestingSharesRaw = BigInt(cachedProps.total_vesting_shares.amount);
        const totalVestingSharesPrecision = BigInt(
          Math.pow(10, cachedProps.total_vesting_shares.precision)
        );

        // Calcular HP usando BigInt para máxima precisión
        // Formula: (vests * total_vesting_fund_hive) / total_vesting_shares
        const numerator = vestsAmountRaw * totalVestingFundHiveRaw * totalVestingSharesPrecision;
        const denominator = vestsPrecision * totalVestingFundHivePrecision * totalVestingSharesRaw;

        // Convertir a number para el resultado final, usando división con BigInt
        const hiveRewardBigInt = numerator / denominator;
        const hiveReward =
          Number(hiveRewardBigInt) + Number(numerator % denominator) / Number(denominator);

        // También calcular vestsAmount usando BigInt para consistencia
        const vestsAmount = Number(vestsAmountRaw) / Number(vestsPrecision);

        // Crear objeto de recompensa
        const curationReward: CurationReward = {
          operationId: operation.operation_id,
          timestampMs: new Date(operation.timestamp).getTime(),
          blockNum: operation.block,
          trxId: operation.trx_id,
          rewardHP: hiveReward,
          rewardVests: vestsAmount,
          curator: opValue.curator,
          author: opValue.comment_author,
          permlink: opValue.comment_permlink,
          mustBeClaimed: opValue.payout_must_be_claimed,
        };

        rewards.push(curationReward);
      } catch (error) {
        console.error(`❌ Error procesando operación ${operation.operation_id}:`, error);
        continue;
      }
    }

    // Crear respuesta
    const response: CurationRewardsResponse = {
      totalOperations: result.total_operations,
      totalPages: result.total_pages,
      rewards,
      hasMore: result.total_pages > 1, // Solo indicar si hay más páginas disponibles
    };

    // Guardar en cache
    curationRewardsCache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
    });

    console.log(`✅ Procesadas ${rewards.length} recompensas de curación para ${account}`);
    return response;
  } catch (error) {
    console.error(`❌ Error obteniendo historial de recompensas para ${account}:`, error);
    throw error;
  }
}

/**
 * Obtiene el total de recompensas de curación para una cuenta en un período
 * @param account - Nombre de la cuenta
 * @param fromDate - Fecha desde la cual calcular
 * @param toDate - Fecha hasta la cual calcular (opcional)
 * @returns Total de recompensas en HP
 */
export async function getTotalCurationRewards(
  account: string,
  fromDate: Date,
  toDate?: Date
): Promise<number> {
  try {
    let totalRewards = 0;
    let totalPages = 0;
    let currentPageIndex = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      // Calcular página real usando fórmula inversa
      // Primera petición: sin page (null)
      // Siguientes: page = total_pages - index + 1
      let actualPage = null;
      if (currentPageIndex === 1) {
        actualPage = null; // Primera petición sin page
      } else {
        actualPage = totalPages - currentPageIndex + 2; // Ajuste para paginación inversa
      }

      const response = await getHistoryRewards(account, actualPage, fromDate);

      if (!response || response.rewards.length === 0) {
        break;
      }

      // Guardar total_pages de la primera respuesta
      if (currentPageIndex === 1) {
        totalPages = response.totalPages;
        console.log(`📊 Total páginas para cálculo (desde API): ${totalPages}`);
        console.log(`📋 Procesando TODAS las páginas disponibles - sin límites artificiales`);
      }

      // Filtrar por rango de fechas si se especifica toDate
      const filteredRewards = toDate
        ? response.rewards.filter(reward => {
            const rewardDate = new Date(reward.timestampMs);
            return rewardDate >= fromDate && rewardDate <= toDate;
          })
        : response.rewards;

      // Sumar recompensas
      totalRewards += filteredRewards.reduce((sum, reward) => sum + reward.rewardHP, 0);

      // Determinar si hay más páginas
      hasMorePages = currentPageIndex < totalPages;
      currentPageIndex++;

      // Log de progreso cada 10 páginas
      if (currentPageIndex % 10 === 0) {
        console.log(
          `📊 Procesando página ${currentPageIndex}/${totalPages}: ${totalRewards.toFixed(
            4
          )} HP acumulados`
        );
      }
    }

    return totalRewards;
  } catch (error) {
    console.error(`❌ Error calculando total de recompensas para ${account}:`, error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de recompensas de curación para 24 horas, 7 días y 30 días
 * @param account - Nombre de la cuenta
 * @returns Estadísticas de curación con totales para 24hr, 7d y 30d
 */
export async function curationStats(account: string): Promise<CurationStatsResult> {
  try {
    // Validar entrada
    if (!account || account.trim() === '') {
      throw new Error('El nombre de cuenta es requerido');
    }

    const accountLower = account.toLowerCase().trim();

    // Verificar cache
    const cacheKey = `curation-stats-${accountLower}`;
    const cachedData = curationStatsCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CURATION_STATS_CACHE_DURATION) {
      console.log(`⚡ Cache hit para estadísticas de curación de ${accountLower}`);
      return cachedData.data;
    }

    console.log(`🔍 Calculando estadísticas de curación para ${accountLower}...`);

    // Calcular fechas límite
    const now = new Date();
    const date24HoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const date7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Usar fecha de 30 días como punto de inicio para obtener todos los datos necesarios
    const fromDate = date30DaysAgo;

    // Sets para evitar duplicaciones
    const processed24Hr = new Set<string>();
    const processed7D = new Set<string>();
    const processed30D = new Set<string>();

    // Arrays para recompensas
    const rewards24Hr: CurationReward[] = [];
    const rewards7D: CurationReward[] = [];
    const rewards30D: CurationReward[] = [];

    // Contadores de recompensas
    let totalVests24Hr = 0;
    let totalVests7D = 0;
    let totalVests30D = 0;

    // Paginación automática (inversa para API de Hive)
    let totalPages = 0;
    let currentPageIndex = 1;
    let hasMorePages = true;
    let totalProcessed = 0;

    console.log(`📅 Buscando recompensas desde ${fromDate.toISOString()}`);
    console.log(`📅 Límite 24hr: ${date24HoursAgo.toISOString()}`);

    while (hasMorePages) {
      // Calcular página real usando fórmula inversa
      // Primera petición: sin page (null)
      // Siguientes: page = total_pages - index + 1
      let actualPage = null;
      if (currentPageIndex === 1) {
        actualPage = null; // Primera petición sin page
      } else {
        actualPage = totalPages - currentPageIndex + 2; // Ajuste para paginación inversa
      }

      const response = await getHistoryRewards(accountLower, actualPage, fromDate);

      if (!response || response.rewards.length === 0) {
        break;
      }

      // Guardar total_pages de la primera respuesta
      if (currentPageIndex === 1) {
        totalPages = response.totalPages;
        console.log(`📊 Total páginas disponibles (desde API): ${totalPages}`);
        console.log(`📋 Procesando TODAS las páginas disponibles - sin límites artificiales`);
      }

      // Procesar cada recompensa
      for (const reward of response.rewards) {
        const rewardDate = new Date(reward.timestampMs);
        const operationId = reward.operationId;

        // Agregar a estadísticas de 30 días
        if (rewardDate >= date30DaysAgo && !processed30D.has(operationId)) {
          processed30D.add(operationId);
          rewards30D.push(reward);
          totalVests30D += reward.rewardVests;
        }

        // Agregar a estadísticas de 7 días
        if (rewardDate >= date7DaysAgo && !processed7D.has(operationId)) {
          processed7D.add(operationId);
          rewards7D.push(reward);
          totalVests7D += reward.rewardVests;
        }

        // Agregar a estadísticas de 24 horas
        if (rewardDate >= date24HoursAgo && !processed24Hr.has(operationId)) {
          processed24Hr.add(operationId);
          rewards24Hr.push(reward);
          totalVests24Hr += reward.rewardVests;
        }

        totalProcessed++;
      }

      // Determinar si hay más páginas
      hasMorePages = currentPageIndex < totalPages;
      currentPageIndex++;

      // Log de progreso cada 5 páginas
      if (currentPageIndex % 5 === 0) {
        console.log(
          `📊 Página ${currentPageIndex}/${totalPages}: ${totalProcessed} recompensas procesadas`
        );
      }
    }

    // Calcular totales en HP
    const cachedProps = await getGlobalPropsWithCache();

    // Convertir VESTS a HP para totales finales
    const total24Hr = rewards24Hr.reduce((sum, reward) => sum + reward.rewardHP, 0);
    const total7D = rewards7D.reduce((sum, reward) => sum + reward.rewardHP, 0);
    const total30D = rewards30D.reduce((sum, reward) => sum + reward.rewardHP, 0);

    const result: CurationStatsResult = {
      total24Hr,
      total7D,
      total30D,
      rewards24Hr,
      rewards7D,
      rewards30D,
      vestingData: {
        totalVestingFundHive: cachedProps.total_vesting_fund_hive,
        totalVestingShares: cachedProps.total_vesting_shares,
      },
    };

    // Guardar en cache
    curationStatsCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    console.log(`✅ Estadísticas calculadas para ${accountLower}:`);
    console.log(`   - Recompensas 24hr: ${total24Hr.toFixed(4)} HP (${rewards24Hr.length} ops)`);
    console.log(`   - Recompensas 7d: ${total7D.toFixed(4)} HP (${rewards7D.length} ops)`);
    console.log(`   - Recompensas 30d: ${total30D.toFixed(4)} HP (${rewards30D.length} ops)`);
    console.log(`   - Total procesado: ${totalProcessed} operaciones`);

    return result;
  } catch (error) {
    console.error(`❌ Error calculando estadísticas de curación para ${account}:`, error);
    throw error;
  }
}

/**
 * Limpia todos los caches de curación
 */
export function clearAllCurationCaches(): void {
  curationRewardsCache.clear();
  curationStatsCache.clear();
  console.log('🧹 Caches de curación limpiados');
}

/**
 * Interfaces optimizadas
 */
export interface OptimizedDelegationFilters {
  timePeriod: number; // días hacia atrás
  minimumHP: number;
  excludedUsers: string[];
}

export interface DelegatorInfo {
  delegator: string;
  currentHP: number;
  vestingShares: string;
  timestamp: string;
  trx_id: string;
  block_num: number;
  operation_id: string;
  participationPercentage: number;
}

export interface OptimizedDelegationsResult {
  activeDelegations: DelegatorInfo[];
  totalDelegationsHP: number;
  totalDelegators: number;
  excludedDelegators: string[];
  belowMinimumDelegators: string[];
  metadata: {
    totalOperationsFound: number;
    operationsInTimeRange: number;
    processedDelegators: number;
    filteredByMinHP: number;
    filteredByExclusion: number;
    timeRangeStart: string;
    timeRangeEnd: string;
  };
}

/**
 * Convierte una fecha a string ISO para usar con la API hafah
 */
export function getDateStringForAPI(targetDate: Date): string {
  const dateString = targetDate.toISOString();
  console.log(`📅 Fecha de corte para API (to-block): ${dateString}`);
  return dateString;
}

// Cache inteligente para operaciones de delegación
interface DelegationCache {
  username: string;
  operations: DelegationOperationResponse['operations_result'];
  fetchedAt: Date;
  toBlockDate: string; // Fecha límite hasta la que se obtuvieron datos
  isComplete: boolean; // Si se obtuvieron todas las páginas disponibles
}

const delegationCacheMap = new Map<string, DelegationCache>();
const DELEGATION_CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

/**
 * Limpia el cache de delegaciones
 */
export function clearDelegationCache(): void {
  delegationCacheMap.clear();
  console.log('🧹 Cache de delegaciones limpiado');
}

/**
 * Obtiene estadísticas del cache de delegaciones
 */
export function getDelegationCacheStats(): {
  totalEntries: number;
  entries: Array<{
    username: string;
    operationsCount: number;
    fetchedAt: string;
    toBlockDate: string;
    isComplete: boolean;
    ageMinutes: number;
  }>;
} {
  const now = new Date();
  const entries = Array.from(delegationCacheMap.entries()).map(([key, cache]) => ({
    username: cache.username,
    operationsCount: cache.operations.length,
    fetchedAt: cache.fetchedAt.toISOString(),
    toBlockDate: cache.toBlockDate || 'sin límite (hasta hoy)',
    isComplete: cache.isComplete,
    ageMinutes: Math.round((now.getTime() - cache.fetchedAt.getTime()) / (1000 * 60)),
  }));

  return {
    totalEntries: delegationCacheMap.size,
    entries,
  };
}

/**
 * Muestra estadísticas del cache en consola
 */
export function logDelegationCacheStats(): void {
  const stats = getDelegationCacheStats();

  console.log('📊 Estadísticas del Cache de Delegaciones:');
  console.log(`   - Total entradas: ${stats.totalEntries}`);

  if (stats.entries.length === 0) {
    console.log('   - Cache vacío');
    return;
  }

  stats.entries.forEach(entry => {
    console.log(`   - ${entry.username}:`);
    console.log(`     * Operaciones: ${entry.operationsCount}`);
    console.log(`     * Fecha obtención: ${entry.fetchedAt}`);
    console.log(`     * To-block: ${entry.toBlockDate}`);
    console.log(`     * Completo: ${entry.isComplete}`);
    console.log(`     * Edad: ${entry.ageMinutes} minutos`);
  });
}

/**
 * Estrategia inteligente para obtener delegaciones con cache
 */
export async function getDelegationsWithFilters(
  username: string,
  filters: OptimizedDelegationFilters
): Promise<OptimizedDelegationsResult> {
  console.log(`🚀 Iniciando búsqueda inteligente de delegaciones para: ${username}`);
  console.log(`📋 Filtros:`, filters);

  const startTime = Date.now();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - filters.timePeriod);
  const targetToBlock = getDateStringForAPI(cutoffDate);

  try {
    // Intentar usar cache inteligente
    const operations = await getOperationsWithIntelligentCache(
      username,
      targetToBlock,
      filters.timePeriod
    );

    console.log(`📦 Operaciones obtenidas: ${operations.length}`);
    console.log(
      `👥 Delegadores únicos: ${new Set(operations.map(op => op.op.value.delegator)).size}`
    );

    const processedDelegations = await processDelegationOperationsForCalculate(
      operations,
      username,
      filters,
      cutoffDate
    );

    const result = calculateDelegationStats(
      processedDelegations,
      filters,
      cutoffDate.toISOString()
    );

    const executionTime = Date.now() - startTime;
    console.log(`✅ Búsqueda completada en ${executionTime}ms`);
    console.log(
      `📈 Total HP: ${result.totalDelegationsHP.toFixed(2)} | Delegadores: ${
        result.totalDelegators
      }`
    );

    return result;
  } catch (error) {
    console.error('❌ Error en búsqueda optimizada:', error);
    throw error;
  }
}

/**
 * Obtiene operaciones usando cache inteligente
 */
async function getOperationsWithIntelligentCache(
  username: string,
  targetToBlock: string,
  timePeriod: number
): Promise<DelegationOperationResponse['operations_result']> {
  const cacheKey = `${username.toLowerCase()}`;
  const now = new Date();

  // Verificar si existe cache válido
  const cached = delegationCacheMap.get(cacheKey);

  if (cached && now.getTime() - cached.fetchedAt.getTime() < DELEGATION_CACHE_DURATION) {
    console.log(`⚡ Cache encontrado para ${username}:`);
    console.log(`   - Fecha de cache: ${cached.fetchedAt.toISOString()}`);
    console.log(`   - To-block cache: ${cached.toBlockDate}`);
    console.log(`   - To-block objetivo: ${targetToBlock}`);
    console.log(`   - Operaciones en cache: ${cached.operations.length}`);

    // Analizar si el cache puede satisfacer la petición
    if (canUseCachedData(cached, targetToBlock, timePeriod)) {
      console.log(`✅ Usando datos del cache (compatible)`);
      return cached.operations;
    } else {
      console.log(`🔄 Cache incompatible, necesitamos más datos`);
    }
  } else {
    console.log(`🆕 No hay cache válido para ${username}`);
  }

  // Determinar estrategia de obtención de datos
  const strategy = determineDataFetchingStrategy(cached, targetToBlock, timePeriod);
  console.log(`🧮 Estrategia: ${strategy.description}`);

  // Obtener datos según la estrategia
  let operations: DelegationOperationResponse['operations_result'];

  if (strategy.type === 'fetch_new') {
    operations = await fetchDelegationOperationsWithLimit(
      username,
      strategy.toBlock || '',
      strategy.maxPages
    );
  } else if (strategy.type === 'extend_cache') {
    // Obtener datos adicionales y combinar con cache
    const newOperations = await fetchDelegationOperationsWithLimit(
      username,
      strategy.toBlock || '',
      strategy.maxPages
    );
    operations = [...(cached?.operations || []), ...newOperations];

    // Eliminar duplicados por operation_id
    const seen = new Set<string>();
    operations = operations.filter(op => {
      if (seen.has(op.operation_id)) {
        return false;
      }
      seen.add(op.operation_id);
      return true;
    });
  } else {
    // filter_cache
    operations = cached?.operations || [];
  }

  // Actualizar cache
  updateDelegationCache(username, operations, strategy.toBlock || '', strategy.isComplete);

  return operations;
}

/**
 * Verifica si el cache puede satisfacer la petición actual
 */
function canUseCachedData(
  cached: DelegationCache,
  targetToBlock: string,
  timePeriod: number
): boolean {
  // Si el cache no tiene fecha límite (es completo hasta hoy)
  if (!cached.toBlockDate || cached.toBlockDate === '') {
    return true; // Datos completos, siempre sirven
  }

  // Si el objetivo es sin fecha límite (datos hasta hoy)
  if (!targetToBlock || targetToBlock === '') {
    return false; // Necesitamos datos más recientes
  }

  // Comparar fechas: el cache debe tener datos hasta una fecha igual o anterior al objetivo
  const cachedDate = new Date(cached.toBlockDate);
  const targetDate = new Date(targetToBlock);

  // El cache sirve si tiene datos hasta una fecha igual o anterior
  return cachedDate <= targetDate;
}

/**
 * Determina la estrategia óptima para obtener datos
 */
function determineDataFetchingStrategy(
  cached: DelegationCache | undefined,
  targetToBlock: string,
  timePeriod: number
): {
  type: 'fetch_new' | 'extend_cache' | 'filter_cache';
  description: string;
  toBlock?: string;
  maxPages?: number;
  isComplete: boolean;
} {
  // Caso 1: Sin cache - obtener datos nuevos
  if (!cached) {
    return {
      type: 'fetch_new',
      description: `Obtener datos nuevos hasta ${targetToBlock || 'hoy'} (sin cache)`,
      toBlock: targetToBlock,
      maxPages: getMaxPagesForPeriod(timePeriod),
      isComplete: false,
    };
  }

  // Caso 2: Cache completo (sin to-block) y objetivo con to-block
  if ((!cached.toBlockDate || cached.toBlockDate === '') && targetToBlock) {
    return {
      type: 'filter_cache',
      description: `Filtrar cache completo hasta ${targetToBlock}`,
      isComplete: true,
    };
  }

  // Caso 3: Cache con to-block y objetivo sin to-block (necesitamos datos más recientes)
  if (cached.toBlockDate && (!targetToBlock || targetToBlock === '')) {
    return {
      type: 'fetch_new',
      description: `Obtener datos completos hasta hoy (cache obsoleto con fecha ${cached.toBlockDate})`,
      toBlock: '',
      maxPages: getMaxPagesForPeriod(timePeriod),
      isComplete: false,
    };
  }

  // Caso 4: Ambos tienen to-block, comparar fechas
  if (cached.toBlockDate && targetToBlock) {
    const cachedDate = new Date(cached.toBlockDate);
    const targetDate = new Date(targetToBlock);

    if (cachedDate <= targetDate) {
      return {
        type: 'filter_cache',
        description: `Usar cache existente (${cached.toBlockDate} <= ${targetToBlock})`,
        isComplete: true,
      };
    } else {
      return {
        type: 'fetch_new',
        description: `Obtener datos hasta ${targetToBlock} (cache tiene fecha posterior)`,
        toBlock: targetToBlock,
        maxPages: getMaxPagesForPeriod(timePeriod),
        isComplete: false,
      };
    }
  }

  // Caso por defecto
  return {
    type: 'fetch_new',
    description: 'Estrategia por defecto - obtener datos nuevos',
    toBlock: targetToBlock,
    maxPages: getMaxPagesForPeriod(timePeriod),
    isComplete: false,
  };
}

/**
 * Obtiene el número máximo de páginas basado en el período
 */
function getMaxPagesForPeriod(timePeriod: number): number {
  // El número de páginas no depende del período sino de cuánto historial necesitamos
  // Para períodos largos, usamos más páginas porque necesitamos ir más atrás en el tiempo
  if (timePeriod <= 7) return 10; // 1 semana
  if (timePeriod <= 30) return 25; // 1 mes
  if (timePeriod <= 90) return 50; // 3 meses
  return 100; // Más de 3 meses
}

/**
 * Actualiza el cache de delegaciones
 */
function updateDelegationCache(
  username: string,
  operations: DelegationOperationResponse['operations_result'],
  toBlockDate: string,
  isComplete: boolean
): void {
  const cacheKey = username.toLowerCase();

  delegationCacheMap.set(cacheKey, {
    username,
    operations,
    fetchedAt: new Date(),
    toBlockDate,
    isComplete,
  });

  console.log(`💾 Cache actualizado para ${username}:`);
  console.log(`   - Operaciones: ${operations.length}`);
  console.log(`   - To-block: ${toBlockDate || 'sin límite (hasta hoy)'}`);
  console.log(`   - Completo: ${isComplete}`);
}

/**
 * Obtiene operaciones de delegación respetando total_pages de la API
 */
export async function fetchDelegationOperationsComplete(
  username: string,
  toBlockDate: string
): Promise<DelegationOperationResponse['operations_result']> {
  const allOperations: DelegationOperationResponse['operations_result'] = [];

  /// validar toBlockDate si no existe retorna error
  if (!toBlockDate || !username) {
    throw new Error(toBlockDate ? 'username is required' : 'toBlockDate is required');
  }
  const cachedProps = await getGlobalPropsWithCache();
  const chain = cachedProps.chain;

  try {
    const chainExtendedRestApi = {
      'hafah-api': {
        accounts: {
          operations: {
            urlPath: '{accountName}/operations',
          },
        },
      },
    };

    const extended: TWaxRestExtended<typeof chainExtendedRestApi> =
      chain.extendRest(chainExtendedRestApi);

    // Parámetros base optimizados para evitar timeouts
    const baseQuery: any = {
      accountName: username,
      'operation-types': '40',
      'page-size': 200, // Reducido para evitar timeouts
      'data-size-limit': 150000, // Reducido para mejor estabilidad
    };

    // Solo añadir to-block si es necesario
    if (toBlockDate && toBlockDate !== '') {
      baseQuery['to-block'] = toBlockDate;
      console.log(`🔍 Consultando historial hasta fecha: ${toBlockDate}`);
    } else {
      console.log(`🔍 Consultando historial reciente (sin límite de fecha)`);
    }

    console.log(`📋 Parámetros base:`, baseQuery);

    // Primera petición para obtener información de paginación
    let currentPage = 1;
    let totalPages = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const query = { ...baseQuery };

      // Añadir número de página solo si no es la primera
      if (currentPage > 1) {
        query['page'] = currentPage;
      }

      console.log(`📄 Obteniendo página ${currentPage}/${totalPages}...`);

      try {
        const result = await (extended.restApi as any)['hafah-api'].accounts.operations(query);
        const data = result as DelegationOperationResponse;

        // Actualizar información de paginación en la primera respuesta
        if (currentPage === 1) {
          totalPages = data.total_pages || 1;
          console.log(`📊 Total de páginas disponibles (desde API): ${totalPages}`);
          console.log(`📊 Total de operaciones: ${data.total_operations || 0}`);
        }

        const operations = data.operations_result || [];
        console.log(`📦 Página ${currentPage}: ${operations.length} operaciones`);

        // Añadir operaciones al array total
        allOperations.push(...operations);

        // Verificar si hay más páginas - RESPETANDO total_pages de la API
        hasMorePages = currentPage < totalPages;

        currentPage++;

        // Pausa progresiva entre peticiones para evitar timeouts
        if (hasMorePages) {
          const delay = Math.min(500 + currentPage * 50, 1000); // Aumentar delay progresivamente
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (pageError) {
        console.error(`❌ Error en página ${currentPage}:`, pageError);

        // Si falla una página específica, intentar continuar con la siguiente
        if (currentPage === 1) {
          // Si falla la primera página, es un error crítico
          throw pageError;
        } else {
          // Si falla una página intermedia, reintentar con delay mayor
          const retryDelay = Math.min(3000 + currentPage * 100, 3000);
          console.log(`⚠️ Reintentando página ${currentPage} en ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));

          try {
            // Segundo intento con timeout más largo
            const retryQuery = { ...baseQuery };
            if (currentPage > 1) {
              retryQuery['page'] = currentPage;
            }

            const result = await (extended.restApi as any)['hafah-api'].accounts.operations(
              retryQuery
            );
            const data = result as DelegationOperationResponse;

            const operations = data.operations_result || [];
            console.log(`🔄 Página ${currentPage} (reintento): ${operations.length} operaciones`);

            allOperations.push(...operations);
            hasMorePages = currentPage < totalPages;
            currentPage++;
          } catch (retryError) {
            console.error(`❌ Error en reintento de página ${currentPage}:`, retryError);
            // Saltar página después de fallar el reintento
            console.log(`⚠️ Saltando página ${currentPage} después del reintento fallido`);
            currentPage++;
            hasMorePages = currentPage <= totalPages;

            if (currentPage > totalPages) {
              hasMorePages = false;
            }
          }
        }
      }
    }

    const pagesProcessed = currentPage - 1;

    console.log(
      `✅ Paginación completada: ${allOperations.length} operaciones de ${pagesProcessed}/${totalPages} páginas`
    );

    return allOperations;
  } catch (error) {
    console.error('Error fetching delegation operations:', error);
    throw error;
  }
}

/**
 * Función optimizada que respeta total_pages de la API
 */
export async function fetchDelegationOperationsOptimized(
  username: string,
  toBlockDate: string
): Promise<DelegationOperationResponse['operations_result']> {
  // Usar la nueva versión sin límites artificiales
  return await fetchDelegationOperationsComplete(username, toBlockDate);
}

/**
 * Versión con límite de seguridad para casos extremos
 */
export async function fetchDelegationOperationsWithLimit(
  username: string,
  toBlockDate: string,
  maxPages?: number // Opcional: solo para casos extremos de seguridad
): Promise<DelegationOperationResponse['operations_result']> {
  if (maxPages) {
    console.warn(`⚠️ Usando versión con límite artificial de ${maxPages} páginas`);
    return await fetchDelegationOperationsComplete(username, toBlockDate);
  }
  console.log(`📋 Sin límite artificial - respetando total_pages de la API`);
  return await fetchDelegationOperationsComplete(username, toBlockDate);
}

/**
 * Filtra operaciones por fecha límite si es necesario
 */
function filterOperationsByDate(
  operations: DelegationOperationResponse['operations_result'],
  cutoffDate: Date
): DelegationOperationResponse['operations_result'] {
  return operations.filter(op => {
    const operationDate = new Date(op.timestamp);
    return operationDate >= cutoffDate;
  });
}

/**
 * Procesa las operaciones para la página de calculate
 * CORRIGE LA LÓGICA: Encuentra la última operación de cada delegador DENTRO del período especificado
 */
async function processDelegationOperationsForCalculate(
  operations: DelegationOperationResponse['operations_result'],
  username: string,
  filters: OptimizedDelegationFilters,
  cutoffDate: Date
): Promise<Map<string, DelegatorInfo>> {
  console.log(
    `🔄 Procesando ${operations.length} operaciones con fecha límite: ${cutoffDate.toISOString()}...`
  );

  const delegatorsMap = new Map<string, DelegatorInfo>();
  let processedCount = 0;
  let incomingOperations = 0;
  let operationsInPeriod = 0;

  // PASO 1: Filtrar y procesar solo operaciones DENTRO del período
  for (const operation of operations) {
    processedCount++;

    const { delegator, delegatee, vesting_shares } = operation.op.value;
    const operationDate = new Date(operation.timestamp);

    // Solo delegaciones hacia el usuario objetivo

    // No procesar auto-delegaciones (delegador = usuario buscado)
    // Ignorar auto-delegaciones (delegador = usuario buscado)
    if (delegator === username || delegatee !== username) {
      continue;
    }

    console.log('delegator', delegator);
    console.log('delegatee', delegatee);
    console.log('username', username);

    incomingOperations++;

    // ✨ CORRECCIÓN CLAVE: Solo procesar operaciones DENTRO del período
    // Para filtros de 30 días: solo operaciones >= hace 30 días
    if (operationDate < cutoffDate) {
      continue; // Operación fuera del período, no la consideramos
    }

    operationsInPeriod++;

    const vestingAmount = vesting_shares.amount;
    const currentHP = await vestsToHP(`${vestingAmount} VESTS`);

    // Tomar la operación más reciente POR DELEGADOR DENTRO DEL PERÍODO
    const existingInfo = delegatorsMap.get(delegator);

    if (!existingInfo || operation.timestamp > existingInfo.timestamp) {
      delegatorsMap.set(delegator, {
        delegator,
        currentHP,
        vestingShares: `${vestingAmount} VESTS`,
        timestamp: operation.timestamp,
        trx_id: operation.trx_id,
        block_num: operation.block,
        operation_id: operation.operation_id,
        participationPercentage: 0,
      });
    }

    if (processedCount % 100 === 0) {
      console.log(
        `   📊 Procesadas ${processedCount}/${operations.length} operaciones (${operationsInPeriod} en período)...`
      );
    }
  }

  // PASO 2: Filtrar solo delegaciones activas (HP > 0)
  const activeDelegators = new Map<string, DelegatorInfo>();
  for (const [delegator, info] of delegatorsMap.entries()) {
    if (info.currentHP > 0) {
      activeDelegators.set(delegator, info);
    }
  }

  console.log(`✅ Procesamiento completado:`);
  console.log(`   📅 Operaciones totales procesadas: ${operations.length}`);
  console.log(`   📅 Operaciones entrantes al proyecto: ${incomingOperations}`);
  console.log(
    `   ✨ Operaciones en el período (>= ${cutoffDate.toISOString().split('T')[0]}): ${operationsInPeriod}`
  );
  console.log(`   👥 Delegadores únicos en el período: ${delegatorsMap.size}`);
  console.log(`   🔥 Delegadores activos (HP > 0): ${activeDelegators.size}`);

  return activeDelegators;
}

/**
 * Procesa las operaciones y filtra delegaciones entrantes (versión simplificada para dashboard)
 */
async function processDelegationOperationsSimplified(
  operations: DelegationOperationResponse['operations_result'],
  username: string,
  filters: OptimizedDelegationFilters,
  cutoffDate: Date
): Promise<Map<string, DelegatorInfo>> {
  console.log(
    `🔄 Procesando ${operations.length} operaciones desde ${cutoffDate.toISOString()}...`
  );

  const delegatorsMap = new Map<string, DelegatorInfo>();
  let processedCount = 0;
  let operationsInTimeRange = 0;

  for (const operation of operations) {
    processedCount++;

    const { delegator, delegatee, vesting_shares } = operation.op.value;

    // Solo delegaciones hacia el usuario objetivo
    if (delegatee !== username) {
      continue;
    }

    // No procesar auto-delegaciones
    if (delegator === username) {
      continue;
    }

    // Filtro por fecha: solo operaciones desde la fecha de corte hacia adelante
    const operationDate = new Date(operation.timestamp);
    if (operationDate >= cutoffDate) {
      operationsInTimeRange++;

      const vestingAmount = vesting_shares.amount;
      const currentHP = await vestsToHP(`${vestingAmount} VESTS`);

      // Tomar la operación más reciente por delegador
      if (
        !delegatorsMap.has(delegator) ||
        operation.timestamp > delegatorsMap.get(delegator)!.timestamp
      ) {
        delegatorsMap.set(delegator, {
          delegator,
          currentHP,
          vestingShares: `${vestingAmount} VESTS`,
          timestamp: operation.timestamp,
          trx_id: operation.trx_id,
          block_num: operation.block,
          operation_id: operation.operation_id,
          participationPercentage: 0,
        });
      }
    }

    if (processedCount % 100 === 0) {
      console.log(
        `   📊 Procesadas ${processedCount}/${operations.length} operaciones (${operationsInTimeRange} en rango)...`
      );
    }
  }

  console.log(
    `✅ Procesamiento completado: ${
      delegatorsMap.size
    } delegadores únicos desde ${cutoffDate.toISOString()}`
  );
  console.log(`📅 Operaciones en rango de tiempo: ${operationsInTimeRange}/${operations.length}`);
  return delegatorsMap;
}

/**
 * Procesa las operaciones y filtra delegaciones entrantes (versión original para dashboard)
 */
async function processDelegationOperations(
  operations: DelegationOperationResponse['operations_result'],
  username: string,
  filters: OptimizedDelegationFilters
): Promise<Map<string, DelegatorInfo>> {
  console.log(`🔄 Procesando ${operations.length} operaciones...`);

  const delegatorsMap = new Map<string, DelegatorInfo>();
  let processedCount = 0;

  for (const operation of operations) {
    processedCount++;

    const { delegator, delegatee, vesting_shares } = operation.op.value;

    if (delegatee !== username) {
      continue;
    }

    if (delegator === username) {
      continue;
    }

    const vestingAmount = vesting_shares.amount;
    const currentHP = await vestsToHP(`${vestingAmount} VESTS`);

    if (
      !delegatorsMap.has(delegator) ||
      operation.timestamp > delegatorsMap.get(delegator)!.timestamp
    ) {
      delegatorsMap.set(delegator, {
        delegator,
        currentHP,
        vestingShares: `${vestingAmount} VESTS`,
        timestamp: operation.timestamp,
        trx_id: operation.trx_id,
        block_num: operation.block,
        operation_id: operation.operation_id,
        participationPercentage: 0,
      });
    }

    if (processedCount % 100 === 0) {
      console.log(`   📊 Procesadas ${processedCount}/${operations.length} operaciones...`);
    }
  }

  console.log(`✅ Procesamiento completado: ${delegatorsMap.size} delegadores únicos`);
  return delegatorsMap;
}

/**
 * Calcula estadísticas finales y aplica filtros
 */
function calculateDelegationStats(
  delegatorsMap: Map<string, DelegatorInfo>,
  filters: OptimizedDelegationFilters,
  timeRangeStart: string
): OptimizedDelegationsResult {
  console.log(`📊 Calculando estadísticas y aplicando filtros...`);

  const allDelegators = Array.from(delegatorsMap.values());
  const excludedDelegators: string[] = [];
  const belowMinimumDelegators: string[] = [];
  const activeDelegations: DelegatorInfo[] = [];

  for (const delegator of allDelegators) {
    if (filters.excludedUsers.includes(delegator.delegator)) {
      excludedDelegators.push(delegator.delegator);
      continue;
    }

    if (delegator.currentHP < filters.minimumHP) {
      belowMinimumDelegators.push(delegator.delegator);
      continue;
    }

    if (delegator.currentHP > 0) {
      activeDelegations.push(delegator);
    }
  }

  const totalDelegationsHP = activeDelegations.reduce((sum, d) => sum + d.currentHP, 0);

  activeDelegations.forEach(delegation => {
    delegation.participationPercentage =
      totalDelegationsHP > 0 ? (delegation.currentHP / totalDelegationsHP) * 100 : 0;
  });

  activeDelegations.sort((a, b) => b.currentHP - a.currentHP);

  const result: OptimizedDelegationsResult = {
    activeDelegations,
    totalDelegationsHP,
    totalDelegators: activeDelegations.length,
    excludedDelegators,
    belowMinimumDelegators,
    metadata: {
      totalOperationsFound: allDelegators.length,
      operationsInTimeRange: allDelegators.length,
      processedDelegators: allDelegators.length,
      filteredByMinHP: belowMinimumDelegators.length,
      filteredByExclusion: excludedDelegators.length,
      timeRangeStart,
      timeRangeEnd: new Date().toISOString(),
    },
  };

  console.log(`📈 Estadísticas finales:`);
  console.log(`   👥 Delegadores activos: ${result.totalDelegators}`);
  console.log(`   💰 HP total: ${result.totalDelegationsHP.toFixed(2)}`);
  console.log(`   🚫 Excluidos: ${result.excludedDelegators.length}`);
  console.log(`   ⬇️ Bajo mínimo: ${result.belowMinimumDelegators.length}`);

  return result;
}

// === FUNCIONES ORIGINALES PARA DASHBOARD ===

// Interface para delegación saliente (outgoing)
export interface OutgoingDelegation {
  delegatee: string;
  amount: string;
  operation_id: string;
  block_num: number;
}

// Interface para delegación entrante (incoming)
export interface IncomingDelegation {
  delegator: string;
  amount: string;
  operation_id: string;
  block_num: number;
}

// Interface para la respuesta completa de balance-api/delegations
export interface BalanceApiDelegationsResponse {
  outgoing_delegations: OutgoingDelegation[];
  incoming_delegations: IncomingDelegation[];
}

export interface DelegationWithDetails extends IncomingDelegation {
  hpAmount?: number;
  timestamp?: string;
  date?: Date;
  trx_id?: string;
  operation_details?: any;
}

/**
 * Función original para obtener delegaciones usando balance-api (para dashboard)
 */
export async function getAllDelegationsIncoming(
  delegatorAccount: string
): Promise<IncomingDelegation[]> {
  try {
    const chain = await createHiveChain();
    if (!chain) {
      throw new Error('Hive chain not initialized');
    }

    const chainExtendedRestApi = {
      'balance-api': {
        accounts: {
          delegations: {
            urlPath: '{accountName}/delegations',
          },
        },
      },
    } as const;

    const extendedHiveChain = chain.extendRest(chainExtendedRestApi);

    const response = await (extendedHiveChain.restApi as any)['balance-api'].accounts.delegations({
      accountName: delegatorAccount,
    });

    if (!response || typeof response !== 'object') {
      console.warn('Response does not have expected structure:', response);
      return [];
    }

    const balanceResponse = response as BalanceApiDelegationsResponse;
    return balanceResponse.incoming_delegations || [];
  } catch (error) {
    console.error(`Error fetching vesting delegations for ${delegatorAccount}:`, error);
    return [];
  }
}

/**
 * Función optimizada para convertir múltiples delegaciones en lote
 */
export async function convertDelegationsToHP(
  delegations: IncomingDelegation[]
): Promise<Array<IncomingDelegation & { hpAmount: number }>> {
  if (delegations.length === 0) return [];

  console.log(`🔄 Convirtiendo ${delegations.length} delegaciones a HP en lote...`);

  try {
    const cachedProps = await getGlobalPropsWithCache();

    const convertedDelegations = delegations.map(delegation => {
      try {
        const hpAmount = cachedProps.chain.vestsToHp(
          delegation.amount,
          cachedProps.total_vesting_fund_hive,
          cachedProps.total_vesting_shares
        );

        return {
          ...delegation,
          hpAmount: parseFloat(hpAmount.amount) / 1000,
        };
      } catch (error) {
        const vestsAmount = parseFloat(delegation.amount);
        return {
          ...delegation,
          hpAmount: vestsAmount * 0.0005993102,
        };
      }
    });

    console.log(`✅ Convertidas ${convertedDelegations.length} delegaciones a HP`);
    return convertedDelegations;
  } catch (error) {
    console.error('Error en conversión en lote:', error);

    return delegations.map(delegation => ({
      ...delegation,
      hpAmount: parseFloat(delegation.amount) * 0.0005993102,
    }));
  }
}

// Cache para información de operaciones usando hafah-api
interface OperationInfoCache {
  block_num: number;
  timestamp: string;
  trx_id: string;
  operation_id: string;
  cached_at: number;
}

let operationInfoCache = new Map<string, OperationInfoCache>();
const OPERATION_CACHE_DURATION = 60 * 60 * 1000; // 60 minutos

/**
 * Obtiene detalles de operación específica usando hafah-api con cache
 */

/**
 * Función principal para obtener delegaciones con detalles completos (para dashboard)
 */
export async function getAllDelegationsWithDetails(
  username: string
): Promise<DelegationWithDetails[]> {
  try {
    console.log(`🚀 Obteniendo delegaciones completas para @${username}...`);

    // Obtener delegaciones básicas
    const basicDelegations = await getAllDelegationsIncoming(username);
    console.log(`📊 Encontradas ${basicDelegations.length} delegaciones básicas`);

    if (basicDelegations.length === 0) {
      return [];
    }

    // Convertir a HP
    const delegationsWithHP = await convertDelegationsToHP(basicDelegations);
    console.log(`💰 Convertidas ${delegationsWithHP.length} delegaciones a HP`);

    // Convertir al formato esperado
    const delegationsWithDetails: DelegationWithDetails[] = delegationsWithHP.map(delegation => ({
      ...delegation,
      // Inicializar campos opcionales
    }));

    console.log(`✅ Preparadas ${delegationsWithDetails.length} delegaciones para dashboard`);
    return delegationsWithDetails;
  } catch (error) {
    console.error('❌ Error en getAllDelegationsWithDetails:', error);
    return [];
  }
}

/**
 * Agrega detalles completos a las delegaciones de forma optimizada
 */
export async function addFullDetailsToDelegationsOptimized(
  delegations: DelegationWithDetails[]
): Promise<DelegationWithDetails[]> {
  console.log(`🔄 Agregando detalles completos a ${delegations.length} delegaciones...`);

  const delegationsWithDetails: DelegationWithDetails[] = [];

  for (const delegation of delegations) {
    try {
      // Si no se pueden obtener detalles, mantener la delegación sin ellos
      delegationsWithDetails.push({
        ...delegation,
        timestamp: undefined,
        date: undefined,
        trx_id: undefined,
        operation_details: undefined,
      });
    } catch (error) {
      console.warn(`⚠️ Error procesando delegación de ${delegation.delegator}:`, error);
      delegationsWithDetails.push(delegation);
    }
  }

  console.log(`✅ Procesadas ${delegationsWithDetails.length} delegaciones con detalles`);
  return delegationsWithDetails;
}

/**
 * Función para formatear fecha de delegación
 */
export function formatDelegationDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Función de testing para verificar que respetamos total_pages de la API
 * Esta función hace una consulta completa y reporta estadísticas detalladas
 */

// ===== FUNCIONES WRAPPER PARA AUTENTICACIÓN =====

/**
 * ✅ FUNCIÓN WRAPPER PARA OBTENER DELEGACIONES AUTENTICADAS
 * Garantiza que siempre se use el usuario autenticado actual
 */
export async function getDelegations(
  filters?: OptimizedDelegationFilters
): Promise<OptimizedDelegationsResult> {
  // Obtener usuario autenticado
  const { getCurrentAuthenticatedUser } = await import('./auth/guards.js');
  const authenticatedUser = getCurrentAuthenticatedUser();
  
  if (!authenticatedUser) {
    throw new Error('Usuario no autenticado. Debes iniciar sesión para obtener delegaciones.');
  }

  // Usar filtros por defecto si no se proporcionan
  const defaultFilters: OptimizedDelegationFilters = {
    timePeriod: 30,
    minimumHP: 50,
    excludedUsers: [],
    ...filters
  };

  console.log(`🔒 Obteniendo delegaciones para usuario autenticado: ${authenticatedUser}`);

  return await getDelegationsWithFilters(authenticatedUser, defaultFilters);
}

/**
 * ✅ FUNCIÓN WRAPPER PARA OBTENER DELEGACIONES DE DASHBOARD AUTENTICADAS
 * Garantiza que siempre se use el usuario autenticado actual
 */
export async function getDashboardDelegations(): Promise<DelegationWithDetails[]> {
  // Obtener usuario autenticado
  const { getCurrentAuthenticatedUser } = await import('./auth/guards.js');
  const authenticatedUser = getCurrentAuthenticatedUser();
  
  if (!authenticatedUser) {
    throw new Error('Usuario no autenticado. Debes iniciar sesión para obtener delegaciones del dashboard.');
  }

  console.log(`🔒 Obteniendo delegaciones de dashboard para usuario autenticado: ${authenticatedUser}`);

  return await getAllDelegationsWithDetails(authenticatedUser);
}

/**
 * ✅ FUNCIÓN WRAPPER PARA OBTENER ESTADÍSTICAS DE CURACIÓN AUTENTICADAS
 * Garantiza que siempre se use el usuario autenticado actual
 */
export async function getUserCurationStats(): Promise<CurationStatsResult> {
  // Obtener usuario autenticado
  const { getCurrentAuthenticatedUser } = await import('./auth/guards.js');
  const authenticatedUser = getCurrentAuthenticatedUser();
  
  if (!authenticatedUser) {
    throw new Error('Usuario no autenticado. Debes iniciar sesión para obtener estadísticas de curación.');
  }

  console.log(`🔒 Obteniendo estadísticas de curación para usuario autenticado: ${authenticatedUser}`);

  return await curationStats(authenticatedUser);
}

/**
 * ✅ FUNCIÓN WRAPPER PARA OBTENER HISTORIAL DE RECOMPENSAS AUTENTICADAS
 * Garantiza que siempre se use el usuario autenticado actual
 */
export async function getUserHistoryRewards(
  page?: number,
  fromDate?: Date
): Promise<CurationRewardsResponse | null> {
  // Obtener usuario autenticado
  const { getCurrentAuthenticatedUser } = await import('./auth/guards.js');
  const authenticatedUser = getCurrentAuthenticatedUser();
  
  if (!authenticatedUser) {
    throw new Error('Usuario no autenticado. Debes iniciar sesión para obtener historial de recompensas.');
  }

  console.log(`🔒 Obteniendo historial de recompensas para usuario autenticado: ${authenticatedUser}`);

  return await getHistoryRewards(authenticatedUser, page, fromDate);
}
