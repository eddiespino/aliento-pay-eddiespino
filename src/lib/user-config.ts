/**
 * 🔧 GESTIÓN DE CONFIGURACIONES DE USUARIO
 * 
 * Sistema para manejar configuraciones personalizadas por usuario
 * incluyendo configuraciones de pagos, preferencias, etc.
 */

import type { PaymentConfig } from './payment-calculator';

/**
 * Configuración completa del usuario
 */
export interface UserConfiguration {
  username: string;
  paymentConfig: PaymentConfig;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Preferencias del usuario
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'es';
  currency: 'HIVE' | 'HBD' | 'USD';
  notifications: {
    email: boolean;
    browser: boolean;
    paymentReminders: boolean;
  };
  defaultFilters: {
    timePeriod: number;
    minimumHP: number;
    curationPeriod: '24h' | '7d' | '30d';
  };
}

/**
 * Configuraciones por defecto
 */
const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'auto',
  language: 'es',
  currency: 'HIVE',
  notifications: {
    email: false,
    browser: true,
    paymentReminders: true,
  },
  defaultFilters: {
    timePeriod: 30,
    minimumHP: 50,
    curationPeriod: '30d',
  },
};

/**
 * Clave base para localStorage
 */
const USER_CONFIG_KEY_PREFIX = 'user_config_';

/**
 * Obtiene la configuración completa de un usuario
 */
export function getUserConfiguration(username: string): UserConfiguration | null {
  try {
    const cleanUsername = username.trim().toLowerCase();
    const configKey = `${USER_CONFIG_KEY_PREFIX}${cleanUsername}`;
    
    const storedConfig = localStorage.getItem(configKey);
    if (!storedConfig) {
      return null;
    }

    const parsed = JSON.parse(storedConfig);
    
    // Convertir fechas de strings a Date objects
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
    };
  } catch (error) {
    console.error(`❌ Error obteniendo configuración para @${username}:`, error);
    return null;
  }
}

/**
 * Crea configuración inicial para un nuevo usuario
 */
export function createInitialUserConfiguration(username: string): UserConfiguration {
  const cleanUsername = username.trim().toLowerCase();
  const now = new Date();
  
  return {
    username: cleanUsername,
    paymentConfig: {
      account: cleanUsername,
      baseCurationPercentage: 15,
      minimumReturnPercentage: 10,
      maximumReturnPercentage: 20,
    },
    preferences: { ...DEFAULT_USER_PREFERENCES },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Guarda la configuración de un usuario
 */
export function saveUserConfiguration(config: UserConfiguration): void {
  try {
    const configKey = `${USER_CONFIG_KEY_PREFIX}${config.username}`;
    const configToSave = {
      ...config,
      updatedAt: new Date(),
    };
    
    localStorage.setItem(configKey, JSON.stringify(configToSave));
    console.log(`✅ Configuración guardada para @${config.username}`);
  } catch (error) {
    console.error(`❌ Error guardando configuración para @${config.username}:`, error);
    throw error;
  }
}

/**
 * Obtiene o crea la configuración de un usuario
 */
export function getOrCreateUserConfiguration(username: string): UserConfiguration {
  let config = getUserConfiguration(username);
  
  if (!config) {
    console.log(`🆕 Creando configuración inicial para @${username}`);
    config = createInitialUserConfiguration(username);
    saveUserConfiguration(config);
  }
  
  return config;
}

/**
 * Actualiza solo la configuración de pagos de un usuario
 */
export function updateUserPaymentConfig(
  username: string, 
  paymentConfig: Partial<PaymentConfig>
): UserConfiguration {
  const config = getOrCreateUserConfiguration(username);
  
  config.paymentConfig = {
    ...config.paymentConfig,
    ...paymentConfig,
    account: username.trim().toLowerCase(), // Asegurar que siempre coincida
  };
  
  saveUserConfiguration(config);
  console.log(`✅ Configuración de pagos actualizada para @${username}`);
  
  return config;
}

/**
 * Actualiza solo las preferencias de un usuario
 */
export function updateUserPreferences(
  username: string, 
  preferences: Partial<UserPreferences>
): UserConfiguration {
  const config = getOrCreateUserConfiguration(username);
  
  config.preferences = {
    ...config.preferences,
    ...preferences,
  };
  
  saveUserConfiguration(config);
  console.log(`✅ Preferencias actualizadas para @${username}`);
  
  return config;
}

/**
 * Elimina la configuración de un usuario
 */
export function deleteUserConfiguration(username: string): void {
  try {
    const cleanUsername = username.trim().toLowerCase();
    const configKey = `${USER_CONFIG_KEY_PREFIX}${cleanUsername}`;
    
    localStorage.removeItem(configKey);
    console.log(`🗑️ Configuración eliminada para @${cleanUsername}`);
  } catch (error) {
    console.error(`❌ Error eliminando configuración para @${username}:`, error);
    throw error;
  }
}

/**
 * Lista todas las configuraciones de usuarios almacenadas
 */
export function listAllUserConfigurations(): string[] {
  try {
    const usernames: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(USER_CONFIG_KEY_PREFIX)) {
        const username = key.replace(USER_CONFIG_KEY_PREFIX, '');
        usernames.push(username);
      }
    }
    
    return usernames.sort();
  } catch (error) {
    console.error('❌ Error listando configuraciones de usuarios:', error);
    return [];
  }
}

/**
 * Limpia configuraciones antiguas (más de 30 días sin usar)
 */
export function cleanupOldConfigurations(): number {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;
    
    const usernames = listAllUserConfigurations();
    
    for (const username of usernames) {
      const config = getUserConfiguration(username);
      if (config && config.updatedAt < thirtyDaysAgo) {
        deleteUserConfiguration(username);
        cleanedCount++;
      }
    }
    
    console.log(`🧹 Limpiadas ${cleanedCount} configuraciones antiguas`);
    return cleanedCount;
  } catch (error) {
    console.error('❌ Error limpiando configuraciones:', error);
    return 0;
  }
}

/**
 * Exporta configuración de usuario (para backup)
 */
export function exportUserConfiguration(username: string): string | null {
  const config = getUserConfiguration(username);
  if (!config) {
    return null;
  }
  
  return JSON.stringify(config, null, 2);
}

/**
 * Importa configuración de usuario (desde backup)
 */
export function importUserConfiguration(configJson: string): boolean {
  try {
    const config = JSON.parse(configJson) as UserConfiguration;
    
    // Validar estructura básica
    if (!config.username || !config.paymentConfig || !config.preferences) {
      throw new Error('Estructura de configuración inválida');
    }
    
    saveUserConfiguration(config);
    console.log(`✅ Configuración importada para @${config.username}`);
    return true;
  } catch (error) {
    console.error('❌ Error importando configuración:', error);
    return false;
  }
}