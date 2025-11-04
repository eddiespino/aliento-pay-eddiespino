/**
 * 🧮 CALCULATE PAYMENT DISTRIBUTION USE CASE
 *
 * Calculates payment distributions based on delegations and curation rewards.
 * Provides detailed calculation results with statistics and validation.
 */

import { Currency } from '../domain/value-objects/PaymentAmount';
import { ValidUsername } from '../../authentication/domain/value-objects/ValidUsername';

import type {
  PaymentCalculationService,
  DelegationPaymentParams,
  CurationPaymentParams,
  ProportionalDistributionParams,
  DelegationPaymentResult,
  CurationPaymentResult,
  ProportionalDistribution,
  CalculatedPayment,
  TimePeriod,
} from '../domain/ports/PaymentCalculationService';

import type { HiveDataGateway } from '../domain/ports/HiveDataGateway';

export interface CalculationRequest {
  readonly type: 'delegation' | 'curation' | 'proportional';
  readonly delegator?: string;
  readonly curator?: string;
  readonly totalAmount: number;
  readonly currency: Currency;
  readonly parameters: CalculationParameters;
}

export interface CalculationParameters {
  readonly minimumHP?: number;
  readonly excludedUsers?: string[];
  readonly timePeriod?: string; // '24h', '7d', '30d'
  readonly roundingPrecision?: number;
  readonly basePercentage?: number;
  readonly minPercentage?: number;
  readonly maxPercentage?: number;
  readonly recipients?: RecipientWeight[];
  readonly minimumPayment?: number;
}

export interface RecipientWeight {
  readonly recipient: string;
  readonly weight: number;
  readonly metadata?: Record<string, any>;
}

export interface CalculationResponse {
  readonly success: boolean;
  readonly type: 'delegation' | 'curation' | 'proportional';
  readonly payments: PaymentDistribution[];
  readonly summary: DistributionSummary;
  readonly config: CalculationParameters;
  readonly error?: string;
  readonly errorCode?: string;
}

export interface PaymentDistribution {
  readonly recipient: string;
  readonly amount: number;
  readonly currency: Currency;
  readonly weight: number;
  readonly percentage: number;
  readonly memo: string;
}

export interface DistributionSummary {
  readonly totalAmount: number;
  readonly totalDistributed: number;
  readonly remainingAmount: number;
  readonly recipientCount: number;
  readonly averagePayment: number;
  readonly minPayment: number;
  readonly maxPayment: number;
  readonly medianPayment: number;
  readonly excludedCount?: number;
  readonly distributionRatio?: number;
}

export class CalculatePaymentDistributionUseCase {
  constructor(
    private readonly calculationService: PaymentCalculationService,
    private readonly hiveDataGateway: HiveDataGateway
  ) {}

  async execute(request: CalculationRequest): Promise<CalculationResponse> {
    try {
      // 1. Validate request
      const validationResult = await this.validateRequest(request);
      if (!validationResult.valid) {
        return {
          success: false,
          type: request.type,
          payments: [],
          summary: this.createEmptySummary(),
          config: request.parameters,
          error: validationResult.error,
          errorCode: 'INVALID_REQUEST',
        };
      }

      // 2. Calculate based on type
      let calculationResult:
        | DelegationPaymentResult
        | CurationPaymentResult
        | ProportionalDistribution;

      switch (request.type) {
        case 'delegation':
          calculationResult = await this.calculateDelegationDistribution(request);
          break;
        case 'curation':
          calculationResult = await this.calculateCurationDistribution(request);
          break;
        case 'proportional':
          calculationResult = await this.calculateProportionalDistribution(request);
          break;
        default:
          throw new Error(`Unsupported calculation type: ${request.type}`);
      }

      // 3. Convert to response format
      const payments = this.convertToPaymentDistributions(
        calculationResult.payments,
        request.currency
      );
      const summary = this.createDistributionSummary(calculationResult, request);

      return {
        success: true,
        type: request.type,
        payments,
        summary,
        config: request.parameters,
      };
    } catch (error) {
      return {
        success: false,
        type: request.type,
        payments: [],
        summary: this.createEmptySummary(),
        config: request.parameters,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: 'CALCULATION_ERROR',
      };
    }
  }

  private async validateRequest(
    request: CalculationRequest
  ): Promise<{ valid: boolean; error?: string }> {
    // Validate calculation type
    if (!['delegation', 'curation', 'proportional'].includes(request.type)) {
      return { valid: false, error: 'Invalid calculation type' };
    }

    // Validate amount
    if (!Number.isFinite(request.totalAmount) || request.totalAmount <= 0) {
      return { valid: false, error: 'Invalid total amount' };
    }

    if (request.totalAmount > 100000) {
      return { valid: false, error: 'Total amount too large (maximum 100,000)' };
    }

    // Validate currency
    if (!Object.values(Currency).includes(request.currency)) {
      return { valid: false, error: 'Invalid currency' };
    }

    // Type-specific validation
    switch (request.type) {
      case 'delegation':
        if (!request.delegator) {
          return { valid: false, error: 'Delegator required for delegation calculation' };
        }
        if (!ValidUsername.isValid(request.delegator)) {
          return { valid: false, error: 'Invalid delegator username' };
        }
        break;

      case 'curation':
        if (!request.curator) {
          return { valid: false, error: 'Curator required for curation calculation' };
        }
        if (!ValidUsername.isValid(request.curator)) {
          return { valid: false, error: 'Invalid curator username' };
        }
        break;

      case 'proportional':
        if (!request.parameters.recipients || request.parameters.recipients.length === 0) {
          return { valid: false, error: 'Recipients required for proportional calculation' };
        }
        break;
    }

    // Validate parameters
    const params = request.parameters;
    if (params.minimumHP !== undefined && (params.minimumHP < 0 || params.minimumHP > 10000)) {
      return { valid: false, error: 'Invalid minimum HP value' };
    }

    if (
      params.basePercentage !== undefined &&
      (params.basePercentage < 0 || params.basePercentage > 100)
    ) {
      return { valid: false, error: 'Invalid base percentage' };
    }

    return { valid: true };
  }

