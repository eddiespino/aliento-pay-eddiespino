/**
 * 🚀 SERVICIO DE TRANSFERENCIAS MÚLTIPLES
 *
 * Servicio para realizar múltiples transferencias usando Hive Keychain con Generic Broadcast.
 * Implementa el patrón RequestBroadcast para enviar múltiples operaciones en una sola transacción.
 *
 * Implementación siguiendo las mejores prácticas de TypeScript y arquitectura limpia.
 */

import type { HiveOperation, TransferOperationData } from '../domain/models/Payment';

import type { HiveKeychainInstance, KeychainBroadcastResponse } from '../types/keychain';

import {
  createKeychainInvalidOperationError,
  createKeychainNotAvailableError,
  isKeychainAvailable,
  KEYCHAIN_TIMEOUT_MS,
  KeychainKeyType,
} from '../types/keychain';

// Interfaces específicas para transferencias múltiples
export interface MultipleTransferPayment {
  readonly to: string;
  readonly amount: string;
  readonly memo?: string;
}

export interface MultipleTransferOptions {
  readonly username: string;
  readonly payments: readonly MultipleTransferPayment[];
  readonly keyType?: KeychainKeyType;
  readonly timeout?: number;
  readonly rpc?: string;
}

export interface MultipleTransferResult {
  readonly success: boolean;
  readonly transactionId?: string;
  readonly blockNumber?: number;
  readonly totalAmount: string;
  readonly totalPayments: number;
  readonly message?: string;
  readonly error?: string;
}

export interface BroadcastRequestData {
  readonly username: string;
  readonly operations: readonly HiveOperation<TransferOperationData>[];
  readonly method: KeychainKeyType;
}

export interface KeychainBroadcastOptions {
  readonly rpc?: string;
  readonly timeout?: number;
}

/**
 * Clase principal para el servicio de transferencias múltiples
 */
export class MultipleTransferService {
  private readonly defaultTimeout: number;
  private readonly defaultRpc: string | undefined;

  constructor(defaultTimeout: number = KEYCHAIN_TIMEOUT_MS, defaultRpc?: string) {
    this.defaultTimeout = defaultTimeout;
    this.defaultRpc = defaultRpc;
  }

  /**
   * Verifica si Keychain está disponible
   */
  private checkKeychainAvailability(): void {
    if (!isKeychainAvailable()) {
      throw createKeychainNotAvailableError();
    }
  }

  /**
   * Obtiene la instancia de Keychain
   */
  private getKeychainInstance(): HiveKeychainInstance {
    this.checkKeychainAvailability();
    return window.hive_keychain!;
  }

