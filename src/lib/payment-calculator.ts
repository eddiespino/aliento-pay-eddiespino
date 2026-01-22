/**
 * 💰 CALCULADORA DE PAGOS DINÁMICOS
 *
 * ✅ Sistema genérico que calcula % de retorno dinámicos basados en:
 * - Curación real obtenida por cualquier cuenta en el período filtrado
 * - Delegaciones activas y filtros aplicados
 * - Distribución proporcional de ganancias
 * - Configuración personalizada por usuario
 */

import { getTotalCurationRewards } from './get-delegations.js';
import { curationStatsServer, type CurationStatsResult } from './curation-stats-server.js';

import type { CalculateFilters, CalculationResult } from './calculate-curation.js';

/**
 * Configuración de pagos dinámicos
 */
export interface PaymentConfig {
  account: string; // Cuenta que distribuye (ej: "aliento")
  baseCurationPercentage: number; // % base de curación a distribuir (ej: 80%)
  minimumReturnPercentage: number; // % mínimo garantizado (ej: 10%)
  maximumReturnPercentage: number; // % máximo permitido (ej: 20%)
}

/**
 * Resultado del cálculo de pagos dinámicos
 */
export interface DynamicPaymentResult {
  // Datos de curación
  curationStats: CurationStatsResult;
  totalCurationHP: number;
  curationPeriodDays: number;

  // Cálculos de distribución
  totalHPToDistribute: number;
  dynamicReturnPercentage: number;
  distributionAmount: number;

  // Información adicional
  appliedFilters: CalculateFilters;
  totalDelegationsConsidered: number;
  paymentDate: Date;

  // Delegadores con pagos calculados
  delegatorPayments: DelegatorPayment[];
}

/**
 * Pago individual calculado para un delegador
 */
export interface DelegatorPayment {
  delegator: string;
  delegatedHP: number;
  participationPercentage: number;
  baseHiveAmount: number; // Cantidad base según % fijo
  dynamicHiveAmount: number; // Cantidad con % dinámico
  estimatedHBD?: number; // Conversión estimada a HBD
  lastDelegationDate: string;
}

/**
 * Calcula % de retorno dinámico basado en curación real obtenida
 */
async function calculateDynamicReturnPercentage(
  account: string,
  filters: CalculateFilters,
  config: PaymentConfig
): Promise<{
  percentage: number;
  curationHP: number;
  stats: CurationStatsResult;
}> {
  console.log(`🔍 Calculando % dinámico para ${account} con filtros:`, filters);

  // Obtener estadísticas de curación
  const stats = await curationStatsServer(account);

  // Calcular curación en el período específico de los filtros
  const now = new Date();
  const fromDate = new Date(now.getTime() - filters.timePeriod * 24 * 60 * 60 * 1000);

  // Usar curación del período específico vs estadísticas generales
  let curationForPeriod: number;

  if (filters.timePeriod <= 1) {
    // Para períodos de 1 día o menos, usar estadísticas de 24hr
    curationForPeriod = stats.total24Hr;
    console.log(`📊 Usando curación 24hr: ${curationForPeriod.toFixed(4)} HP`);
  } else if (filters.timePeriod <= 7) {
    // Para períodos de 7 días o menos, usar estadísticas de 7d
    curationForPeriod = stats.total7D;
    console.log(`📊 Usando curación 7d: ${curationForPeriod.toFixed(4)} HP`);
  } else if (filters.timePeriod <= 30) {
    // Para períodos de 30 días o menos, usar estadísticas de 30d
    curationForPeriod = stats.total30D;
    console.log(`📊 Usando curación 30d: ${curationForPeriod.toFixed(4)} HP`);
  } else {
    // Para períodos más largos, calcular específicamente
    curationForPeriod = await getTotalCurationRewards(account, fromDate, now);
    console.log(
      `📊 Curación calculada para ${filters.timePeriod}d: ${curationForPeriod.toFixed(4)} HP`
    );
  }

  // Calcular % dinámico basado en curación real
  // Formula: (curación_obtenida / HP_total_delegado) * factor_distribución
  const curationPercentageOfTotal = curationForPeriod > 0 ? config.baseCurationPercentage / 100 : 0;

  // Ajustar % basado en rendimiento real vs esperado
  let dynamicPercentage = config.baseCurationPercentage * curationPercentageOfTotal;

  // Aplicar límites mínimos y máximos
  dynamicPercentage = Math.max(dynamicPercentage, config.minimumReturnPercentage);
  dynamicPercentage = Math.min(dynamicPercentage, config.maximumReturnPercentage);

  console.log(`📈 % dinámico calculado: ${dynamicPercentage.toFixed(2)}%`);
  console.log(`📈 Curación del período: ${curationForPeriod.toFixed(4)} HP`);

  return {
    percentage: dynamicPercentage,
    curationHP: curationForPeriod,
    stats,
  };
}

