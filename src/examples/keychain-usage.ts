/**
 * Example usage of the enhanced Keychain types and services
 * Demonstrates TypeScript best practices and type safety
 */

import type { HiveOperation, TransferOperationData } from '../domain/models/Payment';
import { keychainService } from '../services/keychain';
import { KeychainKeyType } from '../types/keychain';

// Example 1: Basic multiple transfers with type safety
export async function executePayments(): Promise<void> {
  const username = keychainService.getCurrentUser();

  if (!username) {
    console.error('No authenticated user found');
    return;
  }

  // Type-safe payment data
  const payments = [
    {
      to: 'recipient1',
      amount: '1.000 HIVE',
      memo: 'Curation reward - Aliento.pay',
    },
    {
      to: 'recipient2',
      amount: '0.500 HIVE',
      memo: 'Curation reward - Aliento.pay',
    },
    {
      to: 'recipient3',
      amount: '0.250 HIVE',
      // memo is optional
    },
  ] as const;

  // Validate payments before processing
  const validation = keychainService.validatePayments(payments);
  if (!validation.valid) {
    console.error('Invalid payment data:', validation.errors);
    return;
  }

  try {
    // Check if Keychain is available
    if (!keychainService.isAvailable()) {
      throw new Error('Hive Keychain is not available');
    }

    // Execute multiple transfers with proper error handling
    const response = await keychainService.executeMultipleTransfers(
      username,
      payments,
      KeychainKeyType.Active
    );

    // Type-safe response handling
    if (response.success && response.result) {
      console.log('✅ Payments executed successfully!');
      console.log('Transaction ID:', response.result.id);
      console.log('Block Number:', response.result.block_num);

      // Calculate total amount
      const totalAmount = payments.reduce((sum, payment) => {
        return sum + parseFloat(payment.amount);
      }, 0);

      console.log('Total Amount:', totalAmount.toFixed(3), 'HIVE');
      console.log('Recipients:', payments.length);
    }
  } catch (error) {
    console.error('❌ Error executing payments:', error);

    // Type-safe error handling
    if (error instanceof Error) {
      if ('code' in error) {
        const keychainError = error as import('../types/keychain').KeychainError;
        console.error('Keychain Error Code:', keychainError.code);
        console.error('Details:', keychainError.details);
      }
    }
  }
}

// Example 2: Advanced usage with custom operations
export async function executeCustomOperations(): Promise<void> {
  const username = keychainService.getCurrentUser();

  if (!username) {
    console.error('No authenticated user found');
    return;
  }

  // Type-safe custom operations
  const operations: readonly HiveOperation<TransferOperationData>[] = [
    [
      'transfer',
      {
        from: username,
        to: 'example-account',
        amount: '1.000 HIVE',
        memo: 'Monthly subscription - Aliento.pay',
      },
    ],
    [
      'transfer',
      {
        from: username,
        to: 'curie',
        amount: '0.500 HIVE',
        memo: 'Support curation - Aliento.pay',
      },
    ],
  ];

  try {
    const response = await keychainService.requestBroadcast(
      username,
      operations,
      KeychainKeyType.Active
    );

    if (response.success) {
      console.log('✅ Custom operations executed successfully!');
      console.log('Response:', response);
    }
  } catch (error) {
    console.error('❌ Error executing custom operations:', error);
  }
}

// Example 3: Sign message with proper typing
export async function signMessage(): Promise<void> {
  const username = keychainService.getCurrentUser();

  if (!username) {
    console.error('No authenticated user found');
    return;
  }

  const message = 'Authorize Aliento.pay access';

  try {
    const response = await keychainService.requestSignBuffer(
      username,
      message,
      KeychainKeyType.Posting
    );

    if (response.success && response.result) {
      console.log('✅ Message signed successfully!');
      console.log('Signature:', response.result);
    }
  } catch (error) {
    console.error('❌ Error signing message:', error);
  }
}

// Example 4: Utility function for building operations
export function buildPaymentOperations(
  fromUser: string,
  payments: ReadonlyArray<{
    readonly to: string;
    readonly amount: number;
    readonly memo?: string;
  }>
): readonly HiveOperation<TransferOperationData>[] {
  return payments.map(
    payment =>
      [
        'transfer',
        {
          from: fromUser,
          to: payment.to,
          amount: `${payment.amount.toFixed(3)} HIVE`,
          memo: payment.memo || 'Payment from Aliento.pay',
        },
      ] as const
  );
}

// Example 5: Type-safe payment processing with groups
export interface PaymentGroup {
  readonly name: string;
  readonly payments: ReadonlyArray<{
    readonly to: string;
    readonly amount: string;
    readonly memo?: string;
  }>;
  readonly totalAmount: number;
}

export async function processPaymentGroups(groups: ReadonlyArray<PaymentGroup>): Promise<void> {
  const username = keychainService.getCurrentUser();

  if (!username) {
    console.error('No authenticated user found');
    return;
  }

  for (const group of groups) {
    console.log(`Processing group: ${group.name}`);
    console.log(`Total amount: ${group.totalAmount.toFixed(3)} HIVE`);
    console.log(`Payments: ${group.payments.length}`);

    try {
      const response = await keychainService.executeMultipleTransfers(
        username,
        group.payments,
        KeychainKeyType.Active
      );

      if (response.success) {
        console.log(`✅ Group ${group.name} processed successfully!`);
      }
    } catch (error) {
      console.error(`❌ Error processing group ${group.name}:`, error);
    }
  }
}

// Example 6: Session management
export function initializeSession(): void {
  const storedUser = keychainService.getCurrentUser();

  if (storedUser) {
    console.log('Found existing session for user:', storedUser);
  } else {
    console.log('No existing session found');
  }
}

export function handleLogin(username: string): void {
  keychainService.saveUserSession(username);
  console.log('Session saved for user:', username);
}

export function handleLogout(): void {
  keychainService.clearUserSession();
  console.log('Session cleared');
}

// Export for external use
export { keychainService } from '../services/keychain';
export type { KeychainKeyType } from '../types/keychain';
