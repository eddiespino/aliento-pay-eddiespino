import { fetchDelegationOperationsOptimized, vestsToHP, curationStats, getTotalCurationRewards } from './get-delegations_F_I3zebc.mjs';
import './SessionManager_D_9xdLr4.mjs';

function isValidFilterObject(obj) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  const requiredProps = ["timePeriod", "minimumHP", "excludedUsers", "applied"];
  for (const prop of requiredProps) {
    if (!(prop in obj)) {
      return false;
    }
  }
  if (typeof obj.timePeriod !== "number" || obj.timePeriod < 1 || obj.timePeriod > 365) {
    return false;
  }
  if (typeof obj.minimumHP !== "number" || obj.minimumHP < 0) {
    return false;
  }
  if (!Array.isArray(obj.excludedUsers)) {
    return false;
  }
  if (typeof obj.applied !== "boolean") {
    return false;
  }
  if (obj.curationPeriod && !["24h", "7d", "30d"].includes(obj.curationPeriod)) {
    return false;
  }
  if (obj.curationValue && typeof obj.curationValue !== "number") {
    return false;
  }
  return true;
}
function normalizeFilters(rawFilters) {
  const defaultFilters = {
    timePeriod: 30,
    minimumHP: 50,
    excludedUsers: [],
    applied: true,
    curationPeriod: "30d",
    curationValue: 0
  };
  if (!rawFilters || typeof rawFilters !== "object") {
    return defaultFilters;
  }
  return {
    timePeriod: typeof rawFilters.timePeriod === "number" && rawFilters.timePeriod > 0 ? Math.min(rawFilters.timePeriod, 365) : defaultFilters.timePeriod,
    minimumHP: typeof rawFilters.minimumHP === "number" && rawFilters.minimumHP >= 0 ? rawFilters.minimumHP : defaultFilters.minimumHP,
    excludedUsers: Array.isArray(rawFilters.excludedUsers) ? rawFilters.excludedUsers.filter(
      (user) => typeof user === "string" && user.trim() !== ""
    ) : defaultFilters.excludedUsers,
    applied: typeof rawFilters.applied === "boolean" ? rawFilters.applied : defaultFilters.applied,
    curationPeriod: typeof rawFilters.curationPeriod === "string" && ["24h", "7d", "30d"].includes(rawFilters.curationPeriod) ? rawFilters.curationPeriod : defaultFilters.curationPeriod,
    curationValue: typeof rawFilters.curationValue === "number" && rawFilters.curationValue >= 0 ? rawFilters.curationValue : defaultFilters.curationValue
  };
}
function decodeFiltersFromUrl(encodedFilters) {
  try {
    const decoded = decodeURIComponent(encodedFilters);
    const parsed = JSON.parse(decoded);
    if (!isValidFilterObject(parsed)) {
      console.warn("⚠️ Filtros inválidos, usando normalización");
      return normalizeFilters(parsed);
    }
    return parsed;
  } catch (error) {
    console.error("❌ Error decodificando filtros:", error);
    throw new Error("Error al decodificar filtros desde URL");
  }
}

