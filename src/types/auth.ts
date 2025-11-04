/**
 * 🔐 AUTHENTICATION TYPES
 * 
 * Tipos TypeScript para el sistema de autenticación
 */

// Extender el namespace de Astro para incluir información de autenticación
declare global {
  namespace App {
    interface Locals {
      user: string | null;
      isAuthenticated: boolean;
    }
  }
}

/**
 * Información de sesión del usuario
 */
export interface UserSession {
  username: string;
  loginTime: Date;
  expiresAt: Date;
  signature?: string;
}

/**
 * Resultado de validación de autenticación
 */
export interface AuthValidationResult {
  isValid: boolean;
  user?: string;
  error?: string;
  expiresAt?: Date;
}

/**
 * Configuración de autenticación
 */
export interface AuthConfig {
  sessionDuration: number; // en milisegundos
  cookieName: string;
  requireHTTPS: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}

/**
 * Request de login
 */
export interface LoginRequest {
  username: string;
  signature?: string;
  challenge?: string;
}

/**
 * Response de login
 */
export interface LoginResponse {
  success: boolean;
  user?: string;
  token?: string;
  expiresAt?: string;
  error?: string;
}

/**
 * Contexto de autenticación para middleware
 */
export interface AuthContext {
  user: string | null;
  isAuthenticated: boolean;
  session?: UserSession;
}

export {}; // Esto hace que el archivo sea un módulo