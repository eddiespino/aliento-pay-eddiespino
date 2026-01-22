import { getHiveChain } from '../../lib/hive-chain-instance';
import type { HiveChainWithFailover } from '../../lib/hive-chain-failover';
import type { Delegation, HiveAccount } from '../../domain/entities/HiveAccount';
import type { HiveRepository, VestsConverter } from '../../domain/ports/HiveRepository';

interface GlobalPropsCache {
	totalVestingFundHive: string;
	totalVestingShares: string;
	cachedAt: number;
	vestsToHpRatio: number;
}

interface OperationsMetadata {
	total_operations: number;
	total_pages: number;
}

interface DelegationsPageResult {
	operations: RawDelegationOperation[];
	totalPages: number;
}

interface RawDelegationOperation {
	timestamp: string;
	block_num: number;
	trx_id: string;
	op: {
		value: {
			delegator: string;
			delegatee: string;
			vesting_shares: VestsAsset;
		};
	};
}

type VestsAsset = string | number | { amount: string; precision?: number };

interface HafahApiExtension {
	'hafah-api': {
		accounts: {
			operations: {
				urlPath: string;
			};
		};
	};
}

interface HafahOperationsResponse {
	total_operations: number;
	total_pages: number;
	operations_result?: RawDelegationOperation[];
}

interface HafahOperationsQuery {
	accountName: string;
	'operation-types': string;
	page?: number;
	'page-size': number;
	'data-size-limit': number;
}

interface HafahRestApi {
	'hafah-api': {
		accounts: {
			operations: (query: HafahOperationsQuery) => Promise<HafahOperationsResponse>;
		};
	};
}

interface GlobalDynamicProperties {
	total_vesting_fund_hive: unknown;
	total_vesting_shares: unknown;
}

interface DatabaseApi {
	get_dynamic_global_properties: () => Promise<GlobalDynamicProperties>;
}

const FALLBACK_VESTS_TO_HP_RATIO = 0.0005993102;
const CACHE_DURATION_MS = 5 * 60 * 1000;
const ACCOUNTS_API_URL = 'https://hafsql-api.mahdiyari.info/accounts/by-names';
const PAGINATION_DELAY_MS = 150;
const DELEGATION_OPERATION_TYPE = '40';
const PAGE_SIZE = 400;
const DATA_SIZE_LIMIT = 200000;

export class HiveHttpRepository implements HiveRepository, VestsConverter {
	private globalPropsCache: GlobalPropsCache | null = null;

	async getAccount(username: string): Promise<HiveAccount | null> {
		try {
			const response = await fetch(`${ACCOUNTS_API_URL}?names=${username}`);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const accounts: HiveAccount[] = await response.json();

			if (accounts.length === 0) {
				return null;
			}

			return accounts[0] ?? null;
		} catch (error) {
			console.error('Error fetching Hive account:', error);
			return null;
		}
	}

	async getAccounts(usernames: string[]): Promise<HiveAccount[]> {
		try {
			const namesParam = usernames.join(',');
			const response = await fetch(`${ACCOUNTS_API_URL}?names=${namesParam}`);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const accounts: HiveAccount[] = await response.json();
			return accounts;
		} catch (error) {
			console.error('Error fetching Hive accounts:', error);
			return [];
		}
	}

	async getActiveDelegations(username: string): Promise<Delegation[]> {
		try {
			const chainWithFailover = await getHiveChain();
			const chainExtendedRestApi = this.createHafahApiExtension();

			const metadata = await this.getOperationsMetadataWithFailover(
				chainWithFailover,
				chainExtendedRestApi,
				username
			);

			if (metadata.total_operations === 0) {
				return [];
			}

			const allOperations = await this.fetchAllDelegationPages(
				chainWithFailover,
				chainExtendedRestApi,
				username
			);

			return this.processRawDelegations(allOperations, username);
		} catch (error) {
			console.error('Error fetching delegations:', error);
			return [];
		}
	}