  private async calculateDelegationDistribution(
    request: CalculationRequest
  ): Promise<DelegationPaymentResult> {
    const timePeriod = await this.createTimePeriod(request.parameters.timePeriod || '30d');

    const params: DelegationPaymentParams = {
      delegator: ValidUsername.create(request.delegator!),
      totalAmount: {
        getAmount: () => request.totalAmount,
        getCurrency: () => request.currency,
      } as any,
      minimumHP: request.parameters.minimumHP || 50,
      excludedUsers: request.parameters.excludedUsers || [],
      timePeriod,
      roundingPrecision: request.parameters.roundingPrecision || 3,
    };

    return await this.calculationService.calculateDelegationPayments(params);
  }

  private async calculateCurationDistribution(
    request: CalculationRequest
  ): Promise<CurationPaymentResult> {
    const timePeriod = await this.createTimePeriod(request.parameters.timePeriod || '30d');

    const params: CurationPaymentParams = {
      curator: ValidUsername.create(request.curator!),
      basePercentage: request.parameters.basePercentage || 10,
      minPercentage: request.parameters.minPercentage || 5,
      maxPercentage: request.parameters.maxPercentage || 20,
      timePeriod,
      currency: request.currency,
    };

    return await this.calculationService.calculateCurationPayments(params);
  }

  private async calculateProportionalDistribution(
    request: CalculationRequest
  ): Promise<ProportionalDistribution> {
    const params: ProportionalDistributionParams = {
      totalAmount: {
        getAmount: () => request.totalAmount,
        getCurrency: () => request.currency,
      } as any,
      recipients: request.parameters.recipients!,
      minimumPayment: {
        getAmount: () => request.parameters.minimumPayment || 0.001,
        getCurrency: () => request.currency,
      } as any,
      roundingPrecision: request.parameters.roundingPrecision || 3,
    };

    return await this.calculationService.calculateProportionalDistribution(params);
  }

  private async createTimePeriod(period: string): Promise<TimePeriod> {
    const now = new Date();
    let durationHours: number;
    let startDate: Date;

    switch (period) {
      case '24h':
        durationHours = 24;
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        durationHours = 7 * 24;
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        durationHours = 30 * 24;
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        throw new Error(`Unsupported time period: ${period}`);
    }

    return {
      name: period,
      startDate,
      endDate: now,
      durationHours,
    };
  }

  private convertToPaymentDistributions(
    payments: CalculatedPayment[],
    currency: Currency
  ): PaymentDistribution[] {
    return payments.map(payment => ({
      recipient: payment.recipient,
      amount: payment.amount.getAmount(),
      currency,
      weight: payment.weight,
      percentage: payment.percentage,
      memo: payment.memo,
    }));
  }

  private createDistributionSummary(
    result: DelegationPaymentResult | CurationPaymentResult | ProportionalDistribution,
    request: CalculationRequest
  ): DistributionSummary {
    const amounts = result.payments.map(p => p.amount.getAmount()).sort((a, b) => a - b);
    const total = amounts.reduce((sum, amount) => sum + amount, 0);

    const median =
      amounts.length % 2 === 0
        ? (amounts[Math.floor(amounts.length / 2) - 1] + amounts[Math.floor(amounts.length / 2)]) /
          2
        : amounts[Math.floor(amounts.length / 2)];

    const summary: DistributionSummary = {
      totalAmount: request.totalAmount,
      totalDistributed: total,
      remainingAmount: request.totalAmount - total,
      recipientCount: result.payments.length,
      averagePayment: result.payments.length > 0 ? total / result.payments.length : 0,
      minPayment: amounts.length > 0 ? amounts[0] : 0,
      maxPayment: amounts.length > 0 ? amounts[amounts.length - 1] : 0,
      medianPayment: median,
    };

    // Add type-specific properties
    if ('excludedCount' in result) {
      summary.excludedCount = result.excludedCount;
    }
    if ('distributionRatio' in result) {
      summary.distributionRatio = result.distributionRatio;
    }

    return summary;
  }

  private createEmptySummary(): DistributionSummary {
    return {
      totalAmount: 0,
      totalDistributed: 0,
      remainingAmount: 0,
      recipientCount: 0,
      averagePayment: 0,
      minPayment: 0,
      maxPayment: 0,
      medianPayment: 0,
    };
  }
}
