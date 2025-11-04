/**
 * Complete Hive Keychain type definitions
 * Based on official Hive Keychain SDK and best practices
 * Uses official types from keychain-sdk and hive-keychain-commons
 */

import type { HiveOperation, TransferOperationData } from '../domain/models/Payment';
// Global window extension for Keychain
declare global {
  interface Window {
    hive_keychain?: HiveKeychainInstance;
  }
}

// Mantener enum para compatibilidad con código existente que lo usa como valor
export enum KeychainKeyType {
  Posting = 'posting',
  Active = 'active',
  Memo = 'memo',
  Owner = 'owner',
}

// Basic response types
export interface KeychainResponse {
  success: boolean;
  result?: any;
  error?: string;
  message?: string;
}

export type KeychainBroadcastResponse = KeychainResponse;
export type KeychainSignResponse = KeychainResponse;
export type KeychainTransferResponse = KeychainResponse;

// Main Keychain interface
export interface HiveKeychainInstance {
  requestBroadcast(
    username: string,
    operations: readonly HiveOperation<TransferOperationData>[],
    keyType: KeychainKeyType,
    callback: (response: KeychainBroadcastResponse) => void
  ): void;

  requestSignBuffer(
    username: string,
    message: string,
    keyType: KeychainKeyType,
    callback: (response: KeychainSignResponse) => void
  ): void;

  requestSignTx(
    username: string,
    tx: Record<string, unknown>,
    keyType: KeychainKeyType,
    callback: (response: KeychainSignResponse) => void
  ): void;

  requestTransfer(
    username: string,
    to: string,
    amount: string,
    memo: string,
    currency: 'HIVE' | 'HBD',
    callback: (response: KeychainTransferResponse) => void
  ): void;

  requestPowerUp(
    username: string,
    to: string,
    amount: string,
    callback: (response: KeychainResponse) => void
  ): void;

  requestPowerDown(
    username: string,
    amount: string,
    callback: (response: KeychainResponse) => void
  ): void;

  requestAddAccount(
    username: string,
    keys: Partial<Record<KeychainKeyType, string>>,
    callback: (response: KeychainResponse) => void
  ): void;

  requestRemoveAccount(username: string, callback: (response: KeychainResponse) => void): void;
}

// Request options interfaces
export interface KeychainBroadcastOptions {
  readonly username: string;
  readonly operations: readonly HiveOperation<TransferOperationData>[];
  readonly keyType: KeychainKeyType;
  readonly callback: (response: KeychainBroadcastResponse) => void;
}

export interface KeychainSignOptions {
  readonly username: string;
  readonly message: string;
  readonly keyType: KeychainKeyType;
  readonly callback: (response: KeychainSignResponse) => void;
}

export interface KeychainTransferOptions {
  readonly username: string;
  readonly to: string;
  readonly amount: string;
  readonly memo: string;
  readonly currency: 'HIVE' | 'HBD';
  readonly keyType: KeychainKeyType;
  readonly callback: (response: KeychainTransferResponse) => void;
}

// Utility types for better type safety
export type KeychainCallback<T extends KeychainResponse = KeychainResponse> = (response: T) => void;

export type KeychainOperationResult<T extends KeychainResponse = KeychainResponse> = Promise<T>;

// Error types
export interface KeychainError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;
}

export interface KeychainNotAvailableError extends KeychainError {
  readonly code: 'KEYCHAIN_NOT_AVAILABLE';
}

export interface KeychainUserCancelledError extends KeychainError {
  readonly code: 'USER_CANCELLED';
}

export interface KeychainInvalidOperationError extends KeychainError {
  readonly code: 'INVALID_OPERATION';
  readonly details?: Record<string, unknown>;
}

// Type guards
export const isKeychainAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!window.hive_keychain;
};

export const isKeychainBroadcastResponse = (
  response: KeychainResponse
): response is KeychainBroadcastResponse => {
  return (
    response.success &&
    response.result !== undefined &&
    response.result !== null &&
    typeof response.result === 'object' &&
    'id' in response.result &&
    'tx_id' in response.result
  );
};

export const isKeychainSignResponse = (
  response: KeychainResponse
): response is KeychainSignResponse => {
  return response.success && typeof response.result === 'string';
};

export const isKeychainError = (error: unknown): error is KeychainError => {
  return error instanceof Error && 'code' in error;
};

// Utility functions
export const createKeychainError = (
  code: string,
  message: string,
  details?: Record<string, unknown>
): KeychainError => ({
  name: 'KeychainError',
  message,
  code,
  ...(details && { details }),
});

export const createKeychainNotAvailableError = (): KeychainNotAvailableError => ({
  name: 'KeychainNotAvailableError',
  message: 'Hive Keychain is not available. Please install the browser extension.',
  code: 'KEYCHAIN_NOT_AVAILABLE',
});

export const createKeychainUserCancelledError = (): KeychainUserCancelledError => ({
  name: 'KeychainUserCancelledError',
  message: 'User cancelled the operation.',
  code: 'USER_CANCELLED',
});

export const createKeychainInvalidOperationError = (
  details?: Record<string, unknown>
): KeychainInvalidOperationError => ({
  name: 'KeychainInvalidOperationError',
  message: 'Invalid operation parameters.',
  code: 'INVALID_OPERATION',
  ...(details && { details }),
});

// Constants
export const KEYCHAIN_TIMEOUT_MS = 30000; // 30 seconds
export const KEYCHAIN_RETRY_ATTEMPTS = 3;
export const KEYCHAIN_RETRY_DELAY_MS = 1000;

// Supported currencies
export const HIVE_CURRENCIES = ['HIVE', 'HBD'] as const;
export type HiveCurrency = (typeof HIVE_CURRENCIES)[number];

// Keychain version information
export interface KeychainVersion {
  readonly version: string;
  readonly features: readonly string[];
  readonly deprecated?: readonly string[];
}
