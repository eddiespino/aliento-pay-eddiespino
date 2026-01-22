import { decodeFiltersFromUrl } from './filter-validation.js';
import { fetchDelegationOperationsServer, vestsToHpServer, type DelegationOperation } from './hive-http-client.js';
import { getCurrentAuthenticatedUser } from './auth/guards.js';

/**
 * Interfaz para los filtros de la página calculate
 * ACTUALIZADA: Incluye username autenticado como campo requerido
 */
export interface CalculateFilters {
  account?: string; // cuenta target (opcional, por defecto usuario autenticado)
  timePeriod: number; // días
  minimumHP: number;
  excludedUsers: string[];
  applied: boolean;
  curationPeriod?: string; // período de curación seleccionado (24h/7d/30d)
  curationValue?: number; // valor de curación correspondiente al período
}

/**
 * Interfaz para un delegador con su información calculada
 */
export interface DelegatorData {
  delegator: string;
  hp: number;
  percentage: number;
  hiveToReceive: number;
  blockNum: number;
  timestamp: string;
}

/**
 * Interfaz para el resultado completo del cálculo
 */
export interface CalculationResult {
  delegators: DelegatorData[];
  totalHP: number;
  totalHiveToDistribute: number;
  cutoffDate: string;
  processedOperations: number;
}

/**
 * Obtiene la última delegación de cada delegador hasta una fecha de corte
 * @param operations - Array de operaciones de delegación
 * @param targetAccount - Cuenta objetivo (solo delegaciones TO esta cuenta)
 * @returns Objeto con la última delegación de cada delegador
 */
function getLatestDelegationsByDelegator(
  operations: DelegationOperation[],
  targetAccount: string
): Record<
  string,
  {
    vesting_shares: string;
    block_num: number;
    timestamp: string;
  }
> {
  const latest: Record<
    string,
    {
      vesting_shares: string;
      block_num: number;
      timestamp: string;
    }
  > = {};

  for (const op of operations) {
    // Solo procesar delegaciones HACIA la cuenta objetivo
    if (op.delegatee !== targetAccount) {
      continue;
    }

    const delegator = op.delegator;
    const vesting_shares = op.vesting_shares;
    const block_num = op.block;
    const timestamp = op.timestamp;

    // Si es la primera vez o es más reciente, la guardamos
    if (!latest[delegator] || block_num > latest[delegator].block_num) {
      latest[delegator] = {
        vesting_shares,
        block_num,
        timestamp,
      };
    }
  }

  // Filtrar los que tienen 0 VESTS (retiro total)
  Object.keys(latest).forEach(delegator => {
    const vestsStr = latest[delegator].vesting_shares;
    const vestsNum = parseFloat(vestsStr.replace(/[^0-9.]/g, '')) || 0;
    if (vestsNum === 0) {
      delete latest[delegator];
    }
  });

  return latest;
}

/**
 * Calcula la fecha de corte basada en el período de tiempo
 * @param timePeriod - Días hacia atrás desde hoy
 * @returns Fecha de corte en formato YYYY-MM-DD
 */
export function calculateCutoffDate(timePeriod: number): string {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timePeriod);
  return cutoffDate.toISOString().split('T')[0];
}

/**
 * Decodifica los filtros de la query string
 * @param filtersParam - Parámetro filters codificado
 * @returns Objeto con los filtros decodificados
 */
export function decodeFilters(filtersParam: string): CalculateFilters {
  try {
    return decodeFiltersFromUrl(filtersParam);
  } catch (error) {
    console.error('❌ Error decodificando filtros:', error);
    console.error('❌ Parámetro recibido:', filtersParam);

    // Retornar filtros por defecto en caso de error
    return {
      timePeriod: 30,
      minimumHP: 50,
      excludedUsers: [],
      applied: true,
      curationPeriod: '30d',
      curationValue: 0,
    };
  }
}

/**
 * Calcula la distribución de curación para una cuenta y filtros dados
 * @param account - Nombre de la cuenta
 * @param filters - Filtros aplicados
 * @param hiveToDistribute - Cantidad base de Hive a distribuir (viene de curationValue)
 * @param interestPercentage - Porcentaje de descuento a aplicar sobre la cantidad base
 * @returns Resultado completo del cálculo
 */
