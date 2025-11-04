/**
 * 🍪 SESSION MANAGER
 * 
 * Gestiona sesiones de usuario con cookies seguras
 * Compatible con SSR de Astro
 */

import type { APIContext } from 'astro';
import type { UserSession, AuthValidationResult, AuthConfig } from '../../types/auth';

export class SessionManager {
  private static readonly DEFAULT_CONFIG: AuthConfig = {
    sessionDuration: 24 * 60 * 60 * 1000, // 24 horas
    cookieName: 'user_session',
    requireHTTPS: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  private config: AuthConfig;

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = { ...SessionManager.DEFAULT_CONFIG, ...config };
  }

  /**
   * Crea una nueva sesión para el usuario
   */
  createSession(username: string, signature?: string): UserSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.sessionDuration);

    return {
      username,
      loginTime: now,
      expiresAt,
      signature
    };
  }

  /**
   * Genera un token de sesión seguro
   */
  generateSessionToken(session: UserSession): string {
    // Formato: username:timestamp:expires:signature_hash
    const timestamp = session.loginTime.getTime();
    const expires = session.expiresAt.getTime();
    const signatureHash = session.signature ? this.hashSignature(session.signature) : 'none';
    
    return `${session.username}:${timestamp}:${expires}:${signatureHash}`;
  }

  /**
   * Parsea un token de sesión
   */
  parseSessionToken(token: string): UserSession | null {
    try {
      const [username, timestampStr, expiresStr, signatureHash] = token.split(':');
      
      if (!username || !timestampStr || !expiresStr) {
        return null;
      }

      const loginTime = new Date(parseInt(timestampStr));
      const expiresAt = new Date(parseInt(expiresStr));

      // Verificar que la sesión no haya expirado
      if (expiresAt.getTime() < Date.now()) {
        return null;
      }

      return {
        username,
        loginTime,
        expiresAt,
        signature: signatureHash !== 'none' ? signatureHash : undefined
      };
    } catch (error) {
      console.error('Error parsing session token:', error);
      return null;
    }
  }

  /**
   * Valida una sesión
   */
  validateSession(token: string): AuthValidationResult {
    const session = this.parseSessionToken(token);
    
    if (!session) {
      return {
        isValid: false,
        error: 'Token de sesión inválido o expirado'
      };
    }

    // Verificar expiración
    if (session.expiresAt.getTime() < Date.now()) {
      return {
        isValid: false,
        error: 'Sesión expirada'
      };
    }

    return {
      isValid: true,
      user: session.username,
      expiresAt: session.expiresAt
    };
  }

  /**
   * Guarda la sesión en cookies (server-side)
   */
  saveSessionToContext(context: APIContext, session: UserSession): void {
    const token = this.generateSessionToken(session);
    
    context.cookies.set(this.config.cookieName, token, {
      httpOnly: true,
      secure: this.config.requireHTTPS,
      sameSite: this.config.sameSite,
      expires: session.expiresAt,
      path: '/',
      // Prevenir acceso desde JavaScript para mayor seguridad
      maxAge: Math.floor(this.config.sessionDuration / 1000)
    });

    console.log(`✅ Sesión guardada para usuario: ${session.username}`);
  }

  /**
   * Obtiene la sesión desde cookies (server-side)
   */
  getSessionFromContext(context: APIContext): UserSession | null {
    const token = context.cookies.get(this.config.cookieName)?.value;
    
    if (!token) {
      return null;
    }

    return this.parseSessionToken(token);
  }

  /**
   * Elimina la sesión (logout)
   */
  clearSessionFromContext(context: APIContext): void {
    context.cookies.delete(this.config.cookieName, {
      path: '/'
    });

    console.log('🔓 Sesión eliminada');
  }

  /**
   * Renueva una sesión existente
   */
  renewSession(session: UserSession): UserSession {
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + this.config.sessionDuration);

    return {
      ...session,
      expiresAt: newExpiresAt
    };
  }

  /**
   * Verifica si una sesión está próxima a expirar (última hora)
   */
  isSessionNearExpiry(session: UserSession): boolean {
    const oneHour = 60 * 60 * 1000;
    const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
    return timeUntilExpiry < oneHour;
  }

  /**
   * Hash simple para la firma (en producción usar crypto más robusto)
   */
  private hashSignature(signature: string): string {
    // En producción, usar una función hash criptográfica real
    let hash = 0;
    for (let i = 0; i < signature.length; i++) {
      const char = signature.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Obtiene configuración actual
   */
  getConfig(): AuthConfig {
    return { ...this.config };
  }
}

// Instancia singleton para uso global
export const sessionManager = new SessionManager();