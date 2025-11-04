/**
 * Domain Entity: Hive Account
 * Pure domain object without external dependencies
 * Uses readonly properties for immutability
 */
export interface HiveAccount {
  readonly id: number;
  readonly name: string;
  readonly reputation: string;
  readonly incoming_hp: string;
  readonly outgoing_hp: string;
  readonly created_at: string;
  readonly posting_metadata: HiveAccountMetadata | undefined;
}

/**
 * Value Object: Hive Account Metadata
 * Represents the posting_json_metadata structure
 */
export interface HiveAccountMetadata {
  readonly profile:
    | {
        readonly name: string | undefined;
        readonly about: string | undefined;
        readonly profile_image: string | undefined;
        readonly cover_image: string | undefined;
        readonly website: string | undefined;
        readonly location: string | undefined;
      }
    | undefined;
}

/**
 * Value Object: Perfil de usuario simplificado
 */
export interface UserProfile {
  readonly username: string;
  readonly displayName: string;
  readonly reputation: number;
  readonly personalHP: number;
  readonly incomingHP: number;
  readonly outgoingHP: number;
  readonly profileImage: string | undefined;
  readonly createdAt: Date;
}

/**
 * Value Object: Delegation
 * Represents a HP delegation operation with enhanced type safety
 */
export interface Delegation {
  readonly delegator: string;
  readonly delegatee: string;
  readonly hpAmount: number;
  readonly vestsAmount: string;
  readonly timestamp: Date;
  readonly blockNumber: number;
  readonly transactionId: string;
}

/**
 * Type predicate: Username validation
 */
export type ValidUsername = string & { readonly __brand: 'ValidUsername' };

/**
 * Type guard for valid usernames
 */
export const isValidUsername = (username: string): username is ValidUsername => {
  return username.length >= 3 && username.length <= 16 && /^[a-z0-9.-]+$/.test(username);
};

/**
 * Smart constructor for ValidUsername
 */
export const createValidUsername = (username: string): ValidUsername => {
  const normalized = username.trim().toLowerCase();
  if (!isValidUsername(normalized)) {
    throw new Error(`Invalid username: ${username}`);
  }
  return normalized as ValidUsername;
};

/**
 * Value Object: HP Amount with validation
 */
export type HPAmount = number & { readonly __brand: 'HPAmount' };

export const createHPAmount = (amount: number): HPAmount => {
  if (amount < 0) {
    throw new Error('HP amount cannot be negative');
  }
  if (!Number.isFinite(amount)) {
    throw new Error('HP amount must be a finite number');
  }
  return amount as HPAmount;
};
