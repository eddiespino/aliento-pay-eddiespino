/**
 * 💾 SESSION REPOSITORY PORT
 *
 * Port interface for session persistence.
 * Abstracts session storage implementations.
 */

import { UserSession } from '../entities/UserSession';
import { SessionToken } from '../value-objects/SessionToken';
import { ValidUsername } from '../value-objects/ValidUsername';

export interface SessionRepository {
  /**
   * Save a user session
   */
  save(session: UserSession): Promise<void>;

  /**
   * Find session by token
   */
  findByToken(token: SessionToken): Promise<UserSession | null>;

  /**
   * Find all active sessions for a user
   */
  findActiveByUsername(username: ValidUsername): Promise<UserSession[]>;

  /**
   * Delete a session
   */
  delete(token: SessionToken): Promise<void>;

  /**
   * Delete all sessions for a user
   */
  deleteAllByUsername(username: ValidUsername): Promise<void>;

  /**
   * Clean up expired sessions
   */
  cleanupExpired(): Promise<number>;

  /**
   * Count active sessions for a user
   */
  countActiveByUsername(username: ValidUsername): Promise<number>;
}

/**
 * Session repository errors
 */
export abstract class SessionRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'SessionRepositoryError';
  }
}

export class SessionNotFoundError extends SessionRepositoryError {
  constructor(tokenMask: string) {
    super(`Session ${tokenMask} not found`, 'SESSION_NOT_FOUND');
  }
}

export class SessionStorageError extends SessionRepositoryError {
  public readonly cause?: Error;

  constructor(operation: string, cause?: Error) {
    super(`Session storage error during ${operation}: ${cause?.message}`, 'STORAGE_ERROR');
    this.cause = cause;
  }
}
