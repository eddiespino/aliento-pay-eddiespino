/**
 * 🌐 PAYMENT GATEWAY PORT
 *
 * Port interface for external payment processing.
 * Abstracts blockchain and wallet interactions.
 */

import { Payment } from '../entities/Payment';
import { PaymentBatch } from '../entities/PaymentBatch';
import { PaymentAmount } from '../value-objects/PaymentAmount';
import { ValidUsername } from '../../../authentication/domain/value-objects/ValidUsername';

export interface PaymentGateway {
  /**
   * Check if payment gateway is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Process a single payment
   */
  processPayment(payment: Payment): Promise<PaymentResult>;

  /**
   * Process multiple payments in a batch
   */
  processBatch(batch: PaymentBatch): Promise<BatchResult>;

  /**
   * Verify a transaction on the blockchain
   */
  verifyTransaction(transactionId: string): Promise<TransactionInfo | null>;

  /**
   * Get account balance
   */
  getBalance(username: ValidUsername): Promise<AccountBalance>;

  /**
   * Estimate transaction fees
   */
  estimateFees(payment: Payment): Promise<PaymentAmount>;

  /**
   * Get transaction history for user
   */
  getTransactionHistory(
    username: ValidUsername,
    options?: TransactionHistoryOptions
  ): Promise<TransactionInfo[]>;
}

export interface PaymentResult {
  readonly success: boolean;
  readonly transactionId?: string;
  readonly blockNumber?: number;
  readonly confirmations?: number;
  readonly error?: string;
  readonly errorCode?: string;
  readonly estimatedFee?: number;
}

export interface BatchResult {
  readonly success: boolean;
  readonly transactionId?: string;
  readonly blockNumber?: number;
  readonly confirmations?: number;
  readonly processedCount: number;
  readonly failedCount: number;
  readonly totalAmount: number;
  readonly error?: string;
  readonly errorCode?: string;
  readonly paymentResults?: PaymentResult[];
}

export interface TransactionInfo {
  readonly transactionId: string;
  readonly blockNumber: number;
  readonly timestamp: Date;
  readonly from: string;
  readonly to: string;
  readonly amount: number;
  readonly currency: string;
  readonly memo: string;
  readonly status: 'confirmed' | 'pending' | 'failed';
  readonly confirmations: number;
}

export interface AccountBalance {
  readonly username: string;
  readonly hive: number;
  readonly hbd: number;
  readonly lastUpdated: Date;
}

export interface TransactionHistoryOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly transactionType?: 'sent' | 'received' | 'all';
}

/**
 * Payment gateway errors
 */
export abstract class PaymentGatewayError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'PaymentGatewayError';
  }
}

export class PaymentGatewayUnavailableError extends PaymentGatewayError {
  constructor() {
    super('Payment gateway is not available', 'GATEWAY_UNAVAILABLE');
  }
}

export class InsufficientBalanceError extends PaymentGatewayError {
  constructor(required: number, available: number, currency: string) {
    super(
      `Insufficient balance: required ${required} ${currency}, available ${available} ${currency}`,
      'INSUFFICIENT_BALANCE'
    );
  }
}

export class TransactionFailedError extends PaymentGatewayError {
  constructor(reason: string) {
    super(`Transaction failed: ${reason}`, 'TRANSACTION_FAILED');
  }
}

export class TransactionNotFoundError extends PaymentGatewayError {
  constructor(transactionId: string) {
    super(`Transaction not found: ${transactionId}`, 'TRANSACTION_NOT_FOUND');
  }
}

export class InvalidRecipientError extends PaymentGatewayError {
  constructor(recipient: string) {
    super(`Invalid recipient: ${recipient}`, 'INVALID_RECIPIENT');
  }
}

export class PaymentTimeoutError extends PaymentGatewayError {
  constructor(timeoutMs: number) {
    super(`Payment timed out after ${timeoutMs}ms`, 'PAYMENT_TIMEOUT');
  }
}
