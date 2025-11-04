/**
 * 📦 PAYMENT BATCH ENTITY
 *
 * Aggregate root for handling multiple payments as a batch.
 * Enforces Hive transaction limits and batch consistency.
 */

import { PaymentId } from '../value-objects/PaymentId';
import { PaymentAmount, Currency } from '../value-objects/PaymentAmount';
import { Payment, PaymentStatus } from './Payment';
import { ValidUsername } from '../../../authentication/domain/value-objects/ValidUsername';

export enum BatchStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  PARTIALLY_FAILED = 'partially_failed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class PaymentBatch {
  private status: BatchStatus;
  private processedAt?: Date;
  private transactionId?: string;
  private errorMessage?: string;

  private constructor(
    private readonly id: PaymentId,
    private readonly createdBy: ValidUsername,
    private readonly payments: Payment[],
    private readonly createdAt: Date,
    status: BatchStatus = BatchStatus.PENDING
  ) {
    this.status = status;
  }

  static create(params: CreateBatchParams): PaymentBatch {
    if (params.payments.length === 0) {
      throw new EmptyBatchError();
    }

    if (params.payments.length > 30) {
      throw new BatchTooLargeError(params.payments.length);
    }

    // Validate all payments are from the same sender
    const firstPaymentFrom = params.payments[0].getFrom();
    const allFromSameSender = params.payments.every(payment =>
      payment.getFrom().equals(firstPaymentFrom)
    );

    if (!allFromSameSender) {
      throw new InconsistentBatchSenderError();
    }

    // Validate all payments are the same currency
    const firstCurrency = params.payments[0].getAmount().getCurrency();
    const allSameCurrency = params.payments.every(
      payment => payment.getAmount().getCurrency() === firstCurrency
    );

    if (!allSameCurrency) {
      throw new InconsistentBatchCurrencyError();
    }

    // Validate all payments are pending
    const allPending = params.payments.every(payment => payment.isPending());
    if (!allPending) {
      throw new InvalidBatchPaymentStatusError();
    }

    return new PaymentBatch(
      PaymentId.generate(),
      params.createdBy,
      [...params.payments], // defensive copy
      new Date()
    );
  }

  static reconstitute(params: ReconstituteBatchParams): PaymentBatch {
    const batch = new PaymentBatch(
      PaymentId.create(params.id),
      ValidUsername.create(params.createdBy),
      params.payments,
      params.createdAt,
      params.status
    );

    if (params.processedAt) {
      batch.processedAt = params.processedAt;
    }
    if (params.transactionId) {
      batch.transactionId = params.transactionId;
    }
    if (params.errorMessage) {
      batch.errorMessage = params.errorMessage;
    }

    return batch;
  }

  // Getters
  getId(): PaymentId {
    return this.id;
  }

  getCreatedBy(): ValidUsername {
    return this.createdBy;
  }

  getPayments(): readonly Payment[] {
    return [...this.payments];
  }

  getStatus(): BatchStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getProcessedAt(): Date | undefined {
    return this.processedAt;
  }

  getTransactionId(): string | undefined {
    return this.transactionId;
  }

  getErrorMessage(): string | undefined {
    return this.errorMessage;
  }

  getPaymentCount(): number {
    return this.payments.length;
  }

  getTotalAmount(): PaymentAmount {
    if (this.payments.length === 0) {
      throw new EmptyBatchError();
    }

    const currency = this.payments[0].getAmount().getCurrency();
    let total = PaymentAmount.zero(currency);

    for (const payment of this.payments) {
      total = total.add(payment.getAmount());
    }

    return total;
  }

  getCurrency(): Currency {
    if (this.payments.length === 0) {
      throw new EmptyBatchError();
    }

    return this.payments[0].getAmount().getCurrency();
  }

  // Business behavior
  startProcessing(): void {
    if (this.status !== BatchStatus.PENDING) {
      throw new InvalidBatchStatusTransitionError(this.status, BatchStatus.PROCESSING);
    }

    // Start processing all payments
    for (const payment of this.payments) {
      payment.startProcessing();
    }

    this.status = BatchStatus.PROCESSING;
  }

  markAsCompleted(transactionId: string): void {
    if (this.status !== BatchStatus.PROCESSING) {
      throw new InvalidBatchStatusTransitionError(this.status, BatchStatus.COMPLETED);
    }

    // Mark all payments as completed
    for (const payment of this.payments) {
      payment.markAsCompleted(transactionId);
    }

    this.status = BatchStatus.COMPLETED;
    this.transactionId = transactionId;
    this.processedAt = new Date();
    this.errorMessage = undefined;
  }

  markAsFailed(errorMessage: string): void {
    if (this.status === BatchStatus.COMPLETED) {
      throw new InvalidBatchStatusTransitionError(this.status, BatchStatus.FAILED);
    }

    // Mark all payments as failed
    for (const payment of this.payments) {
      if (payment.isProcessing()) {
        payment.markAsFailed(errorMessage);
      }
    }

    this.status = BatchStatus.FAILED;
    this.errorMessage = errorMessage;
    this.processedAt = new Date();
  }

  markAsPartiallyFailed(
    completedPayments: Payment[],
    failedPayments: Payment[],
    transactionId?: string
  ): void {
    if (this.status !== BatchStatus.PROCESSING) {
      throw new InvalidBatchStatusTransitionError(this.status, BatchStatus.PARTIALLY_FAILED);
    }

    // Mark completed payments
    for (const payment of completedPayments) {
      if (transactionId) {
        payment.markAsCompleted(transactionId);
      }
    }

    // Mark failed payments
    for (const payment of failedPayments) {
      payment.markAsFailed('Batch partially failed');
    }

    this.status = BatchStatus.PARTIALLY_FAILED;
    if (transactionId) {
      this.transactionId = transactionId;
    }
    this.processedAt = new Date();
  }

  cancel(): void {
    if (this.status === BatchStatus.COMPLETED || this.status === BatchStatus.PROCESSING) {
      throw new InvalidBatchStatusTransitionError(this.status, BatchStatus.CANCELLED);
    }

    // Cancel all payments
    for (const payment of this.payments) {
      if (payment.isPending()) {
        payment.cancel();
      }
    }

    this.status = BatchStatus.CANCELLED;
    this.processedAt = new Date();
  }

  // Query methods
  isPending(): boolean {
    return this.status === BatchStatus.PENDING;
  }

  isProcessing(): boolean {
    return this.status === BatchStatus.PROCESSING;
  }

  isCompleted(): boolean {
    return this.status === BatchStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === BatchStatus.FAILED;
  }

  isPartiallyFailed(): boolean {
    return this.status === BatchStatus.PARTIALLY_FAILED;
  }

  isCancelled(): boolean {
    return this.status === BatchStatus.CANCELLED;
  }

  isFinalized(): boolean {
    return this.isCompleted() || this.isFailed() || this.isCancelled() || this.isPartiallyFailed();
  }

  getCompletedPayments(): Payment[] {
    return this.payments.filter(p => p.isCompleted());
  }

  getFailedPayments(): Payment[] {
    return this.payments.filter(p => p.isFailed());
  }

  getPendingPayments(): Payment[] {
    return this.payments.filter(p => p.isPending());
  }

  getSuccessRate(): number {
    const completed = this.getCompletedPayments().length;
    return this.payments.length > 0 ? completed / this.payments.length : 0;
  }

  equals(other: PaymentBatch): boolean {
    return this.id.equals(other.id);
  }

  toString(): string {
    const total = this.payments.length > 0 ? this.getTotalAmount().format() : '0';
    return `PaymentBatch(${this.id.getValue()}, ${this.payments.length} payments, ${total}, ${this.status})`;
  }

  toJSON(): BatchSnapshot {
    return {
      id: this.id.getValue(),
      createdBy: this.createdBy.getValue(),
      paymentCount: this.payments.length,
      totalAmount: this.payments.length > 0 ? this.getTotalAmount().getAmount() : 0,
      currency: this.payments.length > 0 ? this.getCurrency() : Currency.HIVE,
      status: this.status,
      createdAt: this.createdAt.toISOString(),
      processedAt: this.processedAt?.toISOString(),
      transactionId: this.transactionId,
      errorMessage: this.errorMessage,
      successRate: this.getSuccessRate(),
    };
  }
}

