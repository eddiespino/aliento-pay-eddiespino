/**
 * 👁️ VIGILANTE DE SESIÓN DE USUARIO
 * 
 * Detecta cambios en la sesión de usuario y ejecuta acciones apropiadas,
 * como limpiar caché cuando el usuario cambia.
 */

import { userCache } from './user-cache';
import { authEvents } from './hooks';

/**
 * Estado de la sesión de usuario
 */
interface UserSessionState {
  currentUser: string | null;
  isWatching: boolean;
  lastCheck: number;
}

/**
 * ✅ Clase principal para vigilar cambios de sesión
 */
export class UserSessionWatcher {
  private state: UserSessionState = {
    currentUser: null,
    isWatching: false,
    lastCheck: 0
  };

  private checkInterval: number | null = null;
  private readonly CHECK_INTERVAL_MS = 1000; // Verificar cada segundo
  private readonly STORAGE_KEY = 'authenticated_user';

  /**
   * Obtener usuario actual de localStorage
   */
  private getCurrentUser(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Detectar cambio de usuario
   */
  private detectUserChange(): { hasChanged: boolean; previousUser: string | null; currentUser: string | null } {
    const currentUser = this.getCurrentUser();
    const previousUser = this.state.currentUser;
    const hasChanged = currentUser !== previousUser;

    return { hasChanged, previousUser, currentUser };
  }

  /**
   * Manejar cambio de usuario
   */
  private async handleUserChange(previousUser: string | null, currentUser: string | null): Promise<void> {
    console.log(`🔄 UserSessionWatcher: Cambio de usuario detectado`, {
      from: previousUser || 'ninguno',
      to: currentUser || 'ninguno'
    });

    // Si había un usuario anterior, limpiar su caché
    if (previousUser) {
      console.log(`🧹 Limpiando caché del usuario anterior: ${previousUser}`);
      userCache.clearCacheForUser(previousUser);
      
      // Emitir evento de logout del usuario anterior
      authEvents.emitLogout();
    }

    // Si hay un nuevo usuario, emitir evento de login
    if (currentUser) {
      console.log(`👋 Nuevo usuario logueado: ${currentUser}`);
      authEvents.emitLogin(currentUser);
      
      // Migrar datos legacy si es necesario
      try {
        const { migrateLegacyCache } = await import('./user-cache');
        migrateLegacyCache();
      } catch (error) {
        console.warn('⚠️ Error migrando caché legacy:', error);
      }
    }

    // Actualizar estado interno
    this.state.currentUser = currentUser;
    this.state.lastCheck = Date.now();

    // Dispatch evento personalizado para otros componentes
    this.dispatchUserChangeEvent(previousUser, currentUser);
  }

  /**
   * Dispatch evento personalizado de cambio de usuario
   */
  private dispatchUserChangeEvent(previousUser: string | null, currentUser: string | null): void {
    if (typeof window === 'undefined') return;

    const event = new CustomEvent('user-session-change', {
      detail: {
        previousUser,
        currentUser,
        timestamp: Date.now()
      }
    });

    window.dispatchEvent(event);
  }

  /**
   * Función de verificación periódica
   */
  private performCheck = (): void => {
    try {
      const { hasChanged, previousUser, currentUser } = this.detectUserChange();

      if (hasChanged) {
        this.handleUserChange(previousUser, currentUser);
      }

      this.state.lastCheck = Date.now();

    } catch (error) {
      console.error('❌ UserSessionWatcher: Error en verificación:', error);
    }
  };

  /**
   * ✅ Iniciar vigilancia de sesión
   */
  startWatching(): void {
    if (this.state.isWatching) {
      console.warn('⚠️ UserSessionWatcher: Ya está vigilando');
      return;
    }

    if (typeof window === 'undefined') {
      console.warn('⚠️ UserSessionWatcher: No disponible en server-side');
      return;
    }

    // Establecer usuario inicial
    this.state.currentUser = this.getCurrentUser();
    this.state.isWatching = true;
    this.state.lastCheck = Date.now();

    // Configurar verificación periódica
    this.checkInterval = window.setInterval(this.performCheck, this.CHECK_INTERVAL_MS);

    // Escuchar eventos de storage para cambios desde otras tabs
    window.addEventListener('storage', this.handleStorageEvent);

    // Escuchar eventos de visibilidad para verificar al volver a la tab
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    console.log('👁️ UserSessionWatcher: Iniciado', {
      currentUser: this.state.currentUser,
      checkInterval: this.CHECK_INTERVAL_MS
    });
  }

  /**
   * ✅ Detener vigilancia de sesión
   */
  stopWatching(): void {
    if (!this.state.isWatching) {
      return;
    }

    // Limpiar interval
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Remover event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    this.state.isWatching = false;
    console.log('👁️ UserSessionWatcher: Detenido');
  }

  /**
   * Manejar eventos de storage (cambios desde otras tabs)
   */
  private handleStorageEvent = (event: StorageEvent): void => {
    if (event.key === this.STORAGE_KEY) {
      console.log('👁️ UserSessionWatcher: Cambio detectado desde otra tab');
      // Hacer verificación inmediata
      setTimeout(this.performCheck, 100);
    }
  };

  /**
   * Manejar cambios de visibilidad (cuando se regresa a la tab)
   */
  private handleVisibilityChange = (): void => {
    if (!document.hidden) {
      console.log('👁️ UserSessionWatcher: Tab visible de nuevo, verificando sesión');
      // Hacer verificación inmediata al volver a la tab
      setTimeout(this.performCheck, 100);
    }
  };

  /**
   * ✅ Forzar verificación manual
   */
  forceCheck(): void {
    this.performCheck();
  }

  /**
   * ✅ Obtener estado actual
   */
  getState(): UserSessionState {
    return { ...this.state };
  }

  /**
   * ✅ Verificar si está vigilando
   */
  isWatching(): boolean {
    return this.state.isWatching;
  }
}

/**
 * ✅ Instancia singleton del vigilante de sesión
 */
export const userSessionWatcher = new UserSessionWatcher();

/**
 * ✅ Función de inicialización automática
 */
export function initializeUserSessionWatcher(): void {
  if (typeof window === 'undefined') return;

  // Iniciar vigilancia automáticamente
  userSessionWatcher.startWatching();

  // Limpiar al cerrar la página
  window.addEventListener('beforeunload', () => {
    userSessionWatcher.stopWatching();
  });

  console.log('✅ UserSessionWatcher: Inicializado automáticamente');
}

/**
 * ✅ Hook para escuchar cambios de usuario
 */
export function onUserSessionChange(
  callback: (previousUser: string | null, currentUser: string | null) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: CustomEvent) => {
    const { previousUser, currentUser } = event.detail;
    callback(previousUser, currentUser);
  };