	async vestsToHP(vests: string): Promise<number> {
		try {
			const globalProps = await this.getGlobalPropsWithCache();
			const vestsAmount = this.parseVestsToNumber(vests);
			return vestsAmount * globalProps.vestsToHpRatio;
		} catch (error) {
			console.error('Error converting VESTS to HP:', error);
			const vestsAmount = this.parseVestsToNumber(vests);
			return vestsAmount * FALLBACK_VESTS_TO_HP_RATIO;
		}
	}

	async batchVestsToHP(vestsList: VestsAsset[]): Promise<number[]> {
		if (vestsList.length === 0) return [];

		try {
			const globalProps = await this.getGlobalPropsWithCache();
			return vestsList.map(vests => this.parseVestsToNumber(vests) * globalProps.vestsToHpRatio);
		} catch (error) {
			console.error('Error in batch VESTS to HP conversion:', error);
			return vestsList.map(vests => this.parseVestsToNumber(vests) * FALLBACK_VESTS_TO_HP_RATIO);
		}
	}

	private createHafahApiExtension(): HafahApiExtension {
		return {
			'hafah-api': {
				accounts: {
					operations: {
						urlPath: '{accountName}/operations',
					},
				},
			},
		};
	}

	private async fetchAllDelegationPages(
		chainWithFailover: HiveChainWithFailover,
		chainExtendedRestApi: HafahApiExtension,
		username: string
	): Promise<RawDelegationOperation[]> {
		const allOperations: RawDelegationOperation[] = [];

		const firstBatch = await this.getDelegationsPageWithFailover(
			chainWithFailover,
			chainExtendedRestApi,
			username
		);
		allOperations.push(...firstBatch.operations);

		const totalPages = firstBatch.totalPages;

		for (let pageIndex = 1; pageIndex < totalPages; pageIndex++) {
			const currentPage = totalPages - pageIndex;
			if (currentPage < 1) break;

			try {
				const pageResult = await this.getDelegationsPageWithFailover(
					chainWithFailover,
					chainExtendedRestApi,
					username,
					currentPage
				);
				allOperations.push(...pageResult.operations);
			} catch {
				continue;
			}

			await this.delay(PAGINATION_DELAY_MS);
		}

		return allOperations;
	}

	private async getOperationsMetadataWithFailover(
		chainWithFailover: HiveChainWithFailover,
		chainExtendedRestApi: HafahApiExtension,
		username: string
	): Promise<OperationsMetadata> {
		const query = {
			accountName: username,
			'operation-types': DELEGATION_OPERATION_TYPE,
			'page-size': PAGE_SIZE,
			'data-size-limit': DATA_SIZE_LIMIT,
		};

		const result = await chainWithFailover.executeRestWithFailover(
			async chain => {
				const extended = chain.extendRest(chainExtendedRestApi);
				const api = extended.restApi as unknown as HafahRestApi;
				return api['hafah-api'].accounts.operations(query);
			},
			`getOperationsMetadata(${username})`
		);

		return {
			total_operations: result.total_operations,
			total_pages: result.total_pages,
		};
	}

	private async getDelegationsPageWithFailover(
		chainWithFailover: HiveChainWithFailover,
		chainExtendedRestApi: HafahApiExtension,
		username: string,
		page?: number
	): Promise<DelegationsPageResult> {
		const query = {
			accountName: username,
			'operation-types': DELEGATION_OPERATION_TYPE,
			page,
			'page-size': PAGE_SIZE,
			'data-size-limit': DATA_SIZE_LIMIT,
		};

		const result = await chainWithFailover.executeRestWithFailover(
			async chain => {
				const extended = chain.extendRest(chainExtendedRestApi);
				const api = extended.restApi as unknown as HafahRestApi;
				return api['hafah-api'].accounts.operations(query);
			},
			`getDelegationsPage(${username}, page ${page ?? 1})`
		);

		return {
			operations: result.operations_result ?? [],
			totalPages: result.total_pages ?? 1,
		};
	}

	private parseAsset(asset: unknown): number {
		if (typeof asset === 'string') {
			return parseFloat(asset.replace(/[^\d.]/g, ''));
		}
		if (this.isAssetObject(asset)) {
			return parseInt(asset.amount, 10) / Math.pow(10, asset.precision);
		}
		return 0;
	}

	private isAssetObject(asset: unknown): asset is { amount: string; precision: number } {
		return (
			typeof asset === 'object' &&
			asset !== null &&
			'amount' in asset &&
			'precision' in asset &&
			typeof (asset as { amount: unknown }).amount === 'string' &&
			typeof (asset as { precision: unknown }).precision === 'number'
		);
	}

	private parseVestsToNumber(vests: VestsAsset): number {
		if (typeof vests === 'string') {
			return parseFloat(vests.replace(' VESTS', '')) || 0;
		}
		if (typeof vests === 'number') {
			return vests;
		}
		if (typeof vests === 'object' && vests !== null && 'amount' in vests) {
			return parseFloat(String(vests.amount).replace(' VESTS', '')) || 0;
		}
		return 0;
	}

	private async getGlobalPropsWithCache(): Promise<GlobalPropsCache> {
		const now = Date.now();

		if (this.globalPropsCache && now - this.globalPropsCache.cachedAt < CACHE_DURATION_MS) {
			return this.globalPropsCache;
		}

		try {
			const chainWithFailover = await getHiveChain();
			const globalProps = await chainWithFailover.executeWithFailover(
				async chain => {
					const dbApi = chain.api.database_api as unknown as DatabaseApi;
					return dbApi.get_dynamic_global_properties();
				},
				'get_dynamic_global_properties'
			);

			const totalVestingFundHive = this.parseAsset(globalProps.total_vesting_fund_hive);
			const totalVestingShares = this.parseAsset(globalProps.total_vesting_shares);
			const vestsToHpRatio = totalVestingFundHive / totalVestingShares;

			this.globalPropsCache = {
				totalVestingFundHive: String(globalProps.total_vesting_fund_hive),
				totalVestingShares: String(globalProps.total_vesting_shares),
				vestsToHpRatio,
				cachedAt: now,
			};

			return this.globalPropsCache;
		} catch (error) {
			console.error('Error fetching global properties:', error);

			if (this.globalPropsCache) {
				return this.globalPropsCache;
			}

			this.globalPropsCache = {
				totalVestingFundHive: '0 HIVE',
				totalVestingShares: '0 VESTS',
				vestsToHpRatio: FALLBACK_VESTS_TO_HP_RATIO,
				cachedAt: now,
			};

			return this.globalPropsCache;
		}
	}

	private async processRawDelegations(
		rawOperations: RawDelegationOperation[],
		targetDelegatee: string
	): Promise<Delegation[]> {
		const latestByDelegator = this.getLatestOperationByDelegator(rawOperations);

		const relevantOperations = Array.from(latestByDelegator.values()).filter(
			operation => operation.op.value.delegatee === targetDelegatee
		);

		if (relevantOperations.length === 0) {
			return [];
		}

		const vestsList = relevantOperations.map(op => op.op.value.vesting_shares);
		const hpAmounts = await this.batchVestsToHP(vestsList);

		const delegations: Delegation[] = relevantOperations.map((operation, index) => ({
			delegator: operation.op.value.delegator,
			delegatee: operation.op.value.delegatee,
			hpAmount: hpAmounts[index] ?? 0,
			vestsAmount: String(operation.op.value.vesting_shares),
			timestamp: new Date(operation.timestamp),
			blockNumber: operation.block_num,
			transactionId: operation.trx_id,
		}));

		return delegations
			.filter(delegation => delegation.hpAmount > 0)
			.sort((a, b) => b.hpAmount - a.hpAmount);
	}

	private getLatestOperationByDelegator(
		operations: RawDelegationOperation[]
	): Map<string, RawDelegationOperation> {
		const latestByDelegator = new Map<string, RawDelegationOperation>();

		for (const operation of operations) {
			const delegator = operation.op.value.delegator;
			const existing = latestByDelegator.get(delegator);

			const isMoreRecent = !existing || new Date(operation.timestamp) > new Date(existing.timestamp);

			if (isMoreRecent) {
				latestByDelegator.set(delegator, operation);
			}
		}

		return latestByDelegator;
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}