  /**
   * Valida los datos de pago antes de procesar
   */
  private validatePayments(payments: readonly MultipleTransferPayment[]): void {
    if (!Array.isArray(payments) || payments.length === 0) {
      throw createKeychainInvalidOperationError({
        reason: 'Payments array cannot be empty',
      });
    }

    for (const [index, payment] of payments.entries()) {
      if (!payment.to || typeof payment.to !== 'string' || payment.to.trim() === '') {
        throw createKeychainInvalidOperationError({
          reason: `Payment ${index + 1}: Invalid recipient`,
          payment,
        });
      }

      if (!payment.amount || typeof payment.amount !== 'string') {
        throw createKeychainInvalidOperationError({
          reason: `Payment ${index + 1}: Invalid amount`,
          payment,
        });
      }

      // Validar formato de amount
      const amountMatch = payment.amount.match(/^(\d+\.?\d*)\s+(HIVE|HBD)$/);
      if (!amountMatch) {
        throw createKeychainInvalidOperationError({
          reason: `Payment ${index + 1}: Amount must be in format "X.XXX HIVE" or "X.XXX HBD"`,
          payment,
        });
      }

      const numericAmount = parseFloat(amountMatch[1]);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        throw createKeychainInvalidOperationError({
          reason: `Payment ${index + 1}: Amount must be a positive number`,
          payment,
        });
      }
    }
  }

  /**
   * Construye las operaciones de transferencia para Hive
   */
  private buildTransferOperations(
    username: string,
    payments: readonly MultipleTransferPayment[]
  ): readonly HiveOperation<TransferOperationData>[] {
    return payments.map(
      payment =>
        [
          'transfer',
          {
            from: username,
            to: payment.to,
            amount: payment.amount,
            memo: payment.memo || 'Payment from Aliento.pay',
          },
        ] as const
    );
  }

  /**
   * Calcula el total de pagos
   */
  private calculateTotalAmount(payments: readonly MultipleTransferPayment[]): string {
    let totalHive = 0;
    let totalHbd = 0;

    for (const payment of payments) {
      const amountMatch = payment.amount.match(/^(\d+\.?\d*)\s+(HIVE|HBD)$/);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1]!);
        const currency = amountMatch[2];

        if (currency === 'HIVE') {
          totalHive += amount;
        } else if (currency === 'HBD') {
          totalHbd += amount;
        }
      }
    }

    const parts: string[] = [];
    if (totalHive > 0) {
      parts.push(`${totalHive.toFixed(3)} HIVE`);
    }
    if (totalHbd > 0) {
      parts.push(`${totalHbd.toFixed(3)} HBD`);
    }

    return parts.join(' + ') || '0.000 HIVE';
  }

  /**
   * Ejecuta el broadcast request con Promise wrapper
   */
  private async executeBroadcastRequest(
    data: BroadcastRequestData,
    options: KeychainBroadcastOptions = {}
  ): Promise<KeychainBroadcastResponse> {
    const keychain = this.getKeychainInstance();
    const timeout = options.timeout ?? this.defaultTimeout;
    const rpc = options.rpc ?? this.defaultRpc;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Keychain broadcast request timed out after ${timeout}ms`));
      }, timeout);

      try {
        keychain.requestBroadcast(
          data.username,
          data.operations,
          data.method,
          (response: KeychainBroadcastResponse) => {
            clearTimeout(timeoutId);

            if (response.success) {
              resolve(response);
            } else {
              const error = response.error || response.message || 'Unknown Keychain error';
              reject(
                createKeychainInvalidOperationError({
                  reason: error,
                  response,
                })
              );
            }
          }
        );
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Ejecuta múltiples transferencias usando broadcast request
   *
   * @example
   * ```typescript
   * const service = new MultipleTransferService();
   * const result = await service.executeMultipleTransfers({
   *   username: 'aliento',
   *   payments: [
   *     { to: 'user1', amount: '1.000 HIVE', memo: 'Reward 1' },
   *     { to: 'user2', amount: '0.500 HIVE', memo: 'Reward 2' },
   *   ],
   *   keyType: KeychainKeyType.Active,
   * });
   * ```
   */
  async executeMultipleTransfers(
    options: MultipleTransferOptions
  ): Promise<MultipleTransferResult> {
    const { username, payments, keyType = KeychainKeyType.Active, timeout, rpc } = options;

    try {
      // Validar entrada
      this.validatePayments(payments);

      // Construir operaciones
      const operations = this.buildTransferOperations(username, payments);

      // Preparar datos para broadcast
      const broadcastData: BroadcastRequestData = {
        username,
        operations,
        method: keyType,
      };

      // Ejecutar broadcast request
      const response = await this.executeBroadcastRequest(broadcastData, {
        ...(timeout && { timeout }),
        ...(rpc && { rpc }),
      });

      // Calcular totales
      const totalAmount = this.calculateTotalAmount(payments);

      // Construir resultado exitoso
      return {
        success: true,
        ...(response.result?.id && { transactionId: response.result.id }),
        ...(response.result?.block_num && { blockNumber: response.result.block_num }),
        totalAmount,
        totalPayments: payments.length,
        message: `Successfully executed ${payments.length} transfers`,
      };
    } catch (error) {
      // Manejo de errores tipado
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        totalAmount: this.calculateTotalAmount(payments),
        totalPayments: payments.length,
        error: errorMessage,
        message: `Failed to execute ${payments.length} transfers: ${errorMessage}`,
      };
    }
  }

  /**
   * Obtiene el usuario autenticado actual
   */
  getCurrentUser(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authenticated_user');
  }

  /**
   * Guarda la sesión del usuario
   */
  saveUserSession(username: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authenticated_user', username);
    }
  }

  /**
   * Limpia la sesión del usuario
   */
  clearUserSession(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authenticated_user');
    }
  }
}

/**
 * Función de conveniencia para ejecutar múltiples transferencias
 */
export async function executeMultipleTransfers(
  options: MultipleTransferOptions
): Promise<MultipleTransferResult> {
  const service = new MultipleTransferService();
  return service.executeMultipleTransfers(options);
}

/**
 * Función de conveniencia para construir operaciones de transferencia
 */
export function buildTransferOperations(
  username: string,
  payments: readonly MultipleTransferPayment[]
): readonly HiveOperation<TransferOperationData>[] {
  return payments.map(
    payment =>
      [
        'transfer',
        {
          from: username,
          to: payment.to,
          amount: payment.amount,
          memo: payment.memo || 'Payment from Aliento.pay',
        },
      ] as const
  );
}

/**
 * Función para obtener el usuario autenticado actual
 */
export function getCurrentUser(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authenticated_user');
}

/**
 * Instancia singleton del servicio
 */
export const multipleTransferService = new MultipleTransferService();

// Alias para compatibilidad con examples
export type TransferData = MultipleTransferPayment;
export type TransferResult = MultipleTransferResult;

/**
 * Función para validar transferencias
 */
export function validateTransfers(transfers: readonly TransferData[]): string[] {
  const errors: string[] = [];

  if (!Array.isArray(transfers) || transfers.length === 0) {
    errors.push('Transfers array cannot be empty');
    return errors;
  }

  for (const [index, transfer] of transfers.entries()) {
    if (!transfer.to || typeof transfer.to !== 'string' || transfer.to.trim() === '') {
      errors.push(`Transfer ${index + 1}: Invalid recipient`);
    }

    if (!transfer.amount || typeof transfer.amount !== 'string') {
      errors.push(`Transfer ${index + 1}: Invalid amount`);
    }

    const amountMatch = transfer.amount.match(/^(\d+\.?\d*)\s+(HIVE|HBD)$/);
    if (!amountMatch) {
      errors.push(`Transfer ${index + 1}: Amount must be in format "X.XXX HIVE" or "X.XXX HBD"`);
    }
  }

  return errors;
}

/**
 * Convierte pagos a transferencias
 */
export function paymentsToTransfers(payments: readonly any[]): readonly TransferData[] {
  return payments.map(payment => ({
    to: payment.to,
    amount: payment.amount,
    memo: payment.memo || 'Payment from Aliento.pay',
  }));
}

/**
 * Calcula el total de las transferencias
 */
export function calculateTotalAmount(transfers: readonly TransferData[]): string {
  let totalHive = 0;
  let totalHbd = 0;

  for (const transfer of transfers) {
    const amountMatch = transfer.amount.match(/^(\d+\.?\d*)\s+(HIVE|HBD)$/);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1]!);
      const currency = amountMatch[2];

      if (currency === 'HIVE') {
        totalHive += amount;
      } else if (currency === 'HBD') {
        totalHbd += amount;
      }
    }
  }

  const parts: string[] = [];
  if (totalHive > 0) {
    parts.push(`${totalHive.toFixed(3)} HIVE`);
  }
  if (totalHbd > 0) {
    parts.push(`${totalHbd.toFixed(3)} HBD`);
  }

  return parts.join(' + ') || '0.000 HIVE';
}

/**
 * Genera un resumen de las transferencias
 */
export function generateTransferSummary(transfers: readonly TransferData[]): string {
  const totalAmount = calculateTotalAmount(transfers);
  return `${transfers.length} transfers totaling ${totalAmount}`;
}

/**
 * Ejecuta pagos (alias para executeMultipleTransfers)
 */
export async function executePayments(
  options: MultipleTransferOptions
): Promise<MultipleTransferResult> {
  return executeMultipleTransfers(options);
}

/**
 * Ejecuta transferencias en lotes
 */
export async function executeTransfersInBatches(
  options: MultipleTransferOptions & { batchSize?: number }
): Promise<MultipleTransferResult[]> {
  const { payments, batchSize = 10, ...restOptions } = options;
  const results: MultipleTransferResult[] = [];

  for (let i = 0; i < payments.length; i += batchSize) {
    const batch = payments.slice(i, i + batchSize);
    const result = await executeMultipleTransfers({
      ...restOptions,
      payments: batch,
    });
    results.push(result);
  }

  return results;
}

// Exportar tipos para uso externo
export type {
  BroadcastRequestData as BroadcastData,
  KeychainBroadcastOptions as BroadcastOptions,
  MultipleTransferOptions as TransferOptions,
  MultipleTransferPayment as TransferPayment,
  MultipleTransferResult as TransferResult,
};
