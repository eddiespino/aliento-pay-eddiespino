/**
 * 🆔 PAYMENT ID VALUE OBJECT
 *
 * Unique identifier for payments.
 * Immutable value object with validation.
 */

export class PaymentId {
  private constructor(private readonly value: string) {}

  static create(id: string): PaymentId {
    if (!PaymentId.isValid(id)) {
      throw new InvalidPaymentIdError(id);
    }

    return new PaymentId(id);
  }

  static generate(): PaymentId {
    // Generate a unique payment ID (UUID-like)
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.getRandomValues(new Uint8Array(8));
    const randomString = Array.from(randomBytes, byte => byte.toString(36)).join('');

    const id = `pay_${timestamp}_${randomString}`;
    return new PaymentId(id);
  }

  static isValid(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }

    // Must start with 'pay_' and have reasonable length
    if (!id.startsWith('pay_') || id.length < 10 || id.length > 50) {
      return false;
    }

    // Must contain only alphanumeric and underscore
    if (!/^[a-z0-9_]+$/.test(id)) {
      return false;
    }

    return true;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PaymentId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}

export class InvalidPaymentIdError extends Error {
  constructor(id: string) {
    super(`Invalid payment ID: ${id}`);
    this.name = 'InvalidPaymentIdError';
  }
}
