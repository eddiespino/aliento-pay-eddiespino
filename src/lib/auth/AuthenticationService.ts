/**
 * 🔐 SERVICIO CENTRAL DE AUTENTICACIÓN
 * 
 * Servicio unificado que gestiona todo el estado de autenticación en la aplicación.
 * Combina SessionManager, guards, hooks y caché en una interfaz cohesiva.
 */

import { SessionManager } from './SessionManager';
import { userCache } from './user-cache';
import { userSessionWatcher, handleUserLogin, handleUserLogout } from './user-session-watcher';
import { authHook, authEvents } from './hooks';
import { 
  requireAuthentication, 
  getCurrentAuthenticatedUser, 
  isUserAuthenticated,
  type AuthValidationResult 
} from './guards';

/**
 * Estado completo de autenticación
 */
export interface AuthenticationState {
  isAuthenticated: boolean;
  user: string | null;
  isLoading: boolean;
  error: string | null;
  sessionInfo: {
    hasValidSession: boolean;
    sessionAge: number | null;
    needsRenewal: boolean;
  };
  cacheInfo: {
    hasUserCache: boolean;
    cacheAge: number | null;
    itemCount: number;
  };
}

/**
 * Opciones para el servicio de autenticación
 */
export interface AuthenticationOptions {
  autoStartWatcher?: boolean;
  enableCaching?: boolean;
  sessionDuration?: number;
  cacheCleanupInterval?: number;
}

/**
 * ✅ Servicio Central de Autenticación
 */
export class AuthenticationService {
  private sessionManager: SessionManager;
  private isInitialized = false;
  private options: Required<AuthenticationOptions>;

  constructor(options: AuthenticationOptions = {}) {
    this.sessionManager = new SessionManager();
    this.options = {
      autoStartWatcher: true,
      enableCaching: true,
      sessionDuration: 24 * 60 * 60 * 1000, // 24 horas
      cacheCleanupInterval: 60 * 60 * 1000, // 1 hora
      ...options
    };
  }

  /**
   * ✅ Inicializar el servicio de autenticación
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ AuthenticationService: Ya está inicializado');
      return;
    }

    try {
      console.log('🔐 AuthenticationService: Inicializando...');

      // Inicializar vigilante de sesión si está habilitado
      if (this.options.autoStartWatcher && typeof window !== 'undefined') {
        userSessionWatcher.startWatching();
      }

      // Configurar limpieza automática de caché si está habilitado
      if (this.options.enableCaching && typeof window !== 'undefined') {
        setInterval(() => {
          userCache.cleanupExpiredCache();
        }, this.options.cacheCleanupInterval);
      }

      this.isInitialized = true;
      console.log('✅ AuthenticationService: Inicializado correctamente');

    } catch (error) {
      console.error('❌ AuthenticationService: Error en inicialización:', error);
      throw error;
    }
  }

  /**
   * ✅ Obtener estado completo de autenticación
   */
  getAuthenticationState(): AuthenticationState {
    try {
      const hookState = authHook.getState();
      const currentUser = getCurrentAuthenticatedUser();

      // Información de sesión
      let sessionInfo = {
        hasValidSession: false,
        sessionAge: null as number | null,
        needsRenewal: false
      };

      if (currentUser && typeof window !== 'undefined') {
        try {
          const cookieHeader = document.cookie;
          const sessionData = this.sessionManager.validateSessionFromCookies(cookieHeader);
          if (sessionData) {
            sessionInfo = {
              hasValidSession: true,
              sessionAge: Date.now() - sessionData.createdAt,
              needsRenewal: sessionData.needsRenewal || false
            };
          }
        } catch (error) {
          console.warn('⚠️ Error obteniendo información de sesión:', error);
        }
      }

      // Información de caché
      const cacheInfo = userCache.getCacheInfo();

      return {
        isAuthenticated: hookState.isAuthenticated,
        user: hookState.user,
        isLoading: hookState.isLoading,
        error: hookState.error,
        sessionInfo,
        cacheInfo: {
          hasUserCache: cacheInfo.userItems > 0,
          cacheAge: userCache.getAge('dashboard_data'),
          itemCount: cacheInfo.userItems
        }
      };

    } catch (error) {
      console.error('❌ Error obteniendo estado de autenticación:', error);
      return {
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: 'Error obteniendo estado de autenticación',
        sessionInfo: {
          hasValidSession: false,
          sessionAge: null,
          needsRenewal: false
        },
        cacheInfo: {
          hasUserCache: false,
          cacheAge: null,
          itemCount: 0
        }
      };
    }
  }

