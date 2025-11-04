/**
 * 📜 GET PAYMENT HISTORY USE CASE
 *
 * Retrieves payment history for users with filtering and pagination.
 */

import { ValidUsername } from '../../authentication/domain/value-objects/ValidUsername';
import { PaymentStatus, PaymentType } from '../domain/entities/Payment';
import { Currency } from '../domain/value-objects/PaymentAmount';

import type { PaymentRepository, PaymentQueryOptions } from '../domain/ports/PaymentRepository';

export interface PaymentHistoryRequest {
  readonly username: string;
  readonly status?: PaymentStatus;
  readonly type?: PaymentType;
  readonly currency?: Currency;
  readonly limit?: number;
  readonly offset?: number;
  readonly startDate?: Date;
  readonly endDate?: Date;
}

export interface PaymentHistoryResponse {
  readonly success: boolean;
  readonly payments: PaymentHistoryItem[];
  readonly totalCount: number;
  readonly hasMore: boolean;
  readonly error?: string;
  readonly errorCode?: string;
}

export interface PaymentHistoryItem {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly amount: number;
  readonly currency: Currency;
  readonly memo: string;
  readonly type: PaymentType;
  readonly status: PaymentStatus;
  readonly createdAt: Date;
  readonly processedAt?: Date;
  readonly transactionId?: string;
  readonly errorMessage?: string;
}

export class GetPaymentHistoryUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(request: PaymentHistoryRequest): Promise<PaymentHistoryResponse> {
    try {
      // Validate username
      const username = ValidUsername.create(request.username);

      // Build query options
      const options: PaymentQueryOptions = {
        status: request.status,
        type: request.type,
        currency: request.currency,
        limit: Math.min(request.limit || 50, 100),
        offset: request.offset || 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      if (request.startDate || request.endDate) {
        options.dateRange = {
          startDate: request.startDate || new Date(0),
          endDate: request.endDate || new Date(),
        };
      }

      // Fetch payments and count
      const [payments, totalCount] = await Promise.all([
        this.paymentRepository.findByUser(username, options),
        this.paymentRepository.countByUser(username, request.status),
      ]);

      // Convert to response format
      const paymentItems: PaymentHistoryItem[] = payments.map(payment => ({
        id: payment.getId().getValue(),
        from: payment.getFrom().getValue(),
        to: payment.getTo().getValue(),
        amount: payment.getAmount().getAmount(),
        currency: payment.getAmount().getCurrency(),
        memo: payment.getMemo().getValue(),
        type: payment.getType(),
        status: payment.getStatus(),
        createdAt: payment.getCreatedAt(),
        processedAt: payment.getProcessedAt(),
        transactionId: payment.getTransactionId(),
        errorMessage: payment.getErrorMessage(),
      }));

      return {
        success: true,
        payments: paymentItems,
        totalCount,
        hasMore: (options.offset || 0) + paymentItems.length < totalCount,
      };
    } catch (error) {
      return {
        success: false,
        payments: [],
        totalCount: 0,
        hasMore: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'FETCH_ERROR',
      };
    }
  }
}
