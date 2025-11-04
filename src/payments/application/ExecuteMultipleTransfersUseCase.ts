/**
 * 🚀 EXECUTE MULTIPLE TRANSFERS USE CASE
 *
 * Handles multiple transfers in a single transaction.
 * Orchestrates payment creation, validation, and blockchain execution.
 */

import { Payment, PaymentType } from '../domain/entities/Payment';
import { PaymentBatch } from '../domain/entities/PaymentBatch';
import { PaymentAmount, Currency } from '../domain/value-objects/PaymentAmount';
import { PaymentMemo } from '../domain/value-objects/PaymentMemo';
import { ValidUsername } from '../../authentication/domain/value-objects/ValidUsername';

import type { PaymentRepository } from '../domain/ports/PaymentRepository';
import type { PaymentGateway } from '../domain/ports/PaymentGateway';

export interface MultipleTransferRequest {
  readonly from: string;
  readonly transfers: TransferRequest[];
  readonly currency: Currency;
  readonly sessionToken?: string;
}

export interface TransferRequest {
  readonly to: string;
  readonly amount: number;
  readonly memo?: string;
}

export interface MultipleTransferResponse {
  readonly success: boolean;
  readonly batchId?: string;
  readonly transactionId?: string;
  readonly processedCount: number;
  readonly totalAmount: number;
  readonly currency: Currency;
  readonly error?: string;
  readonly errorCode?: string;
  readonly payments?: PaymentSummary[];
}

export interface PaymentSummary {
  readonly to: string;
  readonly amount: number;
  readonly status: string;
  readonly error?: string;
}

export class ExecuteMultipleTransfersUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentGateway: PaymentGateway
  ) {}

  async execute(request: MultipleTransferRequest): Promise<MultipleTransferResponse> {
    try {
      // 1. Validate request
      const validationResult = await this.validateRequest(request);
      if (!validationResult.valid) {
        return {
          success: false,
          processedCount: 0,
          totalAmount: 0,
          currency: request.currency,
          error: validationResult.error,
          errorCode: 'INVALID_REQUEST',
        };
      }

      // 2. Create payment entities
      const from = ValidUsername.create(request.from);
      const payments = await this.createPayments(from, request.transfers, request.currency);

      // 3. Create payment batch
      const batch = PaymentBatch.create({
        createdBy: from,
        payments,
      });

      // 4. Check gateway availability
      if (!(await this.paymentGateway.isAvailable())) {
        return {
          success: false,
          processedCount: 0,
          totalAmount: batch.getTotalAmount().getAmount(),
          currency: request.currency,
          error: 'Payment gateway is not available',
          errorCode: 'GATEWAY_UNAVAILABLE',
        };
      }

      // 5. Save batch to repository
      await this.paymentRepository.saveBatch(batch);

      // 6. Process batch through gateway
      const processingResult = await this.processBatch(batch);

      // 7. Update batch with results
      await this.updateBatchWithResults(batch, processingResult);

      // 8. Save updated batch
      await this.paymentRepository.saveBatch(batch);

      // 9. Return response
      return {
        success: processingResult.success,
        batchId: batch.getId().getValue(),
        transactionId: processingResult.transactionId,
        processedCount: processingResult.processedCount,
        totalAmount: batch.getTotalAmount().getAmount(),
        currency: request.currency,
        error: processingResult.error,
        errorCode: processingResult.errorCode,
        payments: this.createPaymentSummaries(batch.getPayments()),
      };
    } catch (error) {
      return {
        success: false,
        processedCount: 0,
        totalAmount: 0,
        currency: request.currency,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  private async validateRequest(
    request: MultipleTransferRequest
  ): Promise<{ valid: boolean; error?: string }> {
    // Validate from user
    try {
      ValidUsername.create(request.from);
    } catch {
      return { valid: false, error: 'Invalid sender username' };
    }

    // Validate transfers
    if (!request.transfers || request.transfers.length === 0) {
      return { valid: false, error: 'No transfers provided' };
    }

    if (request.transfers.length > 30) {
      return { valid: false, error: 'Too many transfers (maximum 30)' };
    }

    // Validate individual transfers
    for (const transfer of request.transfers) {
      if (!transfer.to || !ValidUsername.isValid(transfer.to)) {
        return { valid: false, error: `Invalid recipient: ${transfer.to}` };
      }

      if (!Number.isFinite(transfer.amount) || transfer.amount <= 0) {
        return { valid: false, error: `Invalid amount: ${transfer.amount}` };
      }

      if (transfer.amount < 0.001) {
        return { valid: false, error: 'Amount too small (minimum 0.001)' };
      }
    }

    // Check for duplicate recipients
    const recipients = request.transfers.map(t => t.to.toLowerCase());
    const uniqueRecipients = new Set(recipients);
    if (recipients.length !== uniqueRecipients.size) {
      return { valid: false, error: 'Duplicate recipients not allowed' };
    }

    return { valid: true };
  }

  private async createPayments(
    from: ValidUsername,
    transfers: TransferRequest[],
    currency: Currency
  ): Promise<Payment[]> {
    const payments: Payment[] = [];

    for (const transfer of transfers) {
      const payment = Payment.create({
        from,
        to: transfer.to,
        amount: transfer.amount,
        currency,
        memo: transfer.memo,
        type: PaymentType.MULTIPLE_TRANSFERS,
      });

      payments.push(payment);
    }

    return payments;
  }

  private async processBatch(
    batch: PaymentBatch
  ): Promise<import('../domain/ports/PaymentGateway').BatchResult> {
    try {
      batch.startProcessing();
      return await this.paymentGateway.processBatch(batch);
    } catch (error) {
      return {
        success: false,
        processedCount: 0,
        failedCount: batch.getPaymentCount(),
        totalAmount: batch.getTotalAmount().getAmount(),
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'PROCESSING_ERROR',
      };
    }
  }

  private async updateBatchWithResults(
    batch: PaymentBatch,
    result: import('../domain/ports/PaymentGateway').BatchResult
  ): Promise<void> {
    if (result.success && result.transactionId) {
      batch.markAsCompleted(result.transactionId);
    } else if (result.processedCount > 0 && result.failedCount > 0) {
      // Partial success - would need more detailed result to mark individual payments
      const completedPayments = batch.getPayments().slice(0, result.processedCount);
      const failedPayments = batch.getPayments().slice(result.processedCount);
      batch.markAsPartiallyFailed(completedPayments, failedPayments, result.transactionId);
    } else {
      batch.markAsFailed(result.error || 'Transaction failed');
    }
  }

  private createPaymentSummaries(payments: readonly Payment[]): PaymentSummary[] {
    return payments.map(payment => ({
      to: payment.getTo().getValue(),
      amount: payment.getAmount().getAmount(),
      status: payment.getStatus(),
      error: payment.getErrorMessage(),
    }));
  }
}
