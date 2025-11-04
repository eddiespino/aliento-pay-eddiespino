/**
 * 🔐 KEYCHAIN AUTHENTICATION GATEWAY
 *
 * Secondary adapter for Hive Keychain authentication.
 * Implements AuthenticationGateway port using Keychain SDK.
 */

import type {
  AuthenticationGateway,
  AuthenticationChallenge,
  AuthenticationResult,
} from '../../domain/ports/AuthenticationGateway';
import { KeyType } from '../../domain/ports/AuthenticationGateway';
import { ValidUsername } from '../../domain/value-objects/ValidUsername';
import {
  AuthenticationServiceUnavailableError,
  InvalidSignatureError,
} from '../../domain/ports/AuthenticationGateway';

// Import existing Keychain types for compatibility
import type { HiveKeychainInstance } from '../../../types/keychain';

declare global {
  interface Window {
    hive_keychain?: HiveKeychainInstance;
  }
}

export class KeychainAuthGateway implements AuthenticationGateway {
  async isAvailable(): Promise<boolean> {
    return (
      typeof window !== 'undefined' &&
      window.hive_keychain !== undefined &&
      typeof window.hive_keychain === 'object'
    );
  }

  async createChallenge(username: ValidUsername): Promise<AuthenticationChallenge> {
    const timestamp = new Date();
    const nonce = this.generateNonce();

    const message = this.buildChallengeMessage(username.getValue(), timestamp, nonce);

    return {
      message,
      timestamp,
      nonce,
    };
  }

  async verifySignature(
    username: ValidUsername,
    challenge: AuthenticationChallenge,
    signature: string
  ): Promise<AuthenticationResult> {
    try {
      if (!(await this.isAvailable())) {
        throw new AuthenticationServiceUnavailableError();
      }

      // In a real implementation, this would:
      // 1. Verify the signature using crypto libraries
      // 2. Check that the signature matches the challenge
      // 3. Verify against the user's public key

      // For now, simulate verification
      const isValid = await this.simulateSignatureVerification(username, challenge, signature);

      if (!isValid) {
        throw new InvalidSignatureError(username.getValue());
      }

      const publicKey = await this.getPublicKey(username, KeyType.POSTING);
      return {
        success: true,
        signature,
        publicKey: publicKey || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  async getPublicKey(username: ValidUsername, keyType: KeyType): Promise<string | null> {
    try {
      // In a real implementation, this would:
      // 1. Query the Hive blockchain for the user's account
      // 2. Extract the appropriate public key based on keyType
      // 3. Return the public key in the correct format

      // For now, return a placeholder
      return `STM7${username.getValue().toUpperCase()}${keyType.toUpperCase()}KEY`;
    } catch (error) {
      console.error('Failed to get public key:', error);
      return null;
    }
  }

  /**
   * Request signature from Keychain
   */
  async requestSignature(
    username: ValidUsername,
    message: string,
    keyType: KeyType = KeyType.POSTING
  ): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!window.hive_keychain) {
        reject(new AuthenticationServiceUnavailableError());
        return;
      }

      // Use existing Keychain integration
      window.hive_keychain.requestSignBuffer(
        username.getValue(),
        message,
        keyType as any, // Type compatibility
        (response: any) => {
          if (response.success) {
            resolve(response.result);
          } else {
            reject(new Error(response.message || 'Signature request failed'));
          }
        }
      );
    });
  }

  private generateNonce(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private buildChallengeMessage(username: string, timestamp: Date, nonce: string): string {
    return [
      'Aliento Pay Authentication',
      `Username: ${username}`,
      `Timestamp: ${timestamp.toISOString()}`,
      `Nonce: ${nonce}`,
      '',
      'Please sign this message to authenticate with Aliento Pay.',
      'This signature proves you control this Hive account.',
    ].join('\n');
  }

  private async simulateSignatureVerification(
    username: ValidUsername,
    challenge: AuthenticationChallenge,
    signature: string
  ): Promise<boolean> {
    // In a real implementation, this would use cryptographic verification
    // For now, simulate validation

    // Basic checks
    if (!signature || signature.length < 10) {
      return false;
    }

    // Check if challenge is recent (within 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (challenge.timestamp.getTime() < fiveMinutesAgo) {
      return false;
    }

    // Simulate successful verification
    return true;
  }
}