function getLatestDelegationsByDelegator(operations) {
  const latest = {};
  for (const op of operations) {
    const delegator = op.op.value.delegator;
    const vesting_shares = op.op.value.vesting_shares.amount;
    const block_num = op.block;
    const timestamp = op.timestamp;
    if (!latest[delegator] || block_num > latest[delegator].block_num) {
      latest[delegator] = {
        vesting_shares,
        block_num,
        timestamp
      };
    }
  }
  Object.keys(latest).forEach((delegator) => {
    if (Number(latest[delegator].vesting_shares) === 0) {
      delete latest[delegator];
    }
  });
  return latest;
}
function calculateCutoffDate(timePeriod) {
  const cutoffDate = /* @__PURE__ */ new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timePeriod);
  return cutoffDate.toISOString().split("T")[0];
}
function decodeFilters(filtersParam) {
  try {
    return decodeFiltersFromUrl(filtersParam);
  } catch (error) {
    console.error("❌ Error decodificando filtros:", error);
    console.error("❌ Parámetro recibido:", filtersParam);
    return {
      timePeriod: 30,
      minimumHP: 50,
      excludedUsers: [],
      applied: true,
      curationPeriod: "30d",
      curationValue: 0
    };
  }
}
async function calculateCurationDistribution(account, filters, hiveToDistribute, interestPercentage) {
  try {
    console.log(`🔍 Calculando distribución para ${account} con filtros:`, filters);
    console.log(`🚫 Usuarios a excluir: [${filters.excludedUsers.join(", ")}]`);
    const cutoffDate = calculateCutoffDate(filters.timePeriod);
    console.log(`📅 Fecha de corte: ${cutoffDate}`);
    const operations = await fetchDelegationOperationsOptimized(account, cutoffDate);
    console.log(`📦 Operaciones obtenidas: ${operations.length}`);
    const latestDelegations = getLatestDelegationsByDelegator(operations);
    console.log(`👥 Delegadores únicos: ${Object.keys(latestDelegations).length}`);
    const delegators = [];
    let totalHP = 0;
    for (const [delegator, delegationData] of Object.entries(latestDelegations)) {
      if (delegator === account) {
        console.log(`⚠️ ${delegator} excluido por ser el mismo que account`);
        continue;
      }
      const hp = await vestsToHP(delegationData.vesting_shares);
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
      delegators.push({
        delegator,
        hp,
        percentage: 0,
        // Se calculará después
        hiveToReceive: 0,
        // Se calculará después
        blockNum: delegationData.block_num,
        timestamp: delegationData.timestamp
      });
      totalHP += hp;
    }
    const totalHiveToDistribute = filters.curationValue ? filters.curationValue * ((100 - interestPercentage) / 100) : hiveToDistribute * ((100 - interestPercentage) / 100);
    for (const delegator of delegators) {
      delegator.percentage = delegator.hp / totalHP * 100;
      delegator.hiveToReceive = delegator.hp / totalHP * totalHiveToDistribute;
    }
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
      processedOperations: operations.length
    };
  } catch (error) {
    console.error("❌ Error calculando distribución:", error);
    throw error;
  }
}
function formatHP(value, decimals = 2) {
  return value.toFixed(decimals);
}
function formatPercentage(value, decimals = 2) {
  return `${value.toFixed(decimals)}%`;
}
function formatHive(value, decimals = 3) {
  return value.toFixed(decimals);
}

