/**
 * ✅ VALIDATE SESSION USE CASE
 *
 * Validates user sessions and handles session lifecycle.
 */

import { SessionToken } from '../domain/value-objects/SessionToken';
import type { SessionRepository } from '../domain/ports/SessionRepository';

export interface ValidateSessionRequest {
  readonly sessionToken: string;
}

export interface ValidateSessionResponse {
  readonly valid: boolean;
  readonly username?: string;
  readonly expiresAt?: Date;
  readonly error?: string;
  readonly errorCode?: string;
}

export class ValidateSessionUseCase {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(request: ValidateSessionRequest): Promise<ValidateSessionResponse> {
    try {
      // 1. Create session token value object
      const sessionToken = SessionToken.create(request.sessionToken);

      // 2. Find session in repository
      const session = await this.sessionRepository.findByToken(sessionToken);

      if (!session) {
        return {
          valid: false,
          error: 'Session not found',
          errorCode: 'SESSION_NOT_FOUND',
        };
      }

      // 3. Validate session using domain logic
      try {
        session.validate();
      } catch (domainError) {
        // Session is invalid according to domain rules
        return {
          valid: false,
          error: domainError instanceof Error ? domainError.message : 'Session invalid',
          errorCode: 'SESSION_INVALID',
        };
      }

      // 4. Session is valid
      return {
        valid: true,
        username: session.getUsername().getValue(),
        expiresAt: session.getExpiresAt(),
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Get current user from session token
   */
  async getCurrentUser(sessionToken: string): Promise<string | null> {
    const result = await this.execute({ sessionToken });
    return result.valid ? result.username || null : null;
  }

  /**
   * Check if session exists and is valid (boolean only)
   */
  async isValidSession(sessionToken: string): Promise<boolean> {
    const result = await this.execute({ sessionToken });
    return result.valid;
  }
}