  /**
   * ✅ Realizar login de usuario
   */
  async login(username: string, signature?: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔐 AuthenticationService: Iniciando login para ${username}`);

      // Validar username
      if (!username || username.trim() === '') {
        return { success: false, error: 'Username es requerido' };
      }

      const cleanUsername = username.trim().toLowerCase();

      // Crear sesión
      const token = this.sessionManager.createSession(cleanUsername, signature);

      // Establecer cookie de sesión
      if (typeof document !== 'undefined') {
        this.sessionManager.setSessionCookie(token);
      }

      // Usar el helper de login que maneja caché y eventos
      handleUserLogin(cleanUsername);

      console.log(`✅ AuthenticationService: Login exitoso para ${cleanUsername}`);
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en login';
      console.error('❌ AuthenticationService: Error en login:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * ✅ Realizar logout de usuario
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = getCurrentAuthenticatedUser();
      console.log(`🔐 AuthenticationService: Iniciando logout para ${currentUser}`);

      // Limpiar cookie de sesión
      if (typeof document !== 'undefined') {
        this.sessionManager.clearSessionCookie();
      }

      // Usar el helper de logout que maneja caché y eventos
      handleUserLogout(currentUser || undefined);

      console.log('✅ AuthenticationService: Logout exitoso');
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en logout';
      console.error('❌ AuthenticationService: Error en logout:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * ✅ Validar sesión actual
   */
  validateSession(): AuthValidationResult {
    return requireAuthentication({
      allowUnauthenticated: true,
      showError: false
    });
  }

  /**
   * ✅ Renovar sesión automáticamente
   */
  async renewSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = getCurrentAuthenticatedUser();
      if (!currentUser) {
        return { success: false, error: 'No hay usuario autenticado para renovar' };
      }

      console.log(`🔄 AuthenticationService: Renovando sesión para ${currentUser}`);

      // Crear nueva sesión
      const newToken = this.sessionManager.createSession(currentUser);

      // Actualizar cookie
      if (typeof document !== 'undefined') {
        this.sessionManager.setSessionCookie(newToken);
      }

      console.log(`✅ AuthenticationService: Sesión renovada para ${currentUser}`);
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error renovando sesión';
      console.error('❌ AuthenticationService: Error renovando sesión:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * ✅ Verificar si el usuario puede acceder a datos de una cuenta específica
   */
  canAccessAccountData(targetAccount: string): { canAccess: boolean; error?: string } {
    const currentUser = getCurrentAuthenticatedUser();
    
    if (!currentUser) {
      return { canAccess: false, error: 'Usuario no autenticado' };
    }

    // En nuestro sistema democrático, solo puedes acceder a tus propios datos
    if (currentUser !== targetAccount) {
      return { 
        canAccess: false, 
        error: `No tienes permisos para acceder a datos de @${targetAccount}` 
      };
    }

    return { canAccess: true };
  }

  /**
   * ✅ Limpiar todos los datos del usuario actual
   */
  async clearUserData(): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = getCurrentAuthenticatedUser();
      if (!currentUser) {
        return { success: false, error: 'No hay usuario autenticado' };
      }

      console.log(`🧹 AuthenticationService: Limpiando datos para ${currentUser}`);

      // Limpiar caché del usuario
      userCache.clearUserCache();

      // Limpiar configuraciones de usuario
      try {
        const { deleteUserConfiguration } = await import('./user-config');
        deleteUserConfiguration(currentUser);
      } catch (error) {
        console.warn('⚠️ Error limpiando configuración de usuario:', error);
      }

      console.log(`✅ AuthenticationService: Datos limpiados para ${currentUser}`);
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error limpiando datos';
      console.error('❌ AuthenticationService: Error limpiando datos:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * ✅ Suscribirse a cambios de autenticación
   */
  onAuthenticationChange(callback: (state: AuthenticationState) => void): () => void {
    return authHook.subscribe((hookState) => {
      const fullState = this.getAuthenticationState();
      callback(fullState);
    });
  }

  /**
   * ✅ Forzar actualización del estado
   */
  refresh(): void {
    authHook.refresh();
    if (userSessionWatcher.isWatching()) {
      userSessionWatcher.forceCheck();
    }
  }

  /**
   * ✅ Obtener información de debug
   */
  getDebugInfo(): {
    service: { initialized: boolean; options: AuthenticationOptions };
    authentication: AuthenticationState;
    watcher: any;
    cache: any;
  } {
    const { getWatcherDebugInfo } = require('./user-session-watcher');
    
    return {
      service: {
        initialized: this.isInitialized,
        options: this.options
      },
      authentication: this.getAuthenticationState(),
      watcher: getWatcherDebugInfo(),
      cache: userCache.getCacheInfo()
    };
  }

  /**
   * ✅ Destruir el servicio y limpiar recursos
   */
  destroy(): void {
    try {
      console.log('🔐 AuthenticationService: Destruyendo servicio...');

      // Detener vigilante de sesión
      if (userSessionWatcher.isWatching()) {
        userSessionWatcher.stopWatching();
      }

      this.isInitialized = false;
      console.log('✅ AuthenticationService: Servicio destruido');

    } catch (error) {
      console.error('❌ AuthenticationService: Error destruyendo servicio:', error);
    }
  }

  /**
   * ✅ Verificar si el servicio está inicializado
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * ✅ Obtener usuario actual (método de conveniencia)
   */
  getCurrentUser(): string | null {
    return getCurrentAuthenticatedUser();
  }

  /**
   * ✅ Verificar si hay usuario autenticado (método de conveniencia)
   */
  isAuthenticated(): boolean {
    return isUserAuthenticated();
  }
}

/**
 * ✅ Instancia singleton del servicio de autenticación
 */
export const authenticationService = new AuthenticationService();

/**
 * ✅ Función de inicialización automática para la aplicación
 */
export async function initializeAuthentication(options?: AuthenticationOptions): Promise<void> {
  if (typeof window === 'undefined') {
    console.log('🔐 AuthenticationService: Saltando inicialización en server-side');
    return;
  }

  try {
    // Configurar opciones si se proporcionan
    if (options) {
      Object.assign(authenticationService['options'], options);
    }

    await authenticationService.initialize();
    console.log('✅ Sistema de autenticación inicializado globalmente');

  } catch (error) {
    console.error('❌ Error inicializando sistema de autenticación:', error);
    throw error;
  }
}

/**
 * ✅ Hook de conveniencia para usar el servicio en componentes
 */
export function useAuthenticationService(): {
  service: AuthenticationService;
  state: AuthenticationState;
  login: (username: string, signature?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  refresh: () => void;
  canAccess: (account: string) => { canAccess: boolean; error?: string };
} {
  const state = authenticationService.getAuthenticationState();

  return {
    service: authenticationService,
    state,
    login: authenticationService.login.bind(authenticationService),
    logout: authenticationService.logout.bind(authenticationService),
    refresh: authenticationService.refresh.bind(authenticationService),
    canAccess: authenticationService.canAccessAccountData.bind(authenticationService)
  };
}

/**
 * ✅ Utility para operaciones que requieren autenticación
 */
export async function withAuthenticatedUser<T>(
  operation: (user: string) => Promise<T> | T
): Promise<T | null> {
  const validation = authenticationService.validateSession();
  
  if (!validation.isAuthenticated || !validation.user) {
    console.error('🔒 Operación requiere autenticación');
    return null;
  }

  try {
    return await operation(validation.user);
  } catch (error) {
    console.error('❌ Error en operación autenticada:', error);
    throw error;
  }
}