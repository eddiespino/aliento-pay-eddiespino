/**
 * 🔄 LEGACY AUTHENTICATION ADAPTER
 *
 * Compatibility adapter that maintains the existing API
 * while delegating to the new authentication module.
 *
 * This allows existing code to continue working without changes
 * while gradually migrating to the new architecture.
 */

import { getContainer } from '../../shared/kernel/Container';
import { AUTH_TOKENS } from '../config/AuthModule';
import type { AuthController } from '../adapters/primary/AuthController';

// Import existing types for compatibility
import type { ValidUsername as LegacyValidUsername } from '../../domain/entities/HiveAccount';

/**
 * Legacy authentication service interface
 * Matches the existing AuthenticationUseCase API
 */
export class LegacyAuthenticationService {
  private authController: AuthController | null = null;

  private async getAuthController(): Promise<AuthController> {
    if (!this.authController) {
      const container = getContainer();
      this.authController = await container.resolve(AUTH_TOKENS.AuthController);
    }
    return this.authController;
  }

  /**
   * Legacy login method - matches existing API
   */
  async login(username: string): Promise<void> {
    const controller = await this.getAuthController();
    const result = await controller.login({ username });

    if (!result.success) {
      throw new Error(result.error || 'Authentication failed');
    }

    // Store session token in a way that existing code can access it
    if (typeof window !== 'undefined' && result.sessionToken) {
      sessionStorage.setItem('aliento_session_token', result.sessionToken);
      sessionStorage.setItem('aliento_username', result.username || '');
    }
  }

  /**
   * Legacy logout method - matches existing API
   */
  async logout(): Promise<void> {
    const controller = await this.getAuthController();

    let sessionToken: string | null = null;
    if (typeof window !== 'undefined') {
      sessionToken = sessionStorage.getItem('aliento_session_token');
    }

    const result = await controller.logout({ sessionToken: sessionToken || undefined });

    if (!result.success) {
      throw new Error(result.error || 'Logout failed');
    }

    // Clear stored session
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('aliento_session_token');
      sessionStorage.removeItem('aliento_username');
    }
  }

  /**
   * Legacy method to check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    const sessionToken = sessionStorage.getItem('aliento_session_token');
    if (!sessionToken) {
      return false;
    }

    const controller = await this.getAuthController();
    return await controller.isAuthenticated(sessionToken);
  }

  /**
   * Legacy method to get current user
   */
  async getCurrentUser(): Promise<string | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    const sessionToken = sessionStorage.getItem('aliento_session_token');
    if (!sessionToken) {
      return null;
    }

    const controller = await this.getAuthController();
    return await controller.getCurrentUser(sessionToken);
  }

  /**
   * Legacy method to validate session
   */
  async validateSession(): Promise<{ valid: boolean; username?: string }> {
    if (typeof window === 'undefined') {
      return { valid: false };
    }

    const sessionToken = sessionStorage.getItem('aliento_session_token');
    if (!sessionToken) {
      return { valid: false };
    }

    const controller = await this.getAuthController();
    const result = await controller.validateSession(sessionToken);

    return {
      valid: result.valid,
      username: result.username,
    };
  }
}

/**
 * Singleton instance for legacy compatibility
 */
let legacyAuthService: LegacyAuthenticationService | null = null;

export function getLegacyAuthService(): LegacyAuthenticationService {
  if (!legacyAuthService) {
    legacyAuthService = new LegacyAuthenticationService();
  }
  return legacyAuthService;
}

/**
 * Legacy helper functions for existing code compatibility
 */
export class LegacyAuthHelpers {
  /**
   * Convert new ValidUsername to legacy format
   */
  static toLegacyUsername(
    username: import('../domain/value-objects/ValidUsername').ValidUsername
  ): LegacyValidUsername {
    // In the legacy system, ValidUsername was just a branded string
    return username.getValue() as LegacyValidUsername;
  }

  /**
   * Convert legacy username to new format
   */
  static fromLegacyUsername(
    username: LegacyValidUsername
  ): import('../domain/value-objects/ValidUsername').ValidUsername {
    const { ValidUsername } = require('../domain/value-objects/ValidUsername');
    return ValidUsername.create(username);
  }

  /**
   * Check if Keychain is available (legacy method)
   */
  static isKeychainAvailable(): boolean {
    return typeof window !== 'undefined' && window.hive_keychain !== undefined;
  }
}

/**
 * Feature flag to control which authentication system to use
 */
export const USE_NEW_AUTH = process.env.FEATURE_NEW_AUTH === 'true' || false;

/**
 * Router function that decides which auth system to use
 */
export async function getAuthService() {
  if (USE_NEW_AUTH) {
    return getLegacyAuthService(); // Uses new system under the hood
  } else {
    // Import and return original authentication service
    const { AuthenticationUseCase } = await import(
      '../../application/use-cases/AuthenticationUseCase'
    );
    // Return existing service (would need to be instantiated properly)
    return null; // Placeholder - would return actual legacy service
  }
}