export async function calculateCurationDistribution(
  account: string,
  filters: CalculateFilters,
  hiveToDistribute: number,
  interestPercentage: number
): Promise<CalculationResult> {
  try {
    console.log(`🔍 Calculando distribución para ${account} con filtros:`, filters);
    console.log(`🚫 Usuarios a excluir: [${filters.excludedUsers.join(', ')}]`);

    // Calcular fecha de corte
    const cutoffDate = calculateCutoffDate(filters.timePeriod);
    console.log(`📅 Fecha de corte: ${cutoffDate}`);

    // Obtener operaciones hasta la fecha de corte
    const operations = await fetchDelegationOperationsServer(account, cutoffDate);
    console.log(`📦 Operaciones obtenidas: ${operations.length}`);

    // Obtener última delegación de cada delegador (solo delegaciones TO account)
    const latestDelegations = getLatestDelegationsByDelegator(operations, account);
    console.log(`👥 Delegadores únicos: ${Object.keys(latestDelegations).length}`);

    // Procesar delegadores y convertir VESTS a HP
    const delegators: DelegatorData[] = [];
    let totalHP = 0;

    for (const [delegator, delegationData] of Object.entries(latestDelegations)) {
      if (delegator === account) {
        console.log(`⚠️ ${delegator} excluido por ser el mismo que account`);
        continue;
      }

      // Convertir VESTS a HP solo aquí
      const hp = await vestsToHpServer(delegationData.vesting_shares);

      // Excluir delegadores que no tengan HP

      // excluir si delegator es el mismo que account

      // Aplicar filtros
      if (hp < filters.minimumHP) {
        console.log(
          `⚠️ ${delegator} excluido por HP mínimo: ${hp.toFixed(2)} < ${filters.minimumHP}`
        );
        continue;
      }

      if (filters.excludedUsers.includes(delegator)) {
        console.log(`⚠️ ${delegator} excluido por filtro manual`);
        continue;
      }

      // Agregar al resultado
      delegators.push({
        delegator,
        hp,
        percentage: 0, // Se calculará después
        hiveToReceive: 0, // Se calculará después
        blockNum: delegationData.block_num,
        timestamp: delegationData.timestamp,
      });

      totalHP += hp;
    }

    // Calcular porcentajes y distribución
    // El porcentaje de interés reduce la cantidad base de curación a distribuir
    const totalHiveToDistribute = filters.curationValue
      ? filters.curationValue * ((100 - interestPercentage) / 100)
      : hiveToDistribute * ((100 - interestPercentage) / 100);

    for (const delegator of delegators) {
      delegator.percentage = (delegator.hp / totalHP) * 100;
      delegator.hiveToReceive = (delegator.hp / totalHP) * totalHiveToDistribute;
    }

    // Ordenar por HP descendente
    delegators.sort((a, b) => b.hp - a.hp);

    console.log(`✅ Cálculo completado:`);
    console.log(`   Total HP considerado: ${totalHP.toFixed(2)}`);
    console.log(`   Total Hive a distribuir: ${totalHiveToDistribute.toFixed(2)}`);
    console.log(`   Delegadores válidos: ${delegators.length}`);

    return {
      delegators,
      totalHP,
      totalHiveToDistribute,
      cutoffDate,
      processedOperations: operations.length,
    };
  } catch (error) {
    console.error('❌ Error calculando distribución:', error);
    throw error;
  }
}

/**
 * Recalcula la distribución aplicando nuevos filtros sin hacer petición API
 * @param originalResult - Resultado original del cálculo
 * @param newFilters - Nuevos filtros a aplicar
 * @param hiveToDistribute - Cantidad base de Hive a distribuir
 * @param interestPercentage - Porcentaje de descuento a aplicar
 * @returns Nuevo resultado con filtros aplicados
 */
