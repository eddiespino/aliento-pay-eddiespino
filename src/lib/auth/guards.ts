/**
 * 🔒 GUARDS DE AUTENTICACIÓN
 * 
 * Sistema de validaciones para verificar autenticación antes de acceder a datos críticos.
 * Proporciona guards tanto para client-side como server-side.
 */

import { SessionManager } from './SessionManager';

/**
 * Resultado de validación de autenticación
 */
export interface AuthValidationResult {
  isAuthenticated: boolean;
  user: string | null;
  error?: string;
  redirectTo?: string;
}

/**
 * Opciones para guards de autenticación
 */
export interface AuthGuardOptions {
  redirectTo?: string;
  allowUnauthenticated?: boolean;
  requireSpecificUser?: string;
  showError?: boolean;
}

/**
 * ✅ Guard principal de autenticación client-side
 */
export function requireAuthentication(options: AuthGuardOptions = {}): AuthValidationResult {
  const {
    redirectTo = '/',
    allowUnauthenticated = false,
    requireSpecificUser,
    showError = true
  } = options;

  try {
    // Verificar si estamos en el cliente
    if (typeof window === 'undefined') {
      return {
        isAuthenticated: false,
        user: null,
        error: 'Guard ejecutado en server-side, usar server guard'
      };
    }

    // Obtener usuario autenticado
    const currentUser = localStorage.getItem('authenticated_user');

    if (!currentUser) {
      if (allowUnauthenticated) {
        return { isAuthenticated: false, user: null };
      }

      return {
        isAuthenticated: false,
        user: null,
        error: 'Usuario no autenticado',
        redirectTo
      };
    }

    // Verificar usuario específico si se requiere
    if (requireSpecificUser && currentUser !== requireSpecificUser) {
      return {
        isAuthenticated: false,
        user: currentUser,
        error: `Acceso denegado. Se requiere usuario: ${requireSpecificUser}`,
        redirectTo
      };
    }

    // Validación exitosa
    return {
      isAuthenticated: true,
      user: currentUser
    };

  } catch (error) {
    console.error('❌ Error en guard de autenticación:', error);
    return {
      isAuthenticated: false,
      user: null,
      error: 'Error validando autenticación',
      redirectTo
    };
  }
}

/**
 * ✅ Guard de autenticación server-side para Astro
 */
export async function requireServerAuthentication(
  request: Request,
  options: AuthGuardOptions = {}
): Promise<AuthValidationResult> {
  const {
    redirectTo = '/',
    allowUnauthenticated = false,
    requireSpecificUser,
  } = options;

  try {
    const sessionManager = new SessionManager();

    // Intentar obtener usuario de cookies primero
    const cookieHeader = request.headers.get('cookie');
    let currentUser: string | null = null;

    if (cookieHeader) {
      try {
        const sessionData = sessionManager.validateSessionFromCookies(cookieHeader);
        currentUser = sessionData?.username || null;
      } catch (error) {
        console.warn('⚠️ Error validando sesión desde cookies:', error);
      }
    }

    // Fallback: intentar obtener de headers (para APIs)
    if (!currentUser) {
      currentUser = request.headers.get('x-authenticated-user');
    }

    if (!currentUser) {
      if (allowUnauthenticated) {
        return { isAuthenticated: false, user: null };
      }

      return {
        isAuthenticated: false,
        user: null,
        error: 'Usuario no autenticado en server',
        redirectTo
      };
    }

    // Verificar usuario específico si se requiere
    if (requireSpecificUser && currentUser !== requireSpecificUser) {
      return {
        isAuthenticated: false,
        user: currentUser,
        error: `Acceso denegado en server. Se requiere usuario: ${requireSpecificUser}`,
        redirectTo
      };
    }

    return {
      isAuthenticated: true,
      user: currentUser
    };

  } catch (error) {
    console.error('❌ Error en guard server de autenticación:', error);
    return {
      isAuthenticated: false,
      user: null,
      error: 'Error validando autenticación en server',
      redirectTo
    };
  }
}

/**
 * ✅ Guard para funciones que requieren autenticación
 * Wrapper que ejecuta una función solo si el usuario está autenticado
 */
export async function withAuthentication<T>(
  fn: (user: string) => Promise<T> | T,
  options: AuthGuardOptions = {}
): Promise<T | null> {
  const validation = requireAuthentication(options);

  if (!validation.isAuthenticated) {
    if (validation.error && options.showError !== false) {
      console.error('🔒 Acceso denegado:', validation.error);
    }

    if (validation.redirectTo && typeof window !== 'undefined') {
      console.log(`🔄 Redirigiendo a: ${validation.redirectTo}`);
      window.location.href = validation.redirectTo;
    }

    return null;
  }

  try {
    return await fn(validation.user!);
  } catch (error) {
    console.error('❌ Error ejecutando función autenticada:', error);
    throw error;
  }
}

