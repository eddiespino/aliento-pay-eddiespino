/**
 * 👤 VALID USERNAME VALUE OBJECT
 *
 * Represents a validated Hive username.
 * Immutable value object with business rules validation.
 */

export class ValidUsername {
  private constructor(private readonly value: string) {}

  static create(username: string): ValidUsername {
    const normalized = username.trim().toLowerCase();

    if (!ValidUsername.isValid(normalized)) {
      throw new InvalidUsernameError(username);
    }

    return new ValidUsername(normalized);
  }

  static isValid(username: string): boolean {
    if (!username || typeof username !== 'string') {
      return false;
    }

    const normalized = username.trim().toLowerCase();

    // Length validation
    if (normalized.length < 3 || normalized.length > 16) {
      return false;
    }

    // Character validation - only letters, numbers, dots and hyphens
    if (!/^[a-z0-9.-]+$/.test(normalized)) {
      return false;
    }

    // Cannot start or end with dot or hyphen
    if (
      normalized.startsWith('.') ||
      normalized.endsWith('.') ||
      normalized.startsWith('-') ||
      normalized.endsWith('-')
    ) {
      return false;
    }

    // Cannot have consecutive dots or hyphens
    if (normalized.includes('..') || normalized.includes('--')) {
      return false;
    }

    return true;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ValidUsername): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}

export class InvalidUsernameError extends Error {
  constructor(username: string) {
    super(`Invalid Hive username: ${username}`);
    this.name = 'InvalidUsernameError';
  }
}
