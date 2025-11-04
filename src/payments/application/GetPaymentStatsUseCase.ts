/**
 * 📊 GET PAYMENT STATS USE CASE
 */

import { ValidUsername } from '../../authentication/domain/value-objects/ValidUsername';
import { Currency } from '../domain/value-objects/PaymentAmount';
import type { PaymentRepository, PaymentStats } from '../domain/ports/PaymentRepository';

export interface StatsRequest {
  readonly username?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly currency?: Currency;
}

export interface StatsResponse {
  readonly success: boolean;
  readonly stats: PaymentStats;
  readonly error?: string;
}

export class GetPaymentStatsUseCase {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async execute(request: StatsRequest): Promise<StatsResponse> {
    try {
      const dateRange =
        request.startDate || request.endDate
          ? {
              startDate: request.startDate || new Date(0),
              endDate: request.endDate || new Date(),
            }
          : undefined;

      const stats = await this.paymentRepository.getPaymentStats(dateRange);

      return { success: true, stats };
    } catch (error) {
      return {
        success: false,
        stats: {
          totalPayments: 0,
          totalAmount: 0,
          totalAmountHive: 0,
          totalAmountHbd: 0,
          pendingCount: 0,
          completedCount: 0,
          failedCount: 0,
          averageAmount: 0,
          largestPayment: 0,
          smallestPayment: 0,
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