// Domain interfaces
export interface CreateBatchParams {
  createdBy: ValidUsername;
  payments: Payment[];
}

export interface ReconstituteBatchParams {
  id: string;
  createdBy: string;
  payments: Payment[];
  status: BatchStatus;
  createdAt: Date;
  processedAt?: Date;
  transactionId?: string;
  errorMessage?: string;
}

export interface BatchSnapshot {
  id: string;
  createdBy: string;
  paymentCount: number;
  totalAmount: number;
  currency: Currency;
  status: BatchStatus;
  createdAt: string;
  processedAt?: string;
  transactionId?: string;
  errorMessage?: string;
  successRate: number;
}

// Domain Exceptions
export class EmptyBatchError extends Error {
  constructor() {
    super('Payment batch cannot be empty');
    this.name = 'EmptyBatchError';
  }
}

export class BatchTooLargeError extends Error {
  constructor(size: number) {
    super(`Payment batch too large: ${size} payments (maximum 30)`);
    this.name = 'BatchTooLargeError';
  }
}

export class InconsistentBatchSenderError extends Error {
  constructor() {
    super('All payments in batch must be from the same sender');
    this.name = 'InconsistentBatchSenderError';
  }
}

export class InconsistentBatchCurrencyError extends Error {
  constructor() {
    super('All payments in batch must use the same currency');
    this.name = 'InconsistentBatchCurrencyError';
  }
}

export class InvalidBatchPaymentStatusError extends Error {
  constructor() {
    super('All payments in batch must be pending');
    this.name = 'InvalidBatchPaymentStatusError';
  }
}

export class InvalidBatchStatusTransitionError extends Error {
  constructor(from: BatchStatus, to: BatchStatus) {
    super(`Invalid batch status transition from ${from} to ${to}`);
    this.name = 'InvalidBatchStatusTransitionError';
  }
}
