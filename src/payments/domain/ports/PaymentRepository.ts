/**
 * 💾 PAYMENT REPOSITORY PORT
 *
 * Port interface for payment persistence.
 * Abstracts payment storage implementations.
 */

import { Payment, PaymentStatus, PaymentType } from '../entities/Payment';
import { PaymentBatch, BatchStatus } from '../entities/PaymentBatch';
import { PaymentId } from '../value-objects/PaymentId';
import { ValidUsername } from '../../../authentication/domain/value-objects/ValidUsername';
import { Currency } from '../value-objects/PaymentAmount';

export interface PaymentRepository {
  // Single Payment operations
  save(payment: Payment): Promise<void>;
  findById(id: PaymentId): Promise<Payment | null>;
  findByTransactionId(transactionId: string): Promise<Payment[]>;

  // User-specific queries
  findByUser(username: ValidUsername, options?: PaymentQueryOptions): Promise<Payment[]>;
  findPendingByUser(username: ValidUsername): Promise<Payment[]>;
  countByUser(username: ValidUsername, status?: PaymentStatus): Promise<number>;

  // Batch operations
  saveBatch(batch: PaymentBatch): Promise<void>;
  findBatchById(id: PaymentId): Promise<PaymentBatch | null>;
  findBatchesByUser(username: ValidUsername, options?: BatchQueryOptions): Promise<PaymentBatch[]>;

  // Global queries
  findPendingPayments(limit?: number): Promise<Payment[]>;
  findFailedPayments(limit?: number): Promise<Payment[]>;

  // Statistics
  getTotalAmountByUser(
    username: ValidUsername,
    currency: Currency,
    period?: DateRange
  ): Promise<number>;
  getPaymentStats(period?: DateRange): Promise<PaymentStats>;

  // Cleanup and maintenance
  deleteOldPayments(olderThan: Date): Promise<number>;
  cleanupFailedPayments(olderThan: Date): Promise<number>;
}

export interface PaymentQueryOptions {
  status?: PaymentStatus;
  type?: PaymentType;
  currency?: Currency;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
  dateRange?: DateRange;
}

export interface BatchQueryOptions {
  status?: BatchStatus;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'paymentCount' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
  dateRange?: DateRange;
}

export interface DateRange {
  readonly startDate: Date;
  readonly endDate: Date;
}

export interface PaymentStats {
  readonly totalPayments: number;
  readonly totalAmount: number;
  readonly totalAmountHive: number;
  readonly totalAmountHbd: number;
  readonly pendingCount: number;
  readonly completedCount: number;
  readonly failedCount: number;
  readonly averageAmount: number;
  readonly largestPayment: number;
  readonly smallestPayment: number;
}

/**
 * Payment repository errors
 */
export abstract class PaymentRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'PaymentRepositoryError';
  }
}

export class PaymentNotFoundError extends PaymentRepositoryError {
  constructor(paymentId: string) {
    super(`Payment ${paymentId} not found`, 'PAYMENT_NOT_FOUND');
  }
}

export class BatchNotFoundError extends PaymentRepositoryError {
  constructor(batchId: string) {
    super(`Payment batch ${batchId} not found`, 'BATCH_NOT_FOUND');
  }
}

export class PaymentStorageError extends PaymentRepositoryError {
  public readonly cause?: Error;

  constructor(operation: string, cause?: Error) {
    super(`Payment storage error during ${operation}: ${cause?.message}`, 'STORAGE_ERROR');
    this.cause = cause;
  }
}
