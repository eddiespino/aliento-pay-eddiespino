/**
 * 🔒 FUNCIONES PROTEGIDAS
 * 
 * Wrappers de autenticación para las funciones críticas de la aplicación.
 * Asegura que solo usuarios autenticados puedan acceder a datos sensibles.
 */

import { withAuthentication, canAccessAccountData, requireAuthenticationForData } from './guards';
import type { CalculateFilters, CalculationResult } from '../calculate-curation';
import type { CurationStatsResult } from '../get-delegations';

/**
 * ✅ Wrapper protegido para cálculo de curación
 */
export async function protectedCalculateCuration(
  filters: CalculateFilters
): Promise<CalculationResult | null> {
  return withAuthentication(async (authenticatedUser) => {
    console.log(`🔒 Calculando curación para usuario autenticado: ${authenticatedUser}`);
    
    // Validar que el usuario puede acceder a los datos de la cuenta especificada
    const accountToCalculate = filters.account || authenticatedUser;
    const accessValidation = canAccessAccountData(accountToCalculate);
    
    if (!accessValidation.isAuthenticated) {
      throw new Error(accessValidation.error || 'Sin permisos para acceder a estos datos');
    }

    // Asegurar que siempre use la cuenta del usuario autenticado
    const protectedFilters: CalculateFilters = {
      ...filters,
      account: authenticatedUser
    };

    // Importar la función original de forma dinámica para evitar dependencias circulares
    const { calculateCuration } = await import('../calculate-curation');
    return await calculateCuration(protectedFilters);
  });
}

/**
 * ✅ Wrapper protegido para obtener estadísticas de curación
 */
export async function protectedGetCurationStats(
  account?: string
): Promise<CurationStatsResult | null> {
  return withAuthentication(async (authenticatedUser) => {
    const targetAccount = account || authenticatedUser;
    
    console.log(`🔒 Obteniendo estadísticas de curación para: ${targetAccount}`);
    
    // Validar acceso a los datos de la cuenta
    const accessValidation = canAccessAccountData(targetAccount);
    if (!accessValidation.isAuthenticated) {
      throw new Error(accessValidation.error || 'Sin permisos para acceder a estos datos');
    }

    // Importar función original
    const { curationStats } = await import('../get-delegations');
    return await curationStats(targetAccount);
  });
}

/**
 * ✅ Wrapper protegido para obtener delegaciones
 */
export async function protectedGetDelegations(
  account?: string,
  options: {
    minimumHP?: number;
    timePeriod?: number;
    excludeUsers?: string[];
  } = {}
): Promise<any | null> {
  return withAuthentication(async (authenticatedUser) => {
    const targetAccount = account || authenticatedUser;
    
    console.log(`🔒 Obteniendo delegaciones para: ${targetAccount}`);
    
    // Validar acceso
    const accessValidation = canAccessAccountData(targetAccount);
    if (!accessValidation.isAuthenticated) {
      throw new Error(accessValidation.error || 'Sin permisos para acceder a estos datos');
    }

    // Importar función original
    const { getDelegations } = await import('../get-delegations');
    return await getDelegations(targetAccount, options.minimumHP, options.timePeriod, options.excludeUsers);
  });
}

/**
 * ✅ Wrapper protegido para cálculos de pagos dinámicos
 */
export async function protectedCalculateDynamicPayments(
  calculationResult: CalculationResult,
  filters: CalculateFilters
): Promise<any | null> {
  return withAuthentication(async (authenticatedUser) => {
    console.log(`🔒 Calculando pagos dinámicos para: ${authenticatedUser}`);
    
    // Importar funciones necesarias
    const { calculateDynamicPayments, getPaymentConfigForAccount } = await import('../payment-calculator');
    
    // Obtener configuración para el usuario autenticado
    const paymentConfig = await getPaymentConfigForAccount(authenticatedUser);
    
    return await calculateDynamicPayments(calculationResult, filters, paymentConfig);
  });
}

/**
 * ✅ Wrapper protegido para obtener configuración de usuario
 */
export async function protectedGetUserConfiguration(
  username?: string
): Promise<any | null> {
  return withAuthentication(async (authenticatedUser) => {
    const targetUsername = username || authenticatedUser;
    
    console.log(`🔒 Obteniendo configuración para: ${targetUsername}`);
    
    // Solo puedes acceder a tu propia configuración
    if (targetUsername !== authenticatedUser) {
      throw new Error('Solo puedes acceder a tu propia configuración');
    }

    // Importar función original
    const { getOrCreateUserConfiguration } = await import('../user-config');
    return getOrCreateUserConfiguration(targetUsername);
  });
}

