/**
 * 🚪 LOGOUT USE CASE
 *
 * Handles user logout and session termination.
 */

import { SessionToken } from '../domain/value-objects/SessionToken';
import { ValidUsername } from '../domain/value-objects/ValidUsername';
import type { SessionRepository } from '../domain/ports/SessionRepository';

export interface LogoutRequest {
  readonly sessionToken?: string;
  readonly username?: string;
  readonly logoutAll?: boolean; // Logout from all sessions
}

export interface LogoutResponse {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly errorCode?: string;
}

export class LogoutUseCase {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(request: LogoutRequest): Promise<LogoutResponse> {
    try {
      if (request.logoutAll && request.username) {
        // Logout from all sessions for the user
        return await this.logoutAllSessions(request.username);
      } else if (request.sessionToken) {
        // Logout from specific session
        return await this.logoutSession(request.sessionToken);
      } else {
        return {
          success: false,
          error: 'Either sessionToken or username is required',
          errorCode: 'INVALID_REQUEST',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  private async logoutSession(sessionTokenValue: string): Promise<LogoutResponse> {
    try {
      const sessionToken = SessionToken.create(sessionTokenValue);

      // Find the session
      const session = await this.sessionRepository.findByToken(sessionToken);

      if (!session) {
        return {
          success: false,
          error: 'Session not found',
          errorCode: 'SESSION_NOT_FOUND',
        };
      }

      // Revoke the session (domain logic)
      session.revoke();

      // Update in repository (in a real implementation, this might be a separate update method)
      await this.sessionRepository.delete(sessionToken);

      return {
        success: true,
        message: 'Successfully logged out',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to logout',
        errorCode: 'LOGOUT_FAILED',
      };
    }
  }

  private async logoutAllSessions(usernameValue: string): Promise<LogoutResponse> {
    try {
      const username = ValidUsername.create(usernameValue);

      // Delete all sessions for the user
      await this.sessionRepository.deleteAllByUsername(username);

      return {
        success: true,
        message: 'Successfully logged out from all sessions',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to logout from all sessions',
        errorCode: 'LOGOUT_ALL_FAILED',
      };
    }
  }
}
