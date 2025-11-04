/**
 * 🔐 AUTHENTICATION GATEWAY PORT
 *
 * Port interface for authentication services.
 * Abstracts external authentication providers (Keychain, etc.)
 */

import { ValidUsername } from '../value-objects/ValidUsername';

export interface AuthenticationChallenge {
  readonly message: string;
  readonly timestamp: Date;
  readonly nonce: string;
}

export interface AuthenticationResult {
  readonly success: boolean;
  readonly signature?: string;
  readonly publicKey?: string;
  readonly error?: string;
}

export interface AuthenticationGateway {
  /**
   * Check if authentication service is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Create authentication challenge for user
   */
  createChallenge(username: ValidUsername): Promise<AuthenticationChallenge>;

  /**
   * Verify authentication signature
   */
  verifySignature(
    username: ValidUsername,
    challenge: AuthenticationChallenge,
    signature: string
  ): Promise<AuthenticationResult>;

  /**
   * Get user's public key for verification
   */
  getPublicKey(username: ValidUsername, keyType: KeyType): Promise<string | null>;
}

export enum KeyType {
  POSTING = 'posting',
  ACTIVE = 'active',
  MEMO = 'memo',
  OWNER = 'owner',
}

/**
 * Authentication service errors
 */
export abstract class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthenticationServiceUnavailableError extends AuthenticationError {
  constructor() {
    super('Authentication service is not available', 'SERVICE_UNAVAILABLE');
  }
}

export class InvalidSignatureError extends AuthenticationError {
  constructor(username: string) {
    super(`Invalid signature for user ${username}`, 'INVALID_SIGNATURE');
  }
}

export class UserNotFoundError extends AuthenticationError {
  constructor(username: string) {
    super(`User ${username} not found`, 'USER_NOT_FOUND');
  }
}
