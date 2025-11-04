/**
 * Core Payment domain types and interfaces
 * Following Domain-Driven Design principles and TypeScript best practices
 */

// Payment interface for the application
export interface Payment {
  readonly id: string;
  readonly to: string;
  readonly amount: number;
  readonly currency: 'HIVE' | 'HBD';
  readonly memo?: string;
  readonly timestamp?: Date;
  readonly status: 'pending' | 'completed' | 'failed';
}

// Type for transfer operation data
export interface TransferOperationData {
  readonly from: string;
  readonly to: string;
  readonly amount: string;
  readonly memo: string;
}

// Generic operation tuple type
export type HiveOperation<T = TransferOperationData> = readonly [
  string, // operation type
  T, // operation data
];
