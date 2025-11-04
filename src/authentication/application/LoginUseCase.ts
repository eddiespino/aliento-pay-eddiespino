/**
 * 🔑 LOGIN USE CASE
 *
 * Handles user authentication and session creation.
 * Orchestrates domain entities and external services.
 */

import { ValidUsername } from '../domain/value-objects/ValidUsername';
import { UserSession } from '../domain/entities/UserSession';
import type { AuthenticationGateway } from '../domain/ports/AuthenticationGateway';
import type { SessionRepository } from '../domain/ports/SessionRepository';

export interface LoginRequest {
  readonly username: string;
  readonly sessionDurationHours?: number;
}

export interface LoginResponse {
  readonly success: boolean;
  readonly sessionToken?: string;
  readonly username?: string;
  readonly expiresAt?: Date;
  readonly error?: string;
  readonly errorCode?: string;
}

export class LoginUseCase {
  constructor(
    private readonly authGateway: AuthenticationGateway,
    private readonly sessionRepository: SessionRepository
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    try {
      // 1. Validate and normalize username
      const username = ValidUsername.create(request.username);

      // 2. Check if authentication service is available
      if (!(await this.authGateway.isAvailable())) {
        return {
          success: false,
          error: 'Authentication service is not available',
          errorCode: 'SERVICE_UNAVAILABLE',
        };
      }

      // 3. Create authentication challenge
      const challenge = await this.authGateway.createChallenge(username);

      // 4. Request signature from user (this would trigger Keychain popup)
      // In a real implementation, this would be handled by the UI layer
      // For now, we'll simulate the signature process
      const authResult = await this.performAuthentication(username, challenge);

      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error || 'Authentication failed',
          errorCode: 'AUTHENTICATION_FAILED',
        };
      }

      // 5. Create user session
      const sessionDuration = request.sessionDurationHours || 24;
      const session = UserSession.create(username, sessionDuration);

      // 6. Save session
      await this.sessionRepository.save(session);

      // 7. Return success response
      return {
        success: true,
        sessionToken: session.getToken().getValue(),
        username: username.getValue(),
        expiresAt: session.getExpiresAt(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * In a real implementation, this would delegate to the UI layer
   * to show Keychain popup and get user signature
   */
  private async performAuthentication(
    username: ValidUsername,
    challenge: any
  ): Promise<{ success: boolean; error?: string }> {
    // This is a placeholder - real implementation would:
    // 1. Show Keychain popup with challenge message
    // 2. Get signature from user
    // 3. Verify signature with authGateway.verifySignature()

    // For now, simulate successful authentication
    return { success: true };
  }
}
