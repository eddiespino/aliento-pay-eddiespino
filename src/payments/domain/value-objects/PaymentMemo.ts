/**
 * 📝 PAYMENT MEMO VALUE OBJECT
 *
 * Represents a payment memo with validation and encoding.
 * Immutable value object with Hive-specific rules.
 */

export class PaymentMemo {
  private constructor(private readonly value: string) {}

  static create(memo: string): PaymentMemo {
    const normalized = memo.trim();

    if (!PaymentMemo.isValid(normalized)) {
      throw new InvalidPaymentMemoError(memo);
    }

    return new PaymentMemo(normalized);
  }

  static empty(): PaymentMemo {
    return new PaymentMemo('');
  }

  static createAlientoMemo(purpose: string, details?: string): PaymentMemo {
    const parts = ['🌱 Aliento Pay', purpose];
    if (details) {
      parts.push(details);
    }

    const memo = parts.join(' - ');
    return PaymentMemo.create(memo);
  }

  static createCurationMemo(period: string, percentage: number): PaymentMemo {
    return PaymentMemo.createAlientoMemo(
      'Curation Rewards',
      `${period} period, ${percentage.toFixed(1)}% return`
    );
  }

  static createDelegationMemo(hpAmount: number): PaymentMemo {
    return PaymentMemo.createAlientoMemo(
      'Delegation Rewards',
      `Based on ${hpAmount.toFixed(0)} HP delegated`
    );
  }

  static isValid(memo: string): boolean {
    // Hive memo length limit (typically 2048 bytes)
    if (memo.length > 2048) {
      return false;
    }

    // Should be valid UTF-8 (JavaScript strings are UTF-16, but this is close enough)
    try {
      encodeURIComponent(memo);
      return true;
    } catch {
      return false;
    }
  }

  getValue(): string {
    return this.value;
  }

  isEmpty(): boolean {
    return this.value === '';
  }

  getLength(): number {
    return this.value.length;
  }

  /**
   * Get byte length (approximate for Hive validation)
   */
  getByteLength(): number {
    return new TextEncoder().encode(this.value).length;
  }

  /**
   * Add prefix to memo
   */
  withPrefix(prefix: string): PaymentMemo {
    const newMemo = prefix + this.value;
    return PaymentMemo.create(newMemo);
  }

  /**
   * Add suffix to memo
   */
  withSuffix(suffix: string): PaymentMemo {
    const newMemo = this.value + suffix;
    return PaymentMemo.create(newMemo);
  }

  /**
   * Truncate memo to fit in Hive limits
   */
  truncate(maxLength: number = 2000): PaymentMemo {
    if (this.value.length <= maxLength) {
      return this;
    }

    const truncated = this.value.substring(0, maxLength - 3) + '...';
    return new PaymentMemo(truncated);
  }

  equals(other: PaymentMemo): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}

export class InvalidPaymentMemoError extends Error {
  constructor(memo: string) {
    super(`Invalid payment memo: too long or invalid encoding (${memo.length} chars)`);
    this.name = 'InvalidPaymentMemoError';
  }
}
