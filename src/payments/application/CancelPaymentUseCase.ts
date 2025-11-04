/**
 * ❌ CANCEL PAYMENT USE CASE
 */

import { PaymentId } from '../domain/value-objects/PaymentId';
import type { PaymentRepository } from '../domain/ports/PaymentRepository';
import type { PaymentGateway } from '../domain/ports/PaymentGateway';

export interface CancelRequest {
  readonly paymentId: string;
  readonly reason?: string;
}

export interface CancelResponse {
  readonly success: boolean;
  readonly paymentId: string;
  readonly error?: string;
}

export class CancelPaymentUseCase {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentGateway: PaymentGateway
  ) {}

  async execute(request: CancelRequest): Promise<CancelResponse> {
    try {
      const paymentId = PaymentId.create(request.paymentId);
      const payment = await this.paymentRepository.findById(paymentId);

      if (!payment) {
        return {
          success: false,
          paymentId: request.paymentId,
          error: 'Payment not found',
        };
      }

      payment.cancel();
      await this.paymentRepository.save(payment);

      return {
        success: true,
        paymentId: request.paymentId,
      };
    } catch (error) {
      return {
        success: false,
        paymentId: request.paymentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
