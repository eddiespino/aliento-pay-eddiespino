/**
 * 🪝 HOOKS DE AUTENTICACIÓN
 * 
 * Utilidades tipo React hooks para manejar autenticación de forma reactiva
 * y consistente en toda la aplicación.
 */

import { 
  requireAuthentication, 
  getCurrentAuthenticatedUser,
  isUserAuthenticated,
  type AuthValidationResult 
} from './guards';

/**
 * Estado de autenticación
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * ✅ Hook principal de autenticación
 * Proporciona estado reactivo de autenticación
 */
export class AuthHook {
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null
  };

  private listeners: Array<(state: AuthState) => void> = [];
  private initialized = false;

  constructor() {
    this.initializeAuth();
  }

  /**
   * Inicializa el estado de autenticación
   */
  private initializeAuth(): void {
    if (typeof window === 'undefined') {
      this.state.isLoading = false;
      this.initialized = true;
      return;
    }

    try {
      const validation = requireAuthentication({ 
        allowUnauthenticated: true,
        showError: false 
      });

      this.state = {
        isAuthenticated: validation.isAuthenticated,
        user: validation.user,
        isLoading: false,
        error: validation.error || null
      };

      this.initialized = true;
      this.notifyListeners();

      // Configurar listener para cambios en localStorage
      this.setupStorageListener();

    } catch (error) {
      console.error('❌ Error inicializando AuthHook:', error);
      this.state = {
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Error inicializando autenticación'
      };
      this.initialized = true;
      this.notifyListeners();
    }
  }

  /**
   * Configura listener para cambios en localStorage
   */
  private setupStorageListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', (event) => {
      if (event.key === 'authenticated_user') {
        this.refreshAuthState();
      }
    });

    // También escuchar eventos personalizados para cambios de sesión
    window.addEventListener('auth:login', () => {
      this.refreshAuthState();
    });

    window.addEventListener('auth:logout', () => {
      this.refreshAuthState();
    });
  }

  /**
   * Refresca el estado de autenticación
   */
  private refreshAuthState(): void {
    const validation = requireAuthentication({ 
      allowUnauthenticated: true,
      showError: false 
    });

    const newState: AuthState = {
      isAuthenticated: validation.isAuthenticated,
      user: validation.user,
      isLoading: false,
      error: validation.error || null
    };

    // Solo notificar si el estado cambió
    if (this.hasStateChanged(newState)) {
      this.state = newState;
      this.notifyListeners();
    }
  }

  /**
   * Verifica si el estado cambió
   */
  private hasStateChanged(newState: AuthState): boolean {
    return (
      this.state.isAuthenticated !== newState.isAuthenticated ||
      this.state.user !== newState.user ||
      this.state.error !== newState.error
    );
  }

  /**
   * Notifica a todos los listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('❌ Error en listener de AuthHook:', error);
      }
    });
  }

  /**
   * Suscribirse a cambios de autenticación
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);

    // Si ya está inicializado, llamar inmediatamente
    if (this.initialized) {
      listener(this.state);
    }

    // Retornar función para desuscribirse
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Obtener estado actual
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Forzar actualización del estado
   */
  refresh(): void {
    this.refreshAuthState();
  }

  /**
   * Simular login (dispara eventos)
   */
  notifyLogin(user: string): void {
    if (typeof window !== 'undefined') {
      // Actualizar localStorage
      localStorage.setItem('authenticated_user', user);
      
      // Disparar evento personalizado
      window.dispatchEvent(new CustomEvent('auth:login', { 
        detail: { user } 
      }));
    }

    this.refreshAuthState();
  }

  /**
   * Simular logout (dispara eventos)
   */
  notifyLogout(): void {
    if (typeof window !== 'undefined') {
      // Limpiar localStorage
      localStorage.removeItem('authenticated_user');
      
      // Disparar evento personalizado
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    this.refreshAuthState();
  }
}

/**
 * ✅ Instancia singleton del hook de autenticación
 */
export const authHook = new AuthHook();

/**
 * ✅ Hook simple para obtener usuario autenticado
 */
export function useAuthenticatedUser(): {
  user: string | null;
  isAuthenticated: boolean;
  error: string | null;
} {
  const state = authHook.getState();
  
  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    error: state.error
  };
}

/**
 * ✅ Hook para requerir autenticación con redirección automática
 */
export function useRequireAuth(redirectTo: string = '/'): {
  user: string | null;
  isLoading: boolean;
} {
  const state = authHook.getState();

  if (!state.isLoading && !state.isAuthenticated && typeof window !== 'undefined') {
    console.log('🔄 Usuario no autenticado, redirigiendo...');
    window.location.href = redirectTo;
  }

  return {
    user: state.user,
    isLoading: state.isLoading
  };
}

