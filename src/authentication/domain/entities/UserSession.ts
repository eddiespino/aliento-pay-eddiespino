/**
 * 🔐 USER SESSION ENTITY
 *
 * Represents an active user session.
 * Entity with identity and business behavior.
 */

import { ValidUsername } from '../value-objects/ValidUsername';
import { SessionToken } from '../value-objects/SessionToken';

export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export class UserSession {
  private status: SessionStatus;

  private constructor(
    private readonly token: SessionToken,
    private readonly username: ValidUsername,
    private readonly createdAt: Date,
    private readonly expiresAt: Date,
    status: SessionStatus = SessionStatus.ACTIVE
  ) {
    this.status = status;
  }

  static create(username: ValidUsername, durationInHours: number = 24): UserSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationInHours * 60 * 60 * 1000);
    const token = SessionToken.generate();

    return new UserSession(token, username, now, expiresAt, SessionStatus.ACTIVE);
  }

  static reconstitute(
    token: SessionToken,
    username: ValidUsername,
    createdAt: Date,
    expiresAt: Date,
    status: SessionStatus
  ): UserSession {
    return new UserSession(token, username, createdAt, expiresAt, status);
  }

  getToken(): SessionToken {
    return this.token;
  }

  getUsername(): ValidUsername {
    return this.username;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  getStatus(): SessionStatus {
    return this.status;
  }

  isActive(): boolean {
    return this.status === SessionStatus.ACTIVE && !this.isExpired();
  }

  isExpired(): boolean {
    return Date.now() > this.expiresAt.getTime();
  }

  revoke(): void {
    if (this.status === SessionStatus.REVOKED) {
      throw new SessionAlreadyRevokedError(this.token.getMasked());
    }

    this.status = SessionStatus.REVOKED;
  }

  extend(additionalHours: number): void {
    if (!this.isActive()) {
      throw new CannotExtendInactiveSessionError(this.token.getMasked());
    }

    const newExpiresAt = new Date(this.expiresAt.getTime() + additionalHours * 60 * 60 * 1000);

    // Use reflection to update the readonly property
    (this as any).expiresAt = newExpiresAt;
  }

  validate(): void {
    if (this.isExpired()) {
      this.status = SessionStatus.EXPIRED;
      throw new SessionExpiredError(this.token.getMasked());
    }

    if (this.status !== SessionStatus.ACTIVE) {
      throw new SessionNotActiveError(this.token.getMasked(), this.status);
    }
  }

  equals(other: UserSession): boolean {
    return this.token.equals(other.token);
  }

  toString(): string {
    return `UserSession(${this.username.getValue()}, ${this.token.getMasked()}, ${this.status})`;
  }
}

// Domain Exceptions
export class SessionAlreadyRevokedError extends Error {
  constructor(tokenMask: string) {
    super(`Session ${tokenMask} is already revoked`);
    this.name = 'SessionAlreadyRevokedError';
  }
}

export class CannotExtendInactiveSessionError extends Error {
  constructor(tokenMask: string) {
    super(`Cannot extend inactive session ${tokenMask}`);
    this.name = 'CannotExtendInactiveSessionError';
  }
}

export class SessionExpiredError extends Error {
  constructor(tokenMask: string) {
    super(`Session ${tokenMask} has expired`);
    this.name = 'SessionExpiredError';
  }
}

export class SessionNotActiveError extends Error {
  constructor(tokenMask: string, status: SessionStatus) {
    super(`Session ${tokenMask} is not active (status: ${status})`);
    this.name = 'SessionNotActiveError';
  }
}