/**
 * ✅ Guard específico para operaciones de datos
 */
export function requireAuthenticationForData(operation: string): AuthValidationResult {
  const validation = requireAuthentication({
    redirectTo: '/',
    showError: true
  });

  if (!validation.isAuthenticated) {
    console.error(`🔒 Operación "${operation}" requiere autenticación`);
  } else {
    console.log(`✅ Usuario ${validation.user} autorizado para: ${operation}`);
  }

  return validation;
}

/**
 * ✅ Guard para verificar si el usuario puede acceder a datos de una cuenta específica
 */
export function canAccessAccountData(targetAccount: string): AuthValidationResult {
  const validation = requireAuthentication();

  if (!validation.isAuthenticated) {
    return validation;
  }

  // Por ahora, solo permites acceso a tus propios datos
  // En el futuro se puede implementar lógica de permisos más compleja
  if (validation.user !== targetAccount) {
    return {
      isAuthenticated: false,
      user: validation.user,
      error: `No tienes permisos para acceder a datos de @${targetAccount}`,
      redirectTo: '/dashboard'
    };
  }

  return validation;
}

/**
 * ✅ Utility: Obtener usuario autenticado de forma segura
 */
export function getCurrentAuthenticatedUser(): string | null {
  const validation = requireAuthentication({ 
    allowUnauthenticated: true,
    showError: false 
  });
  
  return validation.user;
}

/**
 * ✅ Utility: Verificar si hay usuario autenticado sin errores
 */
export function isUserAuthenticated(): boolean {
  const validation = requireAuthentication({ 
    allowUnauthenticated: true,
    showError: false 
  });
  
  return validation.isAuthenticated;
}

/**
 * ✅ Guard para componentes Astro
 * Verifica autenticación y retorna datos necesarios para el componente
 */
export interface ComponentAuthGuard {
  isAuthenticated: boolean;
  user: string | null;
  shouldRedirect: boolean;
  redirectTo?: string;
  error?: string;
}

export function getComponentAuthState(request?: Request): ComponentAuthGuard {
  // En componentes Astro, por lo general no tenemos acceso directo a localStorage
  // Así que dependemos del middleware para establecer el estado
  
  if (request) {
    // Server-side: revisar headers establecidos por middleware
    const authenticatedUser = request.headers.get('x-authenticated-user');
    
    return {
      isAuthenticated: !!authenticatedUser,
      user: authenticatedUser,
      shouldRedirect: !authenticatedUser,
      redirectTo: '/'
    };
  }

  // Client-side fallback
  if (typeof window !== 'undefined') {
    const validation = requireAuthentication({ 
      allowUnauthenticated: true,
      showError: false 
    });
    
    return {
      isAuthenticated: validation.isAuthenticated,
      user: validation.user,
      shouldRedirect: !validation.isAuthenticated,
      redirectTo: validation.redirectTo,
      error: validation.error
    };
  }

  // Default: no autenticado
  return {
    isAuthenticated: false,
    user: null,
    shouldRedirect: true,
    redirectTo: '/'
  };
}

/**
 * ✅ Guard decorator para funciones async
 */
export function authenticated<T extends any[], R>(
  target: (...args: T) => Promise<R>,
  options: AuthGuardOptions = {}
) {
  return async (...args: T): Promise<R | null> => {
    return await withAuthentication(() => target(...args), options);
  };
}

/**
 * ✅ Validación de permisos específicos
 */
export interface PermissionValidation {
  hasPermission: boolean;
  user: string | null;
  error?: string;
}

export function validatePermission(
  permission: 'read' | 'write' | 'admin',
  targetAccount?: string
): PermissionValidation {
  const authValidation = requireAuthentication({ allowUnauthenticated: true, showError: false });

  if (!authValidation.isAuthenticated) {
    return {
      hasPermission: false,
      user: null,
      error: 'Usuario no autenticado'
    };
  }

  const user = authValidation.user!;

  // Lógica de permisos básica
  switch (permission) {
    case 'read':
      // Todos los usuarios autenticados pueden leer sus propios datos
      if (!targetAccount || targetAccount === user) {
        return { hasPermission: true, user };
      }
      return {
        hasPermission: false,
        user,
        error: `Sin permisos de lectura para @${targetAccount}`
      };

    case 'write':
      // Solo puedes escribir en tu propia cuenta
      if (!targetAccount || targetAccount === user) {
        return { hasPermission: true, user };
      }
      return {
        hasPermission: false,
        user,
        error: `Sin permisos de escritura para @${targetAccount}`
      };

    case 'admin':
      // ELIMINADO: No hay usuarios admin, todos los usuarios autenticados tienen los mismos derechos
      return {
        hasPermission: true,
        user
      };

    default:
      return {
        hasPermission: false,
        user,
        error: `Permiso desconocido: ${permission}`
      };
  }
}