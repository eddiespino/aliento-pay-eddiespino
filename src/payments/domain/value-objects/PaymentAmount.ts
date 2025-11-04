/**
 * 💰 PAYMENT AMOUNT VALUE OBJECT
 *
 * Represents a payment amount with currency and validation.
 * Immutable value object with business rules.
 */

export enum Currency {
  HIVE = 'HIVE',
  HBD = 'HBD',
}

export class PaymentAmount {
  private constructor(
    private readonly amount: number,
    private readonly currency: Currency
  ) {}

  static create(amount: number, currency: Currency): PaymentAmount {
    if (!PaymentAmount.isValidAmount(amount)) {
      throw new InvalidPaymentAmountError(amount, currency);
    }

    return new PaymentAmount(amount, currency);
  }

  static createHive(amount: number): PaymentAmount {
    return PaymentAmount.create(amount, Currency.HIVE);
  }

  static createHbd(amount: number): PaymentAmount {
    return PaymentAmount.create(amount, Currency.HBD);
  }

  static zero(currency: Currency): PaymentAmount {
    return new PaymentAmount(0, currency);
  }

  static isValidAmount(amount: number): boolean {
    // Must be a finite positive number
    if (!Number.isFinite(amount) || amount < 0) {
      return false;
    }

    // Must have reasonable precision (max 3 decimals)
    const rounded = Math.round(amount * 1000) / 1000;
    if (Math.abs(amount - rounded) > 0.0001) {
      return false;
    }

    // Must be within reasonable limits (0 to 1 billion)
    if (amount > 1_000_000_000) {
      return false;
    }

    return true;
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  add(other: PaymentAmount): PaymentAmount {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }

    return new PaymentAmount(this.amount + other.amount, this.currency);
  }

  subtract(other: PaymentAmount): PaymentAmount {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }

    const result = this.amount - other.amount;
    if (result < 0) {
      throw new NegativeAmountError(result);
    }

    return new PaymentAmount(result, this.currency);
  }

  multiply(factor: number): PaymentAmount {
    if (!Number.isFinite(factor) || factor < 0) {
      throw new InvalidFactorError(factor);
    }

    return new PaymentAmount(this.amount * factor, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isGreaterThan(other: PaymentAmount): boolean {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }

    return this.amount > other.amount;
  }

  isLessThan(other: PaymentAmount): boolean {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }

    return this.amount < other.amount;
  }

  equals(other: PaymentAmount): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  /**
   * Round to 3 decimal places (Hive standard)
   */
  round(): PaymentAmount {
    const rounded = Math.round(this.amount * 1000) / 1000;
    return new PaymentAmount(rounded, this.currency);
  }

  /**
   * Format for display
   */
  format(): string {
    return `${this.amount.toFixed(3)} ${this.currency}`;
  }

  /**
   * Format for blockchain operations
   */
  toBlockchainFormat(): string {
    return `${this.amount.toFixed(3)} ${this.currency}`;
  }

  toString(): string {
    return this.format();
  }

  toJSON(): { amount: number; currency: Currency } {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }
}

// Domain Exceptions
export class InvalidPaymentAmountError extends Error {
  constructor(amount: number, currency: Currency) {
    super(`Invalid payment amount: ${amount} ${currency}`);
    this.name = 'InvalidPaymentAmountError';
  }
}

export class CurrencyMismatchError extends Error {
  constructor(currency1: Currency, currency2: Currency) {
    super(`Currency mismatch: ${currency1} vs ${currency2}`);
    this.name = 'CurrencyMismatchError';
  }
}

export class NegativeAmountError extends Error {
  constructor(amount: number) {
    super(`Amount cannot be negative: ${amount}`);
    this.name = 'NegativeAmountError';
  }
}

export class InvalidFactorError extends Error {
  constructor(factor: number) {
    super(`Invalid multiplication factor: ${factor}`);
    this.name = 'InvalidFactorError';
  }
}