async function calculateDynamicReturnPercentage(account, filters, config) {
  console.log(`🔍 Calculando % dinámico para ${account} con filtros:`, filters);
  const stats = await curationStats(account);
  const now = /* @__PURE__ */ new Date();
  const fromDate = new Date(now.getTime() - filters.timePeriod * 24 * 60 * 60 * 1e3);
  let curationForPeriod;
  if (filters.timePeriod <= 1) {
    curationForPeriod = stats.total24Hr;
    console.log(`📊 Usando curación 24hr: ${curationForPeriod.toFixed(4)} HP`);
  } else if (filters.timePeriod <= 7) {
    curationForPeriod = stats.total7D;
    console.log(`📊 Usando curación 7d: ${curationForPeriod.toFixed(4)} HP`);
  } else if (filters.timePeriod <= 30) {
    curationForPeriod = stats.total30D;
    console.log(`📊 Usando curación 30d: ${curationForPeriod.toFixed(4)} HP`);
  } else {
    curationForPeriod = await getTotalCurationRewards(account, fromDate, now);
    console.log(
      `📊 Curación calculada para ${filters.timePeriod}d: ${curationForPeriod.toFixed(4)} HP`
    );
  }
  const curationPercentageOfTotal = curationForPeriod > 0 ? config.baseCurationPercentage / 100 : 0;
  let dynamicPercentage = config.baseCurationPercentage * curationPercentageOfTotal;
  dynamicPercentage = Math.max(dynamicPercentage, config.minimumReturnPercentage);
  dynamicPercentage = Math.min(dynamicPercentage, config.maximumReturnPercentage);
  console.log(`📈 % dinámico calculado: ${dynamicPercentage.toFixed(2)}%`);
  console.log(`📈 Curación del período: ${curationForPeriod.toFixed(4)} HP`);
  return {
    percentage: dynamicPercentage,
    curationHP: curationForPeriod,
    stats
  };
}
async function calculateDynamicPayments(calculationResult, filters, config) {
  console.log(`💰 Iniciando cálculo de pagos dinámicos...`);
  try {
    const {
      percentage: dynamicPercentage,
      curationHP,
      stats
    } = await calculateDynamicReturnPercentage(config.account, filters, config);
    const totalHPConsidered = calculationResult.totalHP;
    const distributionAmount = totalHPConsidered * dynamicPercentage / 100;
    console.log(`💵 Total HP considerado: ${totalHPConsidered.toFixed(2)}`);
    console.log(`💵 % de retorno dinámico: ${dynamicPercentage.toFixed(2)}%`);
    console.log(`💵 Cantidad a distribuir: ${distributionAmount.toFixed(4)} HIVE`);
    const delegatorPayments = calculationResult.delegators.map((delegator) => {
      const baseHiveAmount = delegator.hp / totalHPConsidered * distributionAmount;
      return {
        delegator: delegator.delegator,
        delegatedHP: delegator.hp,
        participationPercentage: delegator.percentage,
        baseHiveAmount,
        dynamicHiveAmount: baseHiveAmount,
        // En este caso son iguales porque ya aplicamos % dinámico
        lastDelegationDate: delegator.timestamp
      };
    });
    delegatorPayments.sort((a, b) => b.dynamicHiveAmount - a.dynamicHiveAmount);
    const result = {
      curationStats: stats,
      totalCurationHP: curationHP,
      curationPeriodDays: filters.timePeriod,
      totalHPToDistribute: totalHPConsidered,
      dynamicReturnPercentage: dynamicPercentage,
      distributionAmount,
      appliedFilters: filters,
      totalDelegationsConsidered: calculationResult.delegators.length,
      paymentDate: /* @__PURE__ */ new Date(),
      delegatorPayments
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
const DEFAULT_PAYMENT_CONFIG = {
  account: "",
  // Se establecerá dinámicamente según el usuario autenticado
  baseCurationPercentage: 15,
  // 15% de las ganancias de curación
  minimumReturnPercentage: 10,
  // Mínimo 10% garantizado
  maximumReturnPercentage: 20
  // Máximo 20% en períodos excelentes
};
async function getCurationStatsForUI(account) {
  try {
    const stats = await curationStats(account);
    return {
      curation24h: stats.total24Hr,
      curation7d: stats.total7D,
      curation30d: stats.total30D,
      lastUpdate: /* @__PURE__ */ new Date()
    };
  } catch (error) {
    console.error(`❌ Error obteniendo estadísticas UI:`, error);
    return {
      curation24h: 0,
      curation7d: 0,
      curation30d: 0,
      lastUpdate: /* @__PURE__ */ new Date()
    };
  }
}
function createPaymentConfig(account, customConfig) {
  if (!account || account.trim() === "") {
    throw new Error("Account es requerido para crear configuración de pagos");
  }
  const cleanAccount = account.trim().toLowerCase();
  const config = {
    ...DEFAULT_PAYMENT_CONFIG,
    account: cleanAccount,
    ...customConfig
  };
  const errors = validatePaymentConfig(config);
  if (errors.length > 0) {
    throw new Error(`Configuración inválida: ${errors.join(", ")}`);
  }
  console.log(`✅ Configuración de pagos creada para @${cleanAccount}:`, {
    baseCurationPercentage: config.baseCurationPercentage,
    minimumReturnPercentage: config.minimumReturnPercentage,
    maximumReturnPercentage: config.maximumReturnPercentage
  });
  return config;
}
async function getPaymentConfigForAccount(account) {
  try {
    const cleanAccount = account.trim().toLowerCase();
    if (typeof window !== "undefined") {
      try {
        const { getOrCreateUserConfiguration } = await import('./user-config_DsvLltHs.mjs');
        const userConfig = getOrCreateUserConfiguration(cleanAccount);
        if (userConfig && userConfig.paymentConfig) {
          console.log(`✅ Usando configuración personalizada para @${cleanAccount}`);
          return userConfig.paymentConfig;
        }
      } catch (configError) {
        console.warn(`⚠️ Error cargando configuración de usuario para @${cleanAccount}:`, configError);
      }
    }
    const customConfig = {};
    console.log(`🔧 Usando configuración por defecto para @${cleanAccount}`);
    return createPaymentConfig(cleanAccount, customConfig);
  } catch (error) {
    console.error(`❌ Error obteniendo configuración para @${account}:`, error);
    return createPaymentConfig(account);
  }
}
function validatePaymentConfig(config) {
  const errors = [];
  if (!config.account || config.account.trim() === "") {
    errors.push("Cuenta es requerida");
  }
  if (config.baseCurationPercentage < 0 || config.baseCurationPercentage > 100) {
    errors.push("Porcentaje base debe estar entre 0-100%");
  }
  if (config.minimumReturnPercentage < 0) {
    errors.push("Porcentaje mínimo no puede ser negativo");
  }
  if (config.maximumReturnPercentage > 100) {
    errors.push("Porcentaje máximo no puede exceder 100%");
  }
  if (config.minimumReturnPercentage > config.maximumReturnPercentage) {
    errors.push("Porcentaje mínimo no puede ser mayor que el máximo");
  }
  return errors;
}

export { getPaymentConfigForAccount as a, calculateDynamicPayments as b, calculateCurationDistribution as c, formatHive as d, formatPercentage as e, formatHP as f, getCurationStatsForUI as g, decodeFilters as h };
