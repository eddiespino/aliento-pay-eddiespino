/**
 * ⛓️ HIVE DATA GATEWAY PORT
 *
 * Port interface for Hive blockchain data access.
 * Abstracts delegation, curation, and account data retrieval.
 */

import { ValidUsername } from '../../../authentication/domain/value-objects/ValidUsername';

export interface HiveDataGateway {
  /**
   * Get account information from Hive blockchain
   */
  getAccount(username: ValidUsername): Promise<HiveAccountData | null>;

  /**
   * Get delegation information
   */
  getDelegations(
    username: ValidUsername,
    options?: DelegationQueryOptions
  ): Promise<DelegationData[]>;

  /**
   * Get curation rewards for a period
   */
  getCurationRewards(
    username: ValidUsername,
    options?: CurationQueryOptions
  ): Promise<CurationRewardData[]>;

  /**
   * Get global properties (for VESTS to HP conversion)
   */
  getGlobalProperties(): Promise<HiveGlobalProperties>;

  /**
   * Convert VESTS to HP
   */
  vestsToHP(vests: number, globalProps?: HiveGlobalProperties): Promise<number>;

  /**
   * Get transaction information
   */
  getTransaction(transactionId: string): Promise<HiveTransaction | null>;

  /**
   * Get account transaction history
   */
  getAccountHistory(
    username: ValidUsername,
    options?: HistoryQueryOptions
  ): Promise<HiveTransaction[]>;
}

export interface HiveAccountData {
  readonly id: number;
  readonly name: string;
  readonly reputation: number;
  readonly created: Date;
  readonly hiveBalance: number;
  readonly hbdBalance: number;
  readonly vestingShares: number; // VESTS
  readonly delegatedVestingShares: number; // VESTS
  readonly receivedVestingShares: number; // VESTS
  readonly personalHP: number; // Calculated HP
  readonly incomingHP: number; // Received delegations
  readonly outgoingHP: number; // Delegated to others
  readonly postingMetadata?: {
    readonly profile?: {
      readonly name?: string;
      readonly about?: string;
      readonly profileImage?: string;
      readonly coverImage?: string;
      readonly website?: string;
      readonly location?: string;
    };
  };
}

export interface DelegationData {
  readonly delegator: string;
  readonly delegatee: string;
  readonly vests: number;
  readonly hp: number;
  readonly timestamp: Date;
  readonly blockNumber: number;
  readonly transactionId: string;
}

export interface CurationRewardData {
  readonly operationId: string;
  readonly curator: string;
  readonly author: string;
  readonly permlink: string;
  readonly timestamp: Date;
  readonly blockNumber: number;
  readonly transactionId: string;
  readonly rewardVests: number;
  readonly rewardHP: number;
}

export interface HiveGlobalProperties {
  readonly totalVestingFund: number; // HIVE
  readonly totalVestingShares: number; // VESTS
  readonly timestamp: Date;
}

export interface HiveTransaction {
  readonly transactionId: string;
  readonly blockNumber: number;
  readonly timestamp: Date;
  readonly operations: HiveOperation[];
}

export interface HiveOperation {
  readonly type: string;
  readonly data: Record<string, any>;
}

export interface DelegationQueryOptions {
  readonly type?: 'incoming' | 'outgoing' | 'all';
  readonly minHP?: number;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

export interface CurationQueryOptions {
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly minReward?: number;
  readonly limit?: number;
  readonly offset?: number;
}

export interface HistoryQueryOptions {
  readonly operationTypes?: string[];
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Hive data gateway errors
 */
export abstract class HiveDataGatewayError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'HiveDataGatewayError';
  }
}

export class HiveNodeUnavailableError extends HiveDataGatewayError {
  constructor() {
    super('Hive node is not available', 'NODE_UNAVAILABLE');
  }
}

export class AccountNotFoundError extends HiveDataGatewayError {
  constructor(username: string) {
    super(`Account not found: ${username}`, 'ACCOUNT_NOT_FOUND');
  }
}

export class TransactionNotFoundError extends HiveDataGatewayError {
  constructor(transactionId: string) {
    super(`Transaction not found: ${transactionId}`, 'TRANSACTION_NOT_FOUND');
  }
}

export class HiveDataFetchError extends HiveDataGatewayError {
  public readonly cause?: Error;

  constructor(operation: string, cause?: Error) {
    super(`Failed to fetch Hive data during ${operation}: ${cause?.message}`, 'DATA_FETCH_ERROR');
    this.cause = cause;
  }
}

export class RateLimitError extends HiveDataGatewayError {
  constructor(retryAfter?: number) {
    super(
      `Rate limit exceeded${retryAfter ? `, retry after ${retryAfter}ms` : ''}`,
      'RATE_LIMIT_EXCEEDED'
    );
  }
}