/**
 * ✅ Hook para operaciones que requieren autenticación
 */
export function useAuthenticatedOperation<T>(
  operation: (user: string) => Promise<T> | T,
  options: {
    onError?: (error: string) => void;
    onUnauthenticated?: () => void;
    redirectTo?: string;
  } = {}
): {
  execute: () => Promise<T | null>;
  canExecute: boolean;
  user: string | null;
} {
  const state = authHook.getState();

  const execute = async (): Promise<T | null> => {
    if (!state.isAuthenticated || !state.user) {
      const error = 'Usuario no autenticado';
      
      if (options.onError) {
        options.onError(error);
      }
      
      if (options.onUnauthenticated) {
        options.onUnauthenticated();
      } else if (options.redirectTo && typeof window !== 'undefined') {
        window.location.href = options.redirectTo;
      }
      
      return null;
    }

    try {
      return await operation(state.user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error en operación autenticada:', errorMessage);
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      throw error;
    }
  };

  return {
    execute,
    canExecute: state.isAuthenticated && !!state.user,
    user: state.user
  };
}

/**
 * ✅ Hook para verificar permisos de acceso a datos
 */
export function useDataAccess(targetAccount?: string): {
  canAccess: boolean;
  user: string | null;
  error: string | null;
} {
  const state = authHook.getState();

  if (!state.isAuthenticated || !state.user) {
    return {
      canAccess: false,
      user: null,
      error: 'Usuario no autenticado'
    };
  }

  // Si no hay cuenta objetivo, puede acceder a sus propios datos
  if (!targetAccount || targetAccount === state.user) {
    return {
      canAccess: true,
      user: state.user,
      error: null
    };
  }

  // Por ahora, solo puedes acceder a tus propios datos
  return {
    canAccess: false,
    user: state.user,
    error: `Sin permisos para acceder a datos de @${targetAccount}`
  };
}

/**
 * ✅ Utility para esperar autenticación
 */
export function waitForAuth(timeout: number = 5000): Promise<AuthState> {
  return new Promise((resolve, reject) => {
    const state = authHook.getState();
    
    // Si ya no está cargando, resolver inmediatamente
    if (!state.isLoading) {
      resolve(state);
      return;
    }

    // Configurar timeout
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout esperando autenticación'));
    }, timeout);

    // Suscribirse a cambios
    const unsubscribe = authHook.subscribe((newState) => {
      if (!newState.isLoading) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(newState);
      }
    });
  });
}

/**
 * ✅ Hook para manejar login/logout
 */
export function useAuthActions(): {
  login: (user: string) => void;
  logout: () => void;
  refresh: () => void;
} {
  return {
    login: (user: string) => authHook.notifyLogin(user),
    logout: () => authHook.notifyLogout(),
    refresh: () => authHook.refresh()
  };
}

/**
 * ✅ Utility para crear componentes que requieren autenticación
 */
export function createAuthenticatedComponent<P extends Record<string, any>>(
  component: (props: P & { user: string }) => any,
  options: {
    redirectTo?: string;
    loadingComponent?: () => any;
    unauthenticatedComponent?: () => any;
  } = {}
) {
  return (props: P) => {
    const state = authHook.getState();

    if (state.isLoading) {
      return options.loadingComponent ? options.loadingComponent() : null;
    }

    if (!state.isAuthenticated || !state.user) {
      if (options.unauthenticatedComponent) {
        return options.unauthenticatedComponent();
      }

      if (options.redirectTo && typeof window !== 'undefined') {
        window.location.href = options.redirectTo;
      }

      return null;
    }

    return component({ ...props, user: state.user });
  };
}

/**
 * ✅ Event emitters para autenticación
 */
export const authEvents = {
  /**
   * Emitir evento de login
   */
  emitLogin: (user: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:login', { 
        detail: { user } 
      }));
    }
  },

  /**
   * Emitir evento de logout
   */
  emitLogout: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  },

  /**
   * Escuchar eventos de autenticación
   */
  onLogin: (callback: (user: string) => void) => {
    if (typeof window !== 'undefined') {
      const handler = (event: CustomEvent) => {
        callback(event.detail.user);
      };
      window.addEventListener('auth:login', handler as EventListener);
      
      // Retornar función para remover listener
      return () => {
        window.removeEventListener('auth:login', handler as EventListener);
      };
    }
    return () => {};
  },

  /**
   * Escuchar eventos de logout
   */
  onLogout: (callback: () => void) => {
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', callback);
      
      // Retornar función para remover listener
      return () => {
        window.removeEventListener('auth:logout', callback);
      };
    }
    return () => {};
  }
};