import type { AuthenticationPort } from '../../domain/ports/HiveRepository';

/**
 * ✅ Adaptador de autenticación: Implementación genérica con Hive Keychain
 */
export class HiveKeychainAuth implements AuthenticationPort {
  private readonly storageKey = 'authenticated_user'; // ✅ Clave genérica

  /**
   * Verifica si Hive Keychain está disponible
   */
  isKeychainAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).hive_keychain;
  }

  /**
   * Firma un mensaje con Hive Keychain
   */
  async signMessage(username: string, message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isKeychainAvailable()) {
        reject(new Error('Hive Keychain no está instalado'));
        return;
      }

      const keychain = (window as any).hive_keychain;

      keychain.requestSignBuffer(username, message, 'Posting', (response: any) => {
        if (response.success) {
          resolve(response.result);
        } else {
          reject(new Error(response.message || 'Error en la firma'));
        }
      });
    });
  }

  /**
   * Obtiene el usuario autenticado actual
   */
  getCurrentUser(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.storageKey);
  }

  /**
   * Guarda la sesión del usuario
   */
  saveSession(username: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, username);
    }
  }

  /**
   * Cierra la sesión
   */
  clearSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }
}
