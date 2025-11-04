/**
 * 👤 PAYMENT RECIPIENT VALUE OBJECT
 *
 * Represents a payment recipient with Hive username validation.
 * Reuses ValidUsername logic from authentication module.
 */

// Import ValidUsername from authentication module for consistency
import { ValidUsername } from '../../../authentication/domain/value-objects/ValidUsername';

export class PaymentRecipient {
  private constructor(private readonly username: ValidUsername) {}

  static create(username: string): PaymentRecipient {
    const validUsername = ValidUsername.create(username);
    return new PaymentRecipient(validUsername);
  }

  static fromValidUsername(username: ValidUsername): PaymentRecipient {
    return new PaymentRecipient(username);
  }

  getUsername(): ValidUsername {
    return this.username;
  }

  getValue(): string {
    return this.username.getValue();
  }

  equals(other: PaymentRecipient): boolean {
    return this.username.equals(other.username);
  }

  toString(): string {
    return this.username.getValue();
  }

  toJSON(): string {
    return this.username.getValue();
  }
}

/**
 * Collection of payment recipients with validation
 */
export class PaymentRecipients {
  private constructor(private readonly recipients: PaymentRecipient[]) {}

  static create(usernames: string[]): PaymentRecipients {
    if (usernames.length === 0) {
      throw new EmptyRecipientsError();
    }

    if (usernames.length > 30) {
      throw new TooManyRecipientsError(usernames.length);
    }

    const recipients = usernames.map(username => PaymentRecipient.create(username));

    // Check for duplicates
    const uniqueUsernames = new Set(recipients.map(r => r.getValue()));
    if (uniqueUsernames.size !== recipients.length) {
      throw new DuplicateRecipientsError();
    }

    return new PaymentRecipients(recipients);
  }

  static fromSingle(username: string): PaymentRecipients {
    return PaymentRecipients.create([username]);
  }

  getRecipients(): readonly PaymentRecipient[] {
    return [...this.recipients];
  }

  getUsernames(): string[] {
    return this.recipients.map(r => r.getValue());
  }

  getCount(): number {
    return this.recipients.length;
  }

  contains(username: string): boolean {
    return this.recipients.some(r => r.getValue() === username);
  }

  add(username: string): PaymentRecipients {
    if (this.contains(username)) {
      throw new DuplicateRecipientsError();
    }

    if (this.recipients.length >= 30) {
      throw new TooManyRecipientsError(this.recipients.length + 1);
    }

    const newRecipient = PaymentRecipient.create(username);
    return new PaymentRecipients([...this.recipients, newRecipient]);
  }

  remove(username: string): PaymentRecipients {
    const filtered = this.recipients.filter(r => r.getValue() !== username);

    if (filtered.length === this.recipients.length) {
      throw new RecipientNotFoundError(username);
    }

    if (filtered.length === 0) {
      throw new EmptyRecipientsError();
    }

    return new PaymentRecipients(filtered);
  }

  /**
   * Split into batches of maximum size (for Hive transaction limits)
   */
  toBatches(maxBatchSize: number = 30): PaymentRecipients[] {
    const batches: PaymentRecipients[] = [];

    for (let i = 0; i < this.recipients.length; i += maxBatchSize) {
      const batchRecipients = this.recipients.slice(i, i + maxBatchSize);
      batches.push(new PaymentRecipients(batchRecipients));
    }

    return batches;
  }

  equals(other: PaymentRecipients): boolean {
    if (this.recipients.length !== other.recipients.length) {
      return false;
    }

    return this.recipients.every((recipient, index) => recipient.equals(other.recipients[index]));
  }

  toJSON(): string[] {
    return this.getUsernames();
  }
}

// Domain Exceptions
export class EmptyRecipientsError extends Error {
  constructor() {
    super('Recipients list cannot be empty');
    this.name = 'EmptyRecipientsError';
  }
}

export class TooManyRecipientsError extends Error {
  constructor(count: number) {
    super(`Too many recipients: ${count} (maximum 30 per transaction)`);
    this.name = 'TooManyRecipientsError';
  }
}

export class DuplicateRecipientsError extends Error {
  constructor() {
    super('Duplicate recipients are not allowed');
    this.name = 'DuplicateRecipientsError';
  }
}

export class RecipientNotFoundError extends Error {
  constructor(username: string) {
    super(`Recipient not found: ${username}`);
    this.name = 'RecipientNotFoundError';
  }
}
