/**
 * Enhanced Keychain Service with improved type safety and error handling
 * Following TypeScript best practices and clean architecture principles
 */

import type {
  HiveCurrency,
  HiveKeychainInstance,
  KeychainBroadcastResponse,
  KeychainCallback,
  KeychainError,
  KeychainOperationResult,
  KeychainResponse,
  KeychainSignResponse,
  KeychainTransferResponse,
} from '../types/keychain';

import type { HiveOperation, TransferOperationData } from '../domain/models/Payment';

import {
  createKeychainInvalidOperationError,
  createKeychainNotAvailableError,
  isKeychainAvailable,
  KEYCHAIN_RETRY_ATTEMPTS,
  KEYCHAIN_RETRY_DELAY_MS,
  KEYCHAIN_TIMEOUT_MS,
  KeychainKeyType,
} from '../types/keychain';

/**
 * Enhanced Keychain Service class with proper error handling and type safety
 */
export class KeychainService {
  private readonly timeout: number;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  constructor(
    timeout: number = KEYCHAIN_TIMEOUT_MS,
    retryAttempts: number = KEYCHAIN_RETRY_ATTEMPTS,
    retryDelay: number = KEYCHAIN_RETRY_DELAY_MS
  ) {
    this.timeout = timeout;
    this.retryAttempts = retryAttempts;
    this.retryDelay = retryDelay;
  }

  /**
   * Check if Keychain is available
   */
  isAvailable(): boolean {
    return isKeychainAvailable();
  }

  /**
   * Get Keychain instance
   */
  private getKeychainInstance(): HiveKeychainInstance {
    if (!this.isAvailable()) {
      throw createKeychainNotAvailableError();
    }
    return window.hive_keychain!;
  }

  /**
   * Execute a Keychain operation with timeout and retry logic
   */
  private async executeWithRetry<T extends KeychainResponse>(
    operation: () => Promise<T>,
    attempts: number = this.retryAttempts
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempts > 1) {
        await this.delay(this.retryDelay);
        return this.executeWithRetry(operation, attempts - 1);
      }
      throw error;
    }
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a promise wrapper for Keychain callbacks with timeout
   */
  private createPromiseWrapper<T extends KeychainResponse>(
    operation: (callback: KeychainCallback<T>) => void,
    timeout: number = this.timeout
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Keychain operation timed out after ${timeout}ms`));
      }, timeout);

      const callback: KeychainCallback<T> = (response: T) => {
        clearTimeout(timeoutId);

        if (response.success) {
          resolve(response);
        } else {
          const error = response.error || response.message || 'Unknown Keychain error';
          reject(
            createKeychainInvalidOperationError({
              originalError: error,
              response,
            })
          );
        }
      };

      try {
        operation(callback);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Request broadcast operation
   */
  async requestBroadcast(
    username: string,
    operations: readonly HiveOperation<TransferOperationData>[],
    keyType: KeychainKeyType = KeychainKeyType.Active
  ): KeychainOperationResult<KeychainBroadcastResponse> {
    const keychain = this.getKeychainInstance();

    return this.executeWithRetry(() =>
      this.createPromiseWrapper<KeychainBroadcastResponse>(callback =>
        keychain.requestBroadcast(username, operations, keyType, callback)
      )
    );
  }

  /**
   * Request sign buffer operation
   */
  async requestSignBuffer(
    username: string,
    message: string,
    keyType: KeychainKeyType = KeychainKeyType.Posting
  ): KeychainOperationResult<KeychainSignResponse> {
    const keychain = this.getKeychainInstance();

    return this.executeWithRetry(() =>
      this.createPromiseWrapper<KeychainSignResponse>(callback =>
        keychain.requestSignBuffer(username, message, keyType, callback)
      )
    );
  }

  /**
   * Request transfer operation
   */
  async requestTransfer(
    username: string,
    to: string,
    amount: string,
    memo: string,
    currency: HiveCurrency = 'HIVE'
  ): KeychainOperationResult<KeychainTransferResponse> {
    const keychain = this.getKeychainInstance();

    return this.executeWithRetry(() =>
      this.createPromiseWrapper<KeychainTransferResponse>(callback =>
        keychain.requestTransfer(username, to, amount, memo, currency, callback)
      )
    );
  }

  /**
   * Build transfer operations from payment data
   */
  buildTransferOperations(
    payments: ReadonlyArray<{
      readonly to: string;
      readonly amount: string;
      readonly memo?: string;
    }>,
    fromAccount: string,
    defaultMemo: string = 'Payment from Aliento.pay'
  ): readonly HiveOperation<TransferOperationData>[] {
    return payments.map(
      payment =>
        [
          'transfer',
          {
            from: fromAccount,
            to: payment.to,
            amount: payment.amount,
            memo: payment.memo || defaultMemo,
          },
        ] as const
    );
  }

  /**
   * Execute multiple transfers using broadcast
   */
  async executeMultipleTransfers(
    username: string,
    payments: ReadonlyArray<{
      readonly to: string;
      readonly amount: string;
      readonly memo?: string;
    }>,
    keyType: KeychainKeyType = KeychainKeyType.Active
  ): KeychainOperationResult<KeychainBroadcastResponse> {
    const operations = this.buildTransferOperations(payments, username);
    return this.requestBroadcast(username, operations, keyType);
  }

  /**
   * Validate payment data before processing
   */
  validatePayments(
    payments: ReadonlyArray<{
      readonly to: string;
      readonly amount: string;
      readonly memo?: string;
    }>
  ): { readonly valid: boolean; readonly errors: readonly string[] } {
    const errors: string[] = [];

    if (!Array.isArray(payments) || payments.length === 0) {
      errors.push('Payments array cannot be empty');
      return { valid: false, errors };
    }

    for (const [index, payment] of payments.entries()) {
      if (!payment.to || typeof payment.to !== 'string') {
        errors.push(`Payment ${index + 1}: Invalid recipient`);
      }

      if (!payment.amount || typeof payment.amount !== 'string') {
        errors.push(`Payment ${index + 1}: Invalid amount`);
      } else {
        const amount = parseFloat(payment.amount);
        if (isNaN(amount) || amount <= 0) {
          errors.push(`Payment ${index + 1}: Amount must be a positive number`);
        }
      }

      if (payment.memo && typeof payment.memo !== 'string') {
        errors.push(`Payment ${index + 1}: Invalid memo format`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get current user from session storage
   */
  getCurrentUser(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authenticated_user');
  }

  /**
   * Save user session
   */
  saveUserSession(username: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authenticated_user', username);
    }
  }

  /**
   * Clear user session
   */
  clearUserSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authenticated_user');
    }
  }
}

// Export singleton instance
export const keychainService = new KeychainService();

// Export types for external use
export type {
  HiveCurrency,
  KeychainBroadcastResponse,
  KeychainError,
  KeychainKeyType,
  KeychainSignResponse,
  KeychainTransferResponse,
};