  window.addEventListener('user-session-change', handler as EventListener);

  // Retornar función para remover listener
  return () => {
    window.removeEventListener('user-session-change', handler as EventListener);
  };
}

/**
 * ✅ Utilidad para limpiar caché manualmente al cambiar usuario
 */
export function handleUserLogout(username?: string): void {
  const targetUser = username || userSessionWatcher.getState().currentUser;
  
  if (targetUser) {
    console.log(`🧹 Limpieza manual de caché para usuario: ${targetUser}`);
    userCache.clearCacheForUser(targetUser);
  }

  // Limpiar también datos generales
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('authenticated_user');
      console.log('🧹 Session token removido');
    } catch (error) {
      console.warn('⚠️ Error removiendo session token:', error);
    }
  }
}

/**
 * ✅ Utilidad para limpiar todo al hacer login con nuevo usuario
 */
export function handleUserLogin(username: string): void {
  console.log(`👋 Configurando sesión para nuevo usuario: ${username}`);
  
  // Limpiar cualquier caché residual de otros usuarios
  userCache.cleanupExpiredCache();
  
  // Establecer nuevo usuario
  if (typeof window !== 'undefined') {
    localStorage.setItem('authenticated_user', username);
  }
  
  // Forzar verificación para que detecte el nuevo usuario
  userSessionWatcher.forceCheck();
}

/**
 * ✅ Debug: Información del estado de vigilancia
 */
export function getWatcherDebugInfo(): {
  watcher: UserSessionState;
  cache: any;
  events: string[];
} {
  const watcherState = userSessionWatcher.getState();
  const cacheInfo = userCache.getCacheInfo();
  
  const events: string[] = [];
  if (typeof window !== 'undefined') {
    // Información sobre listeners registrados
    events.push('storage event listener: active');
    events.push('visibility change listener: active');
    events.push('beforeunload listener: active');
  }

  return {
    watcher: watcherState,
    cache: cacheInfo,
    events
  };
}