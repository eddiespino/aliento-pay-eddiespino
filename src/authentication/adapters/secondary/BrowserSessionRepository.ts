/**
 * 🗄️ BROWSER SESSION REPOSITORY
 *
 * Secondary adapter for session storage in browser.
 * Implements SessionRepository port using localStorage/sessionStorage.
 */

import type { SessionRepository } from '../../domain/ports/SessionRepository';
import { UserSession, SessionStatus } from '../../domain/entities/UserSession';
import { SessionToken } from '../../domain/value-objects/SessionToken';
import { ValidUsername } from '../../domain/value-objects/ValidUsername';
import { SessionNotFoundError, SessionStorageError } from '../../domain/ports/SessionRepository';

interface StoredSession {
  token: string;
  username: string;
  createdAt: string;
  expiresAt: string;
  status: SessionStatus;
}

export class BrowserSessionRepository implements SessionRepository {
  private readonly storageKey = 'aliento_pay_sessions';
  private readonly storage: Storage;

  constructor(useSessionStorage = false) {
    // Use localStorage by default for persistent sessions
    // Use sessionStorage for temporary sessions
    this.storage = useSessionStorage ? sessionStorage : localStorage;
  }

  async save(session: UserSession): Promise<void> {
    try {
      const sessions = await this.getAllStoredSessions();

      const storedSession: StoredSession = {
        token: session.getToken().getValue(),
        username: session.getUsername().getValue(),
        createdAt: session.getCreatedAt().toISOString(),
        expiresAt: session.getExpiresAt().toISOString(),
        status: session.getStatus(),
      };

      // Replace existing session with same token or add new one
      sessions.set(session.getToken().getValue(), storedSession);

      await this.saveAllSessions(sessions);
    } catch (error) {
      throw new SessionStorageError('save', error as Error);
    }
  }

  async findByToken(token: SessionToken): Promise<UserSession | null> {
    try {
      const sessions = await this.getAllStoredSessions();
      const storedSession = sessions.get(token.getValue());

      if (!storedSession) {
        return null;
      }

      return this.reconstructSession(storedSession);
    } catch (error) {
      throw new SessionStorageError('findByToken', error as Error);
    }
  }

  async findActiveByUsername(username: ValidUsername): Promise<UserSession[]> {
    try {
      const sessions = await this.getAllStoredSessions();
      const userSessions: UserSession[] = [];

      for (const storedSession of Array.from(sessions.values())) {
        if (
          storedSession.username === username.getValue() &&
          storedSession.status === SessionStatus.ACTIVE
        ) {
          const session = this.reconstructSession(storedSession);
          if (session.isActive()) {
            userSessions.push(session);
          }
        }
      }

      return userSessions;
    } catch (error) {
      throw new SessionStorageError('findActiveByUsername', error as Error);
    }
  }

  async delete(token: SessionToken): Promise<void> {
    try {
      const sessions = await this.getAllStoredSessions();

      if (!sessions.has(token.getValue())) {
        throw new SessionNotFoundError(token.getMasked());
      }

      sessions.delete(token.getValue());
      await this.saveAllSessions(sessions);
    } catch (error) {
      if (error instanceof SessionNotFoundError) {
        throw error;
      }
      throw new SessionStorageError('delete', error as Error);
    }
  }

  async deleteAllByUsername(username: ValidUsername): Promise<void> {
    try {
      const sessions = await this.getAllStoredSessions();
      const tokensToDelete: string[] = [];

      for (const [token, storedSession] of Array.from(sessions.entries())) {
        if (storedSession.username === username.getValue()) {
          tokensToDelete.push(token);
        }
      }

      tokensToDelete.forEach(token => sessions.delete(token));
      await this.saveAllSessions(sessions);
    } catch (error) {
      throw new SessionStorageError('deleteAllByUsername', error as Error);
    }
  }

  async cleanupExpired(): Promise<number> {
    try {
      const sessions = await this.getAllStoredSessions();
      const now = Date.now();
      let cleanedCount = 0;

      for (const [token, storedSession] of Array.from(sessions.entries())) {
        const expiresAt = new Date(storedSession.expiresAt).getTime();
        if (now > expiresAt) {
          sessions.delete(token);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        await this.saveAllSessions(sessions);
      }

      return cleanedCount;
    } catch (error) {
      throw new SessionStorageError('cleanupExpired', error as Error);
    }
  }

  async countActiveByUsername(username: ValidUsername): Promise<number> {
    try {
      const activeSessions = await this.findActiveByUsername(username);
      return activeSessions.length;
    } catch (error) {
      throw new SessionStorageError('countActiveByUsername', error as Error);
    }
  }

  private async getAllStoredSessions(): Promise<Map<string, StoredSession>> {
    try {
      const data = this.storage.getItem(this.storageKey);
      if (!data) {
        return new Map();
      }

      const parsed = JSON.parse(data);
      return new Map(Object.entries(parsed));
    } catch (error) {
      console.warn('Failed to parse stored sessions, starting fresh:', error);
      return new Map();
    }
  }

  private async saveAllSessions(sessions: Map<string, StoredSession>): Promise<void> {
    try {
      const data = Object.fromEntries(sessions);
      this.storage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      throw new Error(`Failed to save sessions to storage: ${error}`);
    }
  }

  private reconstructSession(stored: StoredSession): UserSession {
    return UserSession.reconstitute(
      SessionToken.create(stored.token),
      ValidUsername.create(stored.username),
      new Date(stored.createdAt),
      new Date(stored.expiresAt),
      stored.status
    );
  }
}
