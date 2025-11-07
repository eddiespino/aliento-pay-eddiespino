/**
 * On-chain preference storage for Aliento delegators
 * Uses custom_json operations on Hive blockchain
 */

import type { PaymentPreference, DelegatorPreference } from './earnings-calculator';

// Custom JSON ID for Aliento preferences
export const ALIENTO_PREFERENCE_ID = 'aliento_pay_preference';

/**
 * Save delegator preference on-chain using Hive Keychain
 * @param username - Hive username
 * @param paymentType - Payment preference (HIVE, HBD, HP, DONATE)
 * @param delegatedHP - Amount of HP delegated
 * @returns Promise with transaction result
 */
export async function savePreferenceOnChain(
  username: string,
  paymentType: PaymentPreference,
  delegatedHP: number
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!window.hive_keychain) {
      reject(new Error('Hive Keychain not available'));
      return;
    }

    const preferenceData: DelegatorPreference = {
      username,
      paymentType,
      delegatedHP,
      updatedAt: new Date().toISOString(),
    };

    const jsonData = JSON.stringify(preferenceData);

    window.hive_keychain.requestCustomJson(
      username,
      ALIENTO_PREFERENCE_ID,
      'Posting', // Using posting key for preferences
      jsonData,
      `Save Aliento payment preference: ${paymentType}`,
      (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message || 'Failed to save preference'));
        }
      }
    );
  });
}

/**
 * Fetch user preference from Hive blockchain
 * Note: This requires querying Hive API for custom_json operations
 * @param username - Hive username
 * @returns User's latest preference or null
 */
export async function fetchPreferenceFromChain(
  username: string
): Promise<DelegatorPreference | null> {
  try {
    // Query Hive API for custom_json operations
    const response = await fetch('https://api.hive.blog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'account_history_api.get_account_history',
        params: {
          account: username,
          start: -1,
          limit: 100, // Check last 100 operations
        },
        id: 1,
      }),
    });

    const data = await response.json();

    if (!data.result?.history) {
      return null;
    }

    // Find the most recent aliento preference custom_json
    const history = data.result.history.reverse(); // Most recent first

    for (const [, operation] of history) {
      const [opType, opData] = operation.op;

      if (opType === 'custom_json' && opData.id === ALIENTO_PREFERENCE_ID) {
        try {
          const preference = JSON.parse(opData.json) as DelegatorPreference;
          return preference;
        } catch (e) {
          console.error('Error parsing preference JSON:', e);
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching preference from chain:', error);
    return null;
  }
}

/**
 * Save preference to localStorage as cache
 */
export function savePreferenceToCache(preference: DelegatorPreference): void {
  try {
    localStorage.setItem(
      `aliento_preference_${preference.username}`,
      JSON.stringify(preference)
    );
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

/**
 * Get preference from localStorage cache
 */
export function getPreferenceFromCache(username: string): DelegatorPreference | null {
  try {
    const cached = localStorage.getItem(`aliento_preference_${username}`);
    if (cached) {
      return JSON.parse(cached) as DelegatorPreference;
    }
    return null;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Delegate HP to Aliento using Hive Keychain
 * @param from - Delegator username
 * @param amount - Amount of HP to delegate (in VESTS will be calculated)
 * @returns Promise with transaction result
 */
export async function delegateToAliento(
  from: string,
  amount: number
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!window.hive_keychain) {
      reject(new Error('Hive Keychain not available'));
      return;
    }

    // Convert HP to VESTS (approximate conversion, exact conversion requires dynamic global props)
    // 1 HP ≈ 2000 VESTS (this varies, but we'll use Keychain's built-in conversion)

    window.hive_keychain.requestDelegation(
      from,
      'aliento', // Delegate to @aliento
      amount.toFixed(3), // HP amount
      'HP', // Unit
      (response: any) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message || 'Delegation failed'));
        }
      }
    );
  });
}

/**
 * Get current delegation to Aliento
 * @param username - Delegator username
 * @returns Current delegation amount or null
 */
export async function getCurrentDelegation(username: string): Promise<number | null> {
  try {
    const response = await fetch('https://api.hive.blog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'condenser_api.get_vesting_delegations',
        params: [username, 'aliento', 1],
        id: 1,
      }),
    });

    const data = await response.json();

    if (data.result && data.result.length > 0) {
      const delegation = data.result[0];
      if (delegation.delegatee === 'aliento') {
        // Convert VESTS to HP (approximate)
        const vests = parseFloat(delegation.vesting_shares);
        // This is approximate, real conversion needs global properties
        const hp = vests / 2000;
        return hp;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching current delegation:', error);
    return null;
  }
}
