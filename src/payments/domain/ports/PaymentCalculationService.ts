/**
 * 🧮 PAYMENT CALCULATION SERVICE PORT
 *
 * Port interface for payment calculation logic.
 * Abstracts curation rewards and delegation-based calculations.
 */

import { PaymentAmount, Currency } from '../value-objects/PaymentAmount';
import { ValidUsername } from '../../../authentication/domain/value-objects/ValidUsername';

export interface PaymentCalculationService {
  /**
   * Calculate payments based on HP delegations
   */
  calculateDelegationPayments(params: DelegationPaymentParams): Promise<DelegationPaymentResult>;

  /**
   * Calculate dynamic payments based on curation rewards
   */
  calculateCurationPayments(params: CurationPaymentParams): Promise<CurationPaymentResult>;

  /**
   * Calculate proportional distribution
   */
  calculateProportionalDistribution(
    params: ProportionalDistributionParams
  ): Promise<ProportionalDistribution>;

  /**
   * Get payment statistics for a calculation
   */
  getCalculationStats(payments: CalculatedPayment[]): CalculationStats;

  /**
   * Validate payment calculation parameters
   */
  validateCalculationParams(params: any): ValidationResult;
}

export interface DelegationPaymentParams {
  readonly delegator: ValidUsername;
  readonly totalAmount: PaymentAmount;
  readonly minimumHP: number;
  readonly excludedUsers: string[];
  readonly timePeriod: TimePeriod;
  readonly roundingPrecision: number;
}

export interface CurationPaymentParams {
  readonly curator: ValidUsername;
  readonly basePercentage: number;
  readonly minPercentage: number;
  readonly maxPercentage: number;
  readonly timePeriod: TimePeriod;
  readonly currency: Currency;
}

export interface ProportionalDistributionParams {
  readonly totalAmount: PaymentAmount;
  readonly recipients: RecipientWeight[];
  readonly minimumPayment: PaymentAmount;
  readonly roundingPrecision: number;
}

export interface DelegationPaymentResult {
  readonly payments: CalculatedPayment[];
  readonly totalCalculated: PaymentAmount;
  readonly totalDelegated: number; // HP
  readonly averagePayment: PaymentAmount;
  readonly stats: CalculationStats;
  readonly excludedCount: number;
  readonly config: DelegationPaymentParams;
}

export interface CurationPaymentResult {
  readonly payments: CalculatedPayment[];
  readonly actualPercentage: number;
  readonly curationStats: CurationPeriodStats;
  readonly totalDistributed: PaymentAmount;
  readonly config: CurationPaymentParams;
}

export interface ProportionalDistribution {
  readonly payments: CalculatedPayment[];
  readonly totalDistributed: PaymentAmount;
  readonly remainingAmount: PaymentAmount;
  readonly distributionRatio: number;
  readonly stats: CalculationStats;
}

export interface CalculatedPayment {
  readonly recipient: string;
  readonly amount: PaymentAmount;
  readonly weight: number; // HP or percentage
  readonly percentage: number; // of total
  readonly memo: string;
}

export interface RecipientWeight {
  readonly recipient: string;
  readonly weight: number;
  readonly metadata?: Record<string, any>;
}

export interface CalculationStats {
  readonly count: number;
  readonly min: PaymentAmount;
  readonly max: PaymentAmount;
  readonly average: PaymentAmount;
  readonly median: PaymentAmount;
  readonly standardDeviation: number;
  readonly totalAmount: PaymentAmount;
}

export interface CurationPeriodStats {
  readonly period: TimePeriod;
  readonly totalRewards: number; // HP
  readonly rewardCount: number;
  readonly averageReward: number;
  readonly bestDay: Date | null;
  readonly worstDay: Date | null;
}

export interface TimePeriod {
  readonly name: string; // '24h', '7d', '30d'
  readonly startDate: Date;
  readonly endDate: Date;
  readonly durationHours: number;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export interface ValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

/**
 * Payment calculation errors
 */
export abstract class PaymentCalculationError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'PaymentCalculationError';
  }
}

export class InvalidCalculationParamsError extends PaymentCalculationError {
  constructor(errors: ValidationError[]) {
    const errorMessages = errors.map(e => `${e.field}: ${e.message}`).join(', ');
    super(`Invalid calculation parameters: ${errorMessages}`, 'INVALID_PARAMS');
  }
}

export class InsufficientDataError extends PaymentCalculationError {
  constructor(dataType: string) {
    super(`Insufficient data for calculation: ${dataType}`, 'INSUFFICIENT_DATA');
  }
}

export class CalculationOverflowError extends PaymentCalculationError {
  constructor(operation: string) {
    super(`Calculation overflow during ${operation}`, 'CALCULATION_OVERFLOW');
  }
}

export class ZeroTotalAmountError extends PaymentCalculationError {
  constructor() {
    super('Total amount for distribution cannot be zero', 'ZERO_TOTAL_AMOUNT');
  }
}