export function recalculateDistribution(
  originalResult: CalculationResult,
  newFilters: CalculateFilters,
  hiveToDistribute: number,
  interestPercentage: number
): CalculationResult {
  console.log(`🔄 Recalculando distribución con nuevos filtros:`, newFilters);
  console.log(`🚫 Usuarios a excluir en recálculo: [${newFilters.excludedUsers.join(', ')}]`);

  // Filtrar delegadores basado en los nuevos filtros
  const filteredDelegators = originalResult.delegators.filter(delegator => {
    // Aplicar filtro de HP mínimo
    if (delegator.hp < newFilters.minimumHP) {
      console.log(
        `⚠️ ${delegator.delegator} excluido por HP mínimo: ${delegator.hp.toFixed(2)} < ${
          newFilters.minimumHP
        }`
      );
      return false;
    }

    // Aplicar filtro de usuarios excluidos
    if (newFilters.excludedUsers.includes(delegator.delegator)) {
      console.log(`⚠️ ${delegator.delegator} excluido por filtro manual en recálculo`);
      return false;
    }

    return true;
  });

  // Recalcular total HP
  const newTotalHP = filteredDelegators.reduce((sum, delegator) => sum + delegator.hp, 0);

  // Recalcular distribución
  // El porcentaje de interés reduce la cantidad base de curación a distribuir
  const totalHiveToDistribute = newFilters.curationValue
    ? newFilters.curationValue * ((100 - interestPercentage) / 100)
    : hiveToDistribute * ((100 - interestPercentage) / 100);

  // Recalcular porcentajes y distribación para cada delegador
  const recalculatedDelegators = filteredDelegators.map(delegator => ({
    ...delegator,
    percentage: (delegator.hp / newTotalHP) * 100,
    hiveToReceive: (delegator.hp / newTotalHP) * totalHiveToDistribute,
  }));

  // Ordenar por HP descendente
  recalculatedDelegators.sort((a, b) => b.hp - a.hp);

  console.log(`✅ Recálculo completado:`);
  console.log(`   Delegadores originales: ${originalResult.delegators.length}`);
  console.log(`   Delegadores después de filtros: ${recalculatedDelegators.length}`);
  console.log(`   Total HP original: ${originalResult.totalHP.toFixed(2)}`);
  console.log(`   Total HP recalculado: ${newTotalHP.toFixed(2)}`);

  return {
    delegators: recalculatedDelegators,
    totalHP: newTotalHP,
    totalHiveToDistribute,
    cutoffDate: originalResult.cutoffDate,
    processedOperations: originalResult.processedOperations,
  };
}

/**
 * Formatea un número como HP con decimales
 * @param value - Valor numérico
 * @param decimals - Número de decimales (por defecto 2)
 * @returns String formateado
 */
export function formatHP(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Formatea un porcentaje
 * @param value - Valor del porcentaje
 * @param decimals - Número de decimales (por defecto 2)
 * @returns String formateado con símbolo %
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * ✅ FUNCIÓN WRAPPER PARA CÁLCULO AUTENTICADO
 * Garantiza que siempre se use el usuario autenticado actual
 */
export async function calculateCuration(
  filters: CalculateFilters,
  hiveToDistribute?: number,
  interestPercentage?: number
): Promise<CalculationResult> {
  // Obtener usuario autenticado
  const authenticatedUser = getCurrentAuthenticatedUser();
  if (!authenticatedUser) {
    throw new Error('Usuario no autenticado. Debes iniciar sesión para calcular distribuciones.');
  }

  // Usar la cuenta autenticada, ignorando cualquier cuenta especificada en filtros
  const targetAccount = authenticatedUser;
  
  console.log(`🔒 Calculando distribución para usuario autenticado: ${targetAccount}`);

  // Usar valores por defecto si no se proporcionan
  const defaultHiveToDistribute = hiveToDistribute || 100;
  const defaultInterestPercentage = interestPercentage || 10;

  return await calculateCurationDistribution(
    targetAccount,
    filters,
    defaultHiveToDistribute,
    defaultInterestPercentage
  );
}

/**
 * Formatea un número como Hive
 * @param value - Valor numérico
 * @param decimals - Número de decimales (por defecto 3)
 * @returns String formateado
 */
export function formatHive(value: number, decimals: number = 3): string {
  return value.toFixed(decimals);
}
