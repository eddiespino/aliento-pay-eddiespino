/**
 * Earnings Calculator for Aliento Delegations
 * APR: 8.5% (configurable)
 */

export const DEFAULT_APR = 8.5; // Annual Percentage Rate
export const MINIMUM_DELEGATION = 1; // Minimum HP to delegate

export interface EarningsEstimate {
  dailyHive: number;
  weeklyHive: number;
  monthlyHive: number;
  yearlyHive: number;
}

/**
 * Calculate earnings based on delegated HP amount
 * @param hpAmount - Amount of Hive Power to delegate
 * @param apr - Annual Percentage Rate (default 8.5%)
 * @returns Earnings estimates for different time periods
 */
export function calculateEarnings(
  hpAmount: number,
  apr: number = DEFAULT_APR
): EarningsEstimate {
  // Validate input
  if (hpAmount < MINIMUM_DELEGATION) {
    return {
      dailyHive: 0,
      weeklyHive: 0,
      monthlyHive: 0,
      yearlyHive: 0,
    };
  }

  // Calculate yearly earnings
  const yearlyHive = (hpAmount * apr) / 100;

  // Calculate other periods
  const dailyHive = yearlyHive / 365;
  const weeklyHive = dailyHive * 7;
  const monthlyHive = yearlyHive / 12;

  return {
    dailyHive: Number(dailyHive.toFixed(3)),
    weeklyHive: Number(weeklyHive.toFixed(3)),
    monthlyHive: Number(monthlyHive.toFixed(3)),
    yearlyHive: Number(yearlyHive.toFixed(3)),
  };
}

/**
 * Convert HIVE to HBD (simplified - uses 1:1 ratio, can be enhanced with real price data)
 * @param hiveAmount - Amount in HIVE
 * @param hiveToHbdRate - Conversion rate (default 1.0)
 * @returns Amount in HBD
 */
export function convertHiveToHbd(
  hiveAmount: number,
  hiveToHbdRate: number = 1.0
): number {
  return Number((hiveAmount * hiveToHbdRate).toFixed(3));
}

/**
 * Payment preference types
 */
export type PaymentPreference = 'HIVE' | 'HBD' | 'HP' | 'DONATE';

/**
 * Delegator preference data structure
 */
export interface DelegatorPreference {
  username: string;
  paymentType: PaymentPreference;
  delegatedHP: number;
  updatedAt: string; // ISO timestamp
}

/**
 * Validate payment preference
 */
export function isValidPaymentPreference(
  value: string
): value is PaymentPreference {
  return ['HIVE', 'HBD', 'HP', 'DONATE'].includes(value);
}

/**
 * Format earnings display
 */
export function formatEarnings(amount: number, currency: string = 'HIVE'): string {
  return `${amount.toFixed(3)} ${currency}`;
}

/**
 * Calculate percentage of total pool
 */
export function calculatePoolPercentage(
  userHP: number,
  totalPoolHP: number
): number {
  if (totalPoolHP === 0) return 0;
  return Number(((userHP / totalPoolHP) * 100).toFixed(2));
}
