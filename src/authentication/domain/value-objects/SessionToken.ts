/**
 * 🔑 SESSION TOKEN VALUE OBJECT
 *
 * Represents a secure session token.
 * Immutable value object with validation.
 */

export class SessionToken {
  private constructor(private readonly value: string) {}

  static create(token: string): SessionToken {
    if (!SessionToken.isValid(token)) {
      throw new InvalidSessionTokenError(token);
    }

    return new SessionToken(token);
  }

  static generate(): SessionToken {
    // Generate a secure random token
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');

    return new SessionToken(token);
  }

  static isValid(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Must be 64 characters long (32 bytes in hex)
    if (token.length !== 64) {
      return false;
    }

    // Must be valid hexadecimal
    if (!/^[a-f0-9]+$/.test(token)) {
      return false;
    }

    return true;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: SessionToken): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  /**
   * Get a masked version for logging (shows only first 8 chars)
   */
  getMasked(): string {
    return `${this.value.substring(0, 8)}...`;
  }
}

export class InvalidSessionTokenError extends Error {
  constructor(token: string) {
    super(`Invalid session token format`);
    this.name = 'InvalidSessionTokenError';
  }
}
