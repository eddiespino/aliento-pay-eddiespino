/**
 * 🎮 AUTHENTICATION CONTROLLER
 *
 * Primary adapter for authentication UI.
 * Handles HTTP requests and delegates to use cases.
 */

import type { LoginUseCase } from '../../application/LoginUseCase';
import type { LogoutUseCase } from '../../application/LogoutUseCase';
import type { ValidateSessionUseCase } from '../../application/ValidateSessionUseCase';

export interface AuthControllerDependencies {
  loginUseCase: LoginUseCase;
  logoutUseCase: LogoutUseCase;
  validateSessionUseCase: ValidateSessionUseCase;
}

export class AuthController {
  constructor(private readonly deps: AuthControllerDependencies) {}

  /**
   * Handle login request from UI
   */
  async login(request: { username: string; sessionDurationHours?: number }): Promise<{
    success: boolean;
    sessionToken?: string;
    username?: string;
    expiresAt?: Date;
    error?: string;
  }> {
    try {
      const result = await this.deps.loginUseCase.execute({
        username: request.username,
        sessionDurationHours: request.sessionDurationHours,
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Handle logout request from UI
   */
  async logout(request: {
    sessionToken?: string;
    username?: string;
    logoutAll?: boolean;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const result = await this.deps.logoutUseCase.execute({
        sessionToken: request.sessionToken,
        username: request.username,
        logoutAll: request.logoutAll,
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  /**
   * Validate current session
   */
  async validateSession(sessionToken: string): Promise<{
    valid: boolean;
    username?: string;
    expiresAt?: Date;
    error?: string;
  }> {
    try {
      const result = await this.deps.validateSessionUseCase.execute({
        sessionToken,
      });

      return result;
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(sessionToken: string): Promise<string | null> {
    try {
      return await this.deps.validateSessionUseCase.getCurrentUser(sessionToken);
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(sessionToken?: string): Promise<boolean> {
    if (!sessionToken) {
      return false;
    }

    try {
      return await this.deps.validateSessionUseCase.isValidSession(sessionToken);
    } catch (error) {
      console.error('Failed to check authentication:', error);
      return false;
    }
  }

  /**
   * Middleware helper for protected routes
   */
  async requireAuth(sessionToken?: string): Promise<{
    authenticated: boolean;
    username?: string;
    error?: string;
  }> {
    if (!sessionToken) {
      return {
        authenticated: false,
        error: 'No session token provided',
      };
    }

    const validation = await this.validateSession(sessionToken);

    if (!validation.valid) {
      return {
        authenticated: false,
        error: validation.error || 'Invalid session',
      };
    }

    return {
      authenticated: true,
      username: validation.username,
    };
  }
}
