const DEFAULT_USER_PREFERENCES = {
  theme: "auto",
  language: "es",
  currency: "HIVE",
  notifications: {
    email: false,
    browser: true,
    paymentReminders: true
  },
  defaultFilters: {
    timePeriod: 30,
    minimumHP: 50,
    curationPeriod: "30d"
  }
};
const USER_CONFIG_KEY_PREFIX = "user_config_";
function getUserConfiguration(username) {
  try {
    const cleanUsername = username.trim().toLowerCase();
    const configKey = `${USER_CONFIG_KEY_PREFIX}${cleanUsername}`;
    const storedConfig = localStorage.getItem(configKey);
    if (!storedConfig) {
      return null;
    }
    const parsed = JSON.parse(storedConfig);
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt)
    };
  } catch (error) {
    console.error(`❌ Error obteniendo configuración para @${username}:`, error);
    return null;
  }
}
function createInitialUserConfiguration(username) {
  const cleanUsername = username.trim().toLowerCase();
  const now = /* @__PURE__ */ new Date();
  return {
    username: cleanUsername,
    paymentConfig: {
      account: cleanUsername,
      baseCurationPercentage: 15,
      minimumReturnPercentage: 10,
      maximumReturnPercentage: 20
    },
    preferences: { ...DEFAULT_USER_PREFERENCES },
    createdAt: now,
    updatedAt: now
  };
}
function saveUserConfiguration(config) {
  try {
    const configKey = `${USER_CONFIG_KEY_PREFIX}${config.username}`;
    const configToSave = {
      ...config,
      updatedAt: /* @__PURE__ */ new Date()
    };
    localStorage.setItem(configKey, JSON.stringify(configToSave));
    console.log(`✅ Configuración guardada para @${config.username}`);
  } catch (error) {
    console.error(`❌ Error guardando configuración para @${config.username}:`, error);
    throw error;
  }
}
function getOrCreateUserConfiguration(username) {
  let config = getUserConfiguration(username);
  if (!config) {
    console.log(`🆕 Creando configuración inicial para @${username}`);
    config = createInitialUserConfiguration(username);
    saveUserConfiguration(config);
  }
  return config;
}

export { createInitialUserConfiguration, getOrCreateUserConfiguration, getUserConfiguration, saveUserConfiguration };