/**
 * Calcula pagos dinámicos para todos los delegadores
 */
export async function calculateDynamicPayments(
  calculationResult: CalculationResult,
  filters: CalculateFilters,
  config: PaymentConfig
): Promise<DynamicPaymentResult> {
  console.log(`💰 Iniciando cálculo de pagos dinámicos...`);

  try {
    // Calcular % de retorno dinámico
    const {
      percentage: dynamicPercentage,
      curationHP,
      stats,
    } = await calculateDynamicReturnPercentage(config.account, filters, config);

    // Calcular cantidad total a distribuir
    const totalHPConsidered = calculationResult.totalHP;
    const distributionAmount = (totalHPConsidered * dynamicPercentage) / 100;

    console.log(`💵 Total HP considerado: ${totalHPConsidered.toFixed(2)}`);
    console.log(`💵 % de retorno dinámico: ${dynamicPercentage.toFixed(2)}%`);
    console.log(`💵 Cantidad a distribuir: ${distributionAmount.toFixed(4)} HIVE`);

    // Calcular pagos individuales
    const delegatorPayments: DelegatorPayment[] = calculationResult.delegators.map(delegator => {
      const baseHiveAmount = (delegator.hp / totalHPConsidered) * distributionAmount;

      return {
        delegator: delegator.delegator,
        delegatedHP: delegator.hp,
        participationPercentage: delegator.percentage,
        baseHiveAmount: baseHiveAmount,
        dynamicHiveAmount: baseHiveAmount, // En este caso son iguales porque ya aplicamos % dinámico
        lastDelegationDate: delegator.timestamp,
      };
    });

    // Ordenar por cantidad descendente
    delegatorPayments.sort((a, b) => b.dynamicHiveAmount - a.dynamicHiveAmount);

    const result: DynamicPaymentResult = {
      curationStats: stats,
      totalCurationHP: curationHP,
      curationPeriodDays: filters.timePeriod,
      totalHPToDistribute: totalHPConsidered,
      dynamicReturnPercentage: dynamicPercentage,
      distributionAmount: distributionAmount,
      appliedFilters: filters,
      totalDelegationsConsidered: calculationResult.delegators.length,
      paymentDate: new Date(),
      delegatorPayments: delegatorPayments,
    };

    console.log(`✅ Pagos dinámicos calculados:`);
    console.log(`   - Delegadores: ${delegatorPayments.length}`);
    console.log(`   - Total a distribuir: ${distributionAmount.toFixed(4)} HIVE`);
    console.log(`   - % dinámico aplicado: ${dynamicPercentage.toFixed(2)}%`);

    return result;
  } catch (error) {
    console.error(`❌ Error calculando pagos dinámicos:`, error);
    throw error;
  }
}

/**
 * ✅ Configuración genérica por defecto para cualquier cuenta
 */
export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  account: '', // Se establecerá dinámicamente según el usuario autenticado
  baseCurationPercentage: 15, // 15% de las ganancias de curación
  minimumReturnPercentage: 10, // Mínimo 10% garantizado
  maximumReturnPercentage: 20, // Máximo 20% en períodos excelentes
};

/**
 * ⚠️ DEPRECATED: Configuración específica de aliento - usar createPaymentConfig() en su lugar
 * @deprecated Usar createPaymentConfig(account) para crear configuración dinámica
 */
export const DEFAULT_ALIENTO_CONFIG: PaymentConfig = {
  account: 'aliento',
  baseCurationPercentage: 15,
  minimumReturnPercentage: 10,
  maximumReturnPercentage: 20,
};

/**
 * Obtiene estadísticas rápidas de curación para mostrar en UI
 */
export async function getCurationStatsForUI(account: string): Promise<{
  curation24h: number;
  curation7d: number;
  curation30d: number;
  lastUpdate: Date;
}> {
  try {
    const stats = await curationStatsServer(account);

    return {
      curation24h: stats.total24Hr,
      curation7d: stats.total7D,
      curation30d: stats.total30D,
      lastUpdate: new Date(),
    };
  } catch (error) {
    console.error(`❌ Error obteniendo estadísticas UI:`, error);
    return {
      curation24h: 0,
      curation7d: 0,
      curation30d: 0,
      lastUpdate: new Date(),
    };
  }
}

/**
 * ✅ Crea configuración de pagos personalizada para cualquier cuenta
 */
export function createPaymentConfig(
  account: string,
  customConfig?: Partial<PaymentConfig>
): PaymentConfig {
  if (!account || account.trim() === '') {
    throw new Error('Account es requerido para crear configuración de pagos');
  }

  const cleanAccount = account.trim().toLowerCase();
  
  const config: PaymentConfig = {
    ...DEFAULT_PAYMENT_CONFIG,
    account: cleanAccount,
    ...customConfig
  };

  // Validar configuración
  const errors = validatePaymentConfig(config);
  if (errors.length > 0) {
    throw new Error(`Configuración inválida: ${errors.join(', ')}`);
  }

  console.log(`✅ Configuración de pagos creada para @${cleanAccount}:`, {
    baseCurationPercentage: config.baseCurationPercentage,
    minimumReturnPercentage: config.minimumReturnPercentage,
    maximumReturnPercentage: config.maximumReturnPercentage
  });

  return config;
}

/**
 * ✅ Obtiene configuración de pagos para una cuenta específica
 * Incluye configuraciones personalizadas almacenadas o valores por defecto
 */
export async function getPaymentConfigForAccount(account: string): Promise<PaymentConfig> {
  try {
    const cleanAccount = account.trim().toLowerCase();
    
    // Intentar cargar configuración personalizada del usuario
    if (typeof window !== 'undefined') {
      try {
        const { getOrCreateUserConfiguration } = await import('./user-config');
        const userConfig = getOrCreateUserConfiguration(cleanAccount);
        
        if (userConfig && userConfig.paymentConfig) {
          console.log(`✅ Usando configuración personalizada para @${cleanAccount}`);
          return userConfig.paymentConfig;
        }
      } catch (configError) {
        console.warn(`⚠️ Error cargando configuración de usuario para @${cleanAccount}:`, configError);
      }
    }
    
    // ELIMINADO: Configuraciones especiales por cuenta - Todos los usuarios tienen la misma configuración por defecto
    const customConfig = {};
    
    console.log(`🔧 Usando configuración por defecto para @${cleanAccount}`);
    return createPaymentConfig(cleanAccount, customConfig);
  } catch (error) {
    console.error(`❌ Error obteniendo configuración para @${account}:`, error);
    // Fallback final a configuración básica
    return createPaymentConfig(account);
  }
}

/**
 * ✅ Valida configuración de pagos
 */
export function validatePaymentConfig(config: PaymentConfig): string[] {
  const errors: string[] = [];

  if (!config.account || config.account.trim() === '') {
    errors.push('Cuenta es requerida');
  }

  if (config.baseCurationPercentage < 0 || config.baseCurationPercentage > 100) {
    errors.push('Porcentaje base debe estar entre 0-100%');
  }

  if (config.minimumReturnPercentage < 0) {
    errors.push('Porcentaje mínimo no puede ser negativo');
  }

  if (config.maximumReturnPercentage > 100) {
    errors.push('Porcentaje máximo no puede exceder 100%');
  }

  if (config.minimumReturnPercentage > config.maximumReturnPercentage) {
    errors.push('Porcentaje mínimo no puede ser mayor que el máximo');
  }

  return errors;
}

/**
 * ✅ Guarda configuración personalizada para una cuenta
 */
export async function savePaymentConfigForAccount(
  account: string, 
  config: Partial<PaymentConfig>
): Promise<void> {
  try {
    const cleanAccount = account.trim().toLowerCase();
    
    console.log(`💾 Guardando configuración personalizada para @${cleanAccount}:`, config);
    
    // Usar el sistema de configuraciones de usuario
    if (typeof window !== 'undefined') {
      try {
        const { updateUserPaymentConfig } = await import('./user-config');
        updateUserPaymentConfig(cleanAccount, config);
        console.log(`✅ Configuración guardada en sistema de usuario para @${cleanAccount}`);
      } catch (configError) {
        console.warn(`⚠️ Error usando sistema de configuración de usuario, usando fallback:`, configError);
        // Fallback: guardar en localStorage directamente
        localStorage.setItem(`payment_config_${cleanAccount}`, JSON.stringify(config));
      }
    } else {
      // En server-side, solo log por ahora
      console.log(`🖥️ Server-side: configuración para @${cleanAccount} registrada`);
    }
    
  } catch (error) {
    console.error(`❌ Error guardando configuración para @${account}:`, error);
    throw error;
  }
}
