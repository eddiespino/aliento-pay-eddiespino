/**
 * 💸 PROCESS SINGLE PAYMENT USE CASE
 *
 * Handles processing of individual payments.
 * Orchestrates payment validation, creation, and blockchain execution.
 */

import { Payment, PaymentType } from '../domain/entities/Payment';
import { PaymentAmount, Currency } from '../domain/value-objects/PaymentAmount';
import { ValidUsername } from '../../authentication/domain/value-objects/ValidUsername';

import type { PaymentRepository } from '../domain/ports/PaymentRepository';
import type { PaymentGateway } from '../domain/ports/PaymentGateway';

export interface SinglePaymentRequest {
  readonly from: string;
  readonly to: string;
  readonly amount: number;
  readonly currency: Currency;
  readonly memo?: string;
  readonly type?: PaymentType;
  readonly sessionToken?: string;
}

export interface SinglePaymentResponse {
  readonly success: boolean;
  readonly paymentId?: string;
  readonly transactionId?: string;
  readonly amount: number;
  readonly currency: Currency;
  readonly recipient: string;
  readonly error?: string;
  readonly errorCode?: string;
  readonly estimatedFee?: number;
  readonly blockNumber?: number;
}

export class ProcessSinglePaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentGateway: PaymentGateway
  ) {}

  async execute(request: SinglePaymentRequest): Promise<SinglePaymentResponse> {
    try {
      // 1. Validate request
      const validationResult = await this.validateRequest(request);
      if (!validationResult.valid) {
        return {
          success: false,
          amount: request.amount,
          currency: request.currency,
          recipient: request.to,
          error: validationResult.error,
          errorCode: 'INVALID_REQUEST',
        };
      }

      // 2. Create payment entity
      const from = ValidUsername.create(request.from);
      const payment = Payment.create({
        from,
        to: request.to,
        amount: request.amount,
        currency: request.currency,
        memo: request.memo,
        type: request.type || PaymentType.SINGLE_TRANSFER,
      });

      // 3. Check gateway availability
      if (!(await this.paymentGateway.isAvailable())) {
        return {
          success: false,
          paymentId: payment.getId().getValue(),
          amount: request.amount,
          currency: request.currency,
          recipient: request.to,
          error: 'Payment gateway is not available',
          errorCode: 'GATEWAY_UNAVAILABLE',
        };
      }

      // 4. Check account balance
      const balance = await this.paymentGateway.getBalance(from);
      const requiredAmount = payment.getAmount().getAmount();
      const availableAmount = request.currency === Currency.HIVE ? balance.hive : balance.hbd;

      if (availableAmount < requiredAmount) {
        payment.markAsFailed(
          `Insufficient balance: ${availableAmount} ${request.currency} available, ${requiredAmount} ${request.currency} required`
        );
        await this.paymentRepository.save(payment);

        return {
          success: false,
          paymentId: payment.getId().getValue(),
          amount: request.amount,
          currency: request.currency,
          recipient: request.to,
          error: 'Insufficient balance',
          errorCode: 'INSUFFICIENT_BALANCE',
        };
      }

      // 5. Estimate fees
      const estimatedFee = await this.paymentGateway.estimateFees(payment);

      // 6. Save payment to repository
      await this.paymentRepository.save(payment);

      // 7. Process payment through gateway
      payment.startProcessing();
      const processingResult = await this.paymentGateway.processPayment(payment);

      // 8. Update payment with results
      if (processingResult.success && processingResult.transactionId) {
        payment.markAsCompleted(processingResult.transactionId);
      } else {
        payment.markAsFailed(processingResult.error || 'Unknown error');
      }

      // 9. Save updated payment
      await this.paymentRepository.save(payment);

      // 10. Return response
      return {
        success: processingResult.success,
        paymentId: payment.getId().getValue(),
        transactionId: processingResult.transactionId,
        amount: request.amount,
        currency: request.currency,
        recipient: request.to,
        error: processingResult.error,
        errorCode: processingResult.errorCode,
        estimatedFee: estimatedFee.getAmount(),
        blockNumber: processingResult.blockNumber,
      };
    } catch (error) {
      return {
        success: false,
        amount: request.amount,
        currency: request.currency,
        recipient: request.to,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  private async validateRequest(
    request: SinglePaymentRequest
  ): Promise<{ valid: boolean; error?: string }> {
    // Validate from user
    try {
      ValidUsername.create(request.from);
    } catch {
      return { valid: false, error: 'Invalid sender username' };
    }

    // Validate to user
    if (!request.to || !ValidUsername.isValid(request.to)) {
      return { valid: false, error: 'Invalid recipient username' };
    }

    // Validate amount
    if (!Number.isFinite(request.amount) || request.amount <= 0) {
      return { valid: false, error: 'Invalid amount' };
    }

    if (request.amount < 0.001) {
      return { valid: false, error: 'Amount too small (minimum 0.001)' };
    }

    if (request.amount > 10000) {
      return { valid: false, error: 'Amount too large (maximum 10,000)' };
    }

    // Validate currency
    if (!Object.values(Currency).includes(request.currency)) {
      return { valid: false, error: 'Invalid currency' };
    }

    // Validate memo length
    if (request.memo && request.memo.length > 2048) {
      return { valid: false, error: 'Memo too long (maximum 2048 characters)' };
    }

    // Validate self-transfer
    if (request.from.toLowerCase() === request.to.toLowerCase()) {
      return { valid: false, error: 'Cannot send payment to yourself' };
    }

    return { valid: true };
  }
}