/**
 * ✅ Wrapper protegido para actualizar configuración de usuario
 */
export async function protectedUpdateUserConfiguration(
  updates: any,
  username?: string
): Promise<any | null> {
  return withAuthentication(async (authenticatedUser) => {
    const targetUsername = username || authenticatedUser;
    
    console.log(`🔒 Actualizando configuración para: ${targetUsername}`);
    
    // Solo puedes actualizar tu propia configuración
    if (targetUsername !== authenticatedUser) {
      throw new Error('Solo puedes actualizar tu propia configuración');
    }

    // Importar función original
    const { updateUserPaymentConfig } = await import('../user-config');
    return updateUserPaymentConfig(targetUsername, updates);
  });
}

/**
 * ✅ Wrapper protegido para operaciones de Keychain
 */
export async function protectedExecuteKeychainOperation<T>(
  operation: (username: string) => Promise<T>
): Promise<T | null> {
  return withAuthentication(async (authenticatedUser) => {
    console.log(`🔒 Ejecutando operación Keychain para: ${authenticatedUser}`);
    
    // Verificar que Keychain esté disponible
    if (typeof window === 'undefined' || !(window as any).hive_keychain) {
      throw new Error('Hive Keychain no está disponible');
    }

    return await operation(authenticatedUser);
  });
}

/**
 * ✅ Wrapper protegido para transferencias múltiples
 */
export async function protectedExecuteMultipleTransfers(
  payments: Array<{ to: string; amount: string; memo?: string }>
): Promise<any | null> {
  return withAuthentication(async (authenticatedUser) => {
    console.log(`🔒 Ejecutando transferencias múltiples desde: ${authenticatedUser}`);
    
    // Validar que todas las transferencias son desde el usuario autenticado
    const validationResult = requireAuthenticationForData('multiple_transfers');
    if (!validationResult.isAuthenticated) {
      throw new Error('Usuario no autenticado para transferencias');
    }

    // Importar servicio
    const { executeMultipleTransfers } = await import('../../services/multiple-transfers');
    
    return await executeMultipleTransfers({
      username: authenticatedUser,
      payments
    });
  });
}

/**
 * ✅ Utilidad para crear operaciones protegidas personalizadas
 */
export function createProtectedOperation<T extends any[], R>(
  operation: (authenticatedUser: string, ...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R | null> => {
    return withAuthentication(async (authenticatedUser) => {
      console.log(`🔒 Ejecutando operación protegida "${operationName}" para: ${authenticatedUser}`);
      return await operation(authenticatedUser, ...args);
    });
  };
}

/**
 * ✅ Validación de datos antes de operaciones críticas
 */
export function validateUserDataAccess(
  requestedAccount: string,
  operation: string
): { isValid: boolean; error?: string } {
  const validation = requireAuthenticationForData(operation);
  
  if (!validation.isAuthenticated) {
    return {
      isValid: false,
      error: 'Usuario no autenticado'
    };
  }

  // Solo permite acceso a datos de la cuenta autenticada
  if (requestedAccount !== validation.user) {
    return {
      isValid: false,
      error: `No tienes permisos para acceder a datos de @${requestedAccount}`
    };
  }

  return { isValid: true };
}

/**
 * ✅ Middleware para APIs que requieren autenticación
 */
export async function validateApiAuthentication(
  request: Request
): Promise<{ 
  isAuthenticated: boolean; 
  user: string | null; 
  error?: string 
}> {
  try {
    // Obtener usuario de headers (establecido por middleware)
    const authenticatedUser = request.headers.get('x-authenticated-user');
    
    console.log(`🔧 validateApiAuthentication: Header x-authenticated-user: ${authenticatedUser}`);
    console.log(`🔧 validateApiAuthentication: Todos los headers:`, Array.from(request.headers.entries()));
    
    if (!authenticatedUser) {
      return {
        isAuthenticated: false,
        user: null,
        error: 'Usuario no autenticado'
      };
    }

    return {
      isAuthenticated: true,
      user: authenticatedUser
    };

  } catch (error) {
    console.error('❌ Error validando autenticación en API:', error);
    return {
      isAuthenticated: false,
      user: null,
      error: 'Error interno de autenticación'
    };
  }
}

/**
 * ✅ ELIMINADO: Guard de administrador - Todos los usuarios tienen los mismos derechos
 * Ya no hay usuarios admin, cualquier usuario autenticado puede realizar operaciones
 */

/**
 * ✅ ELIMINADO: protectedAdminOperation - Ya no es necesario
 * Usar withAuthentication directamente para todas las operaciones
 */