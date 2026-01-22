import { type TWaxRestExtended } from '@hiveio/wax';
import { getHiveChain } from './hive-chain-instance';
import type { HiveChainWithFailover } from './hive-chain-failover';
import type { CurationReward as DomainCurationReward } from '../domain/entities/CurationStats';

export interface DelegationOperation {
	trx_id: string;
	block_num: number;
	trx_in_block: number;
	op_in_trx: number;
	virtual_op: number;
	timestamp: string;
	op: {
		type: 'delegate_vesting_shares_operation';
		value: {
			delegator: string;
			delegatee: string;
			vesting_shares: {
				nai: string;
				amount: string;
				precision: number;
			};
		};
	};
}

export interface DelegationOperationResponse {
	total_operations: number;
	total_pages: number;
	operations_result: Array<{
		op: {
			type: string;
			value: {
				delegatee: string;
				delegator: string;
				vesting_shares: {
					nai: string;
					amount: string;
					precision: number;
				};
			};
		};
		block: number;
		trx_id: string;
		op_pos: number;
		op_type_id: number;
		timestamp: string;
		virtual_op: boolean;
		operation_id: string;
		trx_in_block: number;
	}>;
}

interface GlobalPropsCache {
	total_vesting_fund_hive: {
		nai: string;
		amount: string;
		precision: number;
	};
	total_vesting_shares: {
		nai: string;
		amount: string;
		precision: number;
	};
	timestamp: number;
	chainWithFailover: HiveChainWithFailover;
}

let globalPropsCache: GlobalPropsCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

export function clearGlobalPropsCache(): void {
	globalPropsCache = null;
}

export function clearCurationStatsCache(): void {
	curationStatsCache.clear();
}

export function clearCurationRewardsCache(): void {
	curationRewardsCache.clear();
}

export function clearAllCaches(): void {
	clearGlobalPropsCache();
	clearCurationStatsCache();
	clearCurationRewardsCache();
}

async function getGlobalPropsWithCache(): Promise<GlobalPropsCache> {
	const now = Date.now();

	if (globalPropsCache && now - globalPropsCache.timestamp < CACHE_DURATION) {
		return globalPropsCache;
	}

	const chainWithFailover = globalPropsCache?.chainWithFailover || (await getHiveChain());

	const globalProps = await chainWithFailover.executeWithFailover(
		async (chain) => (chain.api.database_api as any).get_dynamic_global_properties(),
		'get_dynamic_global_properties'
	);

	globalPropsCache = {
		total_vesting_fund_hive: globalProps.total_vesting_fund_hive,
		total_vesting_shares: globalProps.total_vesting_shares,
		timestamp: now,
		chainWithFailover: chainWithFailover,
	};

	return globalPropsCache;
}

const FALLBACK_VESTS_TO_HP_RATIO = 0.0005993102;

export async function vestsToHP(vests: string): Promise<number> {
	try {
		const cachedProps = await getGlobalPropsWithCache();
		const chain = cachedProps.chainWithFailover.getChain();
		const hpAmount = chain.vestsToHp(
			vests,
			cachedProps.total_vesting_fund_hive,
			cachedProps.total_vesting_shares
		);
		const amount = hpAmount.amount;
		return parseFloat(amount) / 1000;
	} catch (error) {
		console.error('Error converting VESTS to HP:', error);
		const vestsAmount = parseFloat(vests.replace(' VESTS', '')) || 0;
		return vestsAmount * FALLBACK_VESTS_TO_HP_RATIO;
	}
}

export interface CurationRewardAPI {
	operationId: string;
	timestamp: string;
	blockNum: number;
	trxId: string;
	reward: number;
	rewardVests: number;
	curator: string;
	author: string;
	permlink: string;
	mustBeClaimed: boolean;
}

export type CurationReward = DomainCurationReward;

export const convertCurationRewardFromAPI = (apiReward: CurationRewardAPI): CurationReward => ({
	operationId: apiReward.operationId,
	timestampMs: new Date(apiReward.timestamp).getTime(),
	rewardVests: apiReward.rewardVests,
	rewardHP: apiReward.reward,
	blockNum: apiReward.blockNum,
	trxId: apiReward.trxId,
	curator: apiReward.curator,
	author: apiReward.author,
	permlink: apiReward.permlink,
	mustBeClaimed: apiReward.mustBeClaimed,
});

export interface CurationRewardsResponse {
	totalOperations: number;
	totalPages: number;
	rewards: CurationReward[];
	hasMore: boolean;
}

export interface CurationStatsResult {
	total24Hr: number;
	total7D: number;
	total30D: number;
	rewards24Hr: CurationReward[];
	rewards7D: CurationReward[];
	rewards30D: CurationReward[];
	vestingData: {
		totalVestingFundHive: GlobalPropsCache['total_vesting_fund_hive'];
		totalVestingShares: GlobalPropsCache['total_vesting_shares'];
	};
}

const curationRewardsCache = new Map<
	string,
	{ data: CurationRewardsResponse; timestamp: number }
>();
const curationStatsCache = new Map<string, { data: CurationStatsResult; timestamp: number }>();
const CURATION_CACHE_DURATION = 1 * 60 * 1000;
const CURATION_STATS_CACHE_DURATION = 10 * 60 * 1000;

const HAFAH_API_CONFIG = {
	'hafah-api': {
		accounts: {
			operations: {
				urlPath: '{accountName}/operations',
			},
		},
	},
};

const CURATION_REWARD_OPERATION_TYPE = '52';

export async function getHistoryRewards(
	account: string,
	page: number | null = null,
	fromDate?: Date
): Promise<CurationRewardsResponse | null> {
	if (!account || account.trim() === '') {
		throw new Error('El nombre de cuenta es requerido');
	}

	const cacheKey = `${account}-${page || 0}-${fromDate?.toISOString() || 'latest'}`;

	const cachedData = curationRewardsCache.get(cacheKey);
	if (cachedData && Date.now() - cachedData.timestamp < CURATION_CACHE_DURATION) {
		return cachedData.data;
	}

	const fromBlockDate: string = fromDate
		? fromDate.toISOString().split('T')[0]!
		: new Date().toISOString().split('T')[0]!;

	const cachedProps = await getGlobalPropsWithCache();
	const chainWithFailover = cachedProps.chainWithFailover;

	const now = new Date();
	const toBlockDate: string = now
		.toISOString()
		.replace('T', ' ')
		.replace(/\.\d{3}Z$/, '');

	const query: Record<string, string | number> = {
		accountName: account,
		'operation-types': CURATION_REWARD_OPERATION_TYPE,
		'page-size': 400,
		'data-size-limit': 200000,
		'from-block': fromBlockDate,
		'to-block': toBlockDate,
	};

	if (page !== null && page > 1) {
		query.page = page;
	}

	try {
		const result = await chainWithFailover.executeRestWithFailover(
			async (chain) => {
				const extended = chain.extendRest(HAFAH_API_CONFIG);
				return (extended.restApi as any)['hafah-api'].accounts.operations(query);
			},
			`getHistoryRewards(${account})`
		);

		if (!result.operations_result || result.operations_result.length === 0) {
			return null;
		}

		const rewards: CurationReward[] = [];
		for (const operation of result.operations_result) {
			if (operation.op.type !== 'curation_reward_operation') {
				continue;
			}

			const opValue = operation.op.value;
			const rewardVests = opValue.reward;

			if (!rewardVests || !rewardVests.amount || parseFloat(rewardVests.amount) <= 0) {
				continue;
			}

			const vestsAmountRaw = BigInt(rewardVests.amount);
			const vestsPrecision = BigInt(Math.pow(10, rewardVests.precision));

			const totalVestingFundHiveRaw = BigInt(cachedProps.total_vesting_fund_hive.amount);
			const totalVestingFundHivePrecision = BigInt(
				Math.pow(10, cachedProps.total_vesting_fund_hive.precision)
			);
			const totalVestingSharesRaw = BigInt(cachedProps.total_vesting_shares.amount);
			const totalVestingSharesPrecision = BigInt(
				Math.pow(10, cachedProps.total_vesting_shares.precision)
			);

			const numerator = vestsAmountRaw * totalVestingFundHiveRaw * totalVestingSharesPrecision;
			const denominator = vestsPrecision * totalVestingFundHivePrecision * totalVestingSharesRaw;

			const hiveRewardBigInt = numerator / denominator;
			const hiveReward =
				Number(hiveRewardBigInt) + Number(numerator % denominator) / Number(denominator);

			const vestsAmount = Number(vestsAmountRaw) / Number(vestsPrecision);

			const curationReward: CurationReward = {
				operationId: operation.operation_id,
				timestampMs: new Date(operation.timestamp).getTime(),
				blockNum: operation.block,
				trxId: operation.trx_id,
				rewardHP: hiveReward,
				rewardVests: vestsAmount,
				curator: opValue.curator,
				author: opValue.comment_author,
				permlink: opValue.comment_permlink,
				mustBeClaimed: opValue.payout_must_be_claimed,
			};

			rewards.push(curationReward);
		}

		const response: CurationRewardsResponse = {
			totalOperations: result.total_operations,
			totalPages: result.total_pages,
			rewards,
			hasMore: result.total_pages > 1,
		};

		curationRewardsCache.set(cacheKey, {
			data: response,
			timestamp: Date.now(),
		});

		return response;
	} catch (error) {
		console.error(`Error obteniendo historial de recompensas para ${account}:`, error);
		throw error;
	}
}

export async function getTotalCurationRewards(
	account: string,
	fromDate: Date,
	toDate?: Date
): Promise<number> {
	let totalRewards = 0;
	let totalPages = 0;
	let currentPageIndex = 1;
	let hasMorePages = true;

	while (hasMorePages) {
		let actualPage = null;
		if (currentPageIndex === 1) {
			actualPage = null;
		} else {
			actualPage = totalPages - currentPageIndex + 2;
		}

		const response = await getHistoryRewards(account, actualPage, fromDate);

		if (!response || response.rewards.length === 0) {
			break;
		}

		if (currentPageIndex === 1) {
			totalPages = response.totalPages;
		}

		const filteredRewards = toDate
			? response.rewards.filter(reward => {
					const rewardDate = new Date(reward.timestampMs);
					return rewardDate >= fromDate && rewardDate <= toDate;
				})
			: response.rewards;

		totalRewards += filteredRewards.reduce((sum, reward) => sum + reward.rewardHP, 0);

		hasMorePages = currentPageIndex < totalPages;
		currentPageIndex++;
	}

	return totalRewards;
}

export async function curationStats(account: string): Promise<CurationStatsResult> {
	if (!account || account.trim() === '') {
		throw new Error('El nombre de cuenta es requerido');
	}

	const accountLower = account.toLowerCase().trim();

	const cacheKey = `curation-stats-${accountLower}`;
	const cachedData = curationStatsCache.get(cacheKey);
	if (cachedData && Date.now() - cachedData.timestamp < CURATION_STATS_CACHE_DURATION) {
		return cachedData.data;
	}

	const now = new Date();
	const date24HoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const date7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	const fromDate = date30DaysAgo;

	const processed24Hr = new Set<string>();
	const processed7D = new Set<string>();
	const processed30D = new Set<string>();

	const rewards24Hr: CurationReward[] = [];
	const rewards7D: CurationReward[] = [];
	const rewards30D: CurationReward[] = [];

	let totalPages = 0;
	let currentPageIndex = 1;
	let hasMorePages = true;

	while (hasMorePages) {
		let actualPage = null;
		if (currentPageIndex === 1) {
			actualPage = null;
		} else {
			actualPage = totalPages - currentPageIndex + 2;
		}

		const response = await getHistoryRewards(accountLower, actualPage, fromDate);

		if (!response || response.rewards.length === 0) {
			break;
		}

		if (currentPageIndex === 1) {
			totalPages = response.totalPages;
		}

		for (const reward of response.rewards) {
			const rewardDate = new Date(reward.timestampMs);
			const operationId = reward.operationId;

			if (rewardDate >= date30DaysAgo && !processed30D.has(operationId)) {
				processed30D.add(operationId);
				rewards30D.push(reward);
			}

			if (rewardDate >= date7DaysAgo && !processed7D.has(operationId)) {
				processed7D.add(operationId);
				rewards7D.push(reward);
			}

			if (rewardDate >= date24HoursAgo && !processed24Hr.has(operationId)) {
				processed24Hr.add(operationId);
				rewards24Hr.push(reward);
			}
		}

		hasMorePages = currentPageIndex < totalPages;
		currentPageIndex++;
	}

	const cachedProps = await getGlobalPropsWithCache();

	const total24Hr = rewards24Hr.reduce((sum, reward) => sum + reward.rewardHP, 0);
	const total7D = rewards7D.reduce((sum, reward) => sum + reward.rewardHP, 0);
	const total30D = rewards30D.reduce((sum, reward) => sum + reward.rewardHP, 0);

	const result: CurationStatsResult = {
		total24Hr,
		total7D,
		total30D,
		rewards24Hr,
		rewards7D,
		rewards30D,
		vestingData: {
			totalVestingFundHive: cachedProps.total_vesting_fund_hive,
			totalVestingShares: cachedProps.total_vesting_shares,
		},
	};

	curationStatsCache.set(cacheKey, {
		data: result,
		timestamp: Date.now(),
	});

	return result;
}

export function clearAllCurationCaches(): void {
	curationRewardsCache.clear();
	curationStatsCache.clear();
}

export interface OptimizedDelegationFilters {
	timePeriod: number;
	minimumHP: number;
	excludedUsers: string[];
}

export type DelegationFilters = OptimizedDelegationFilters;

export interface DelegatorInfo {
	delegator: string;
	currentHP: number;
	vestingShares: string;
	timestamp: string;
	trx_id: string;
	block_num: number;
	operation_id: string;
	participationPercentage: number;
}

export interface OptimizedDelegationsResult {
	activeDelegations: DelegatorInfo[];
	totalDelegationsHP: number;
	totalDelegators: number;
	excludedDelegators: string[];
	belowMinimumDelegators: string[];
	metadata: {
		totalOperationsFound: number;
		operationsInTimeRange: number;
		processedDelegators: number;
		filteredByMinHP: number;
		filteredByExclusion: number;
		timeRangeStart: string;
		timeRangeEnd: string;
	};
}

export function getDateStringForAPI(targetDate: Date): string {
	return targetDate.toISOString();
}

interface DelegationCache {
	username: string;
	operations: DelegationOperationResponse['operations_result'];
	fetchedAt: Date;
	toBlockDate: string;
	isComplete: boolean;
}

const delegationCacheMap = new Map<string, DelegationCache>();
const DELEGATION_CACHE_DURATION = 10 * 60 * 1000;

export function clearDelegationCache(): void {
	delegationCacheMap.clear();
}

export function logDelegationCacheStats(): void {
	const stats = getDelegationCacheStats();

	if (stats.entries.length === 0) {
		return;
	}
}

export function getDelegationCacheStats(): {
	totalEntries: number;
	entries: Array<{
		username: string;
		operationsCount: number;
		fetchedAt: string;
		toBlockDate: string;
		isComplete: boolean;
		ageMinutes: number;
	}>;
} {
	const now = new Date();
	const entries = Array.from(delegationCacheMap.entries()).map(([, cache]) => ({
		username: cache.username,
		operationsCount: cache.operations.length,
		fetchedAt: cache.fetchedAt.toISOString(),
		toBlockDate: cache.toBlockDate || 'sin límite (hasta hoy)',
		isComplete: cache.isComplete,
		ageMinutes: Math.round((now.getTime() - cache.fetchedAt.getTime()) / (1000 * 60)),
	}));

	return {
		totalEntries: delegationCacheMap.size,
		entries,
	};
}

export async function getDelegationsWithFilters(
	username: string,
	filters: OptimizedDelegationFilters
): Promise<OptimizedDelegationsResult> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - filters.timePeriod);
	const targetToBlock = getDateStringForAPI(cutoffDate);

	const operations = await getOperationsWithIntelligentCache(
		username,
		targetToBlock,
		filters.timePeriod
	);

	const processedDelegations = await processDelegationOperationsForCalculate(
		operations,
		username,
		filters,
		cutoffDate
	);

	return calculateDelegationStats(
		processedDelegations,
		filters,
		cutoffDate.toISOString()
	);
}

async function getOperationsWithIntelligentCache(
	username: string,
	targetToBlock: string,
	timePeriod: number
): Promise<DelegationOperationResponse['operations_result']> {
	const cacheKey = username.toLowerCase();
	const now = new Date();

	const cached = delegationCacheMap.get(cacheKey);

	if (cached && now.getTime() - cached.fetchedAt.getTime() < DELEGATION_CACHE_DURATION) {
		if (canUseCachedData(cached, targetToBlock)) {
			return cached.operations;
		}
	}

	const strategy = determineDataFetchingStrategy(cached, targetToBlock, timePeriod);

	let operations: DelegationOperationResponse['operations_result'];

	if (strategy.type === 'fetch_new') {
		operations = await fetchDelegationOperationsWithLimit(
			username,
			strategy.toBlock || '',
			strategy.maxPages
		);
	} else if (strategy.type === 'extend_cache') {
		const newOperations = await fetchDelegationOperationsWithLimit(
			username,
			strategy.toBlock || '',
			strategy.maxPages
		);
		operations = [...(cached?.operations || []), ...newOperations];

		const seen = new Set<string>();
		operations = operations.filter(op => {
			if (seen.has(op.operation_id)) {
				return false;
			}
			seen.add(op.operation_id);
			return true;
		});
	} else {
		operations = cached?.operations || [];
	}

	updateDelegationCache(username, operations, strategy.toBlock || '', strategy.isComplete);

	return operations;
}

function canUseCachedData(
	cached: DelegationCache,
	targetToBlock: string
): boolean {
	if (!cached.toBlockDate || cached.toBlockDate === '') {
		return true;
	}

	if (!targetToBlock || targetToBlock === '') {
		return false;
	}

	const cachedDate = new Date(cached.toBlockDate);
	const targetDate = new Date(targetToBlock);

	return cachedDate <= targetDate;
}

interface DataFetchingStrategy {
	type: 'fetch_new' | 'extend_cache' | 'filter_cache';
	description: string;
	toBlock?: string;
	maxPages?: number;
	isComplete: boolean;
}

function determineDataFetchingStrategy(
	cached: DelegationCache | undefined,
	targetToBlock: string,
	timePeriod: number
): DataFetchingStrategy {
	if (!cached) {
		return {
			type: 'fetch_new',
			description: `Obtener datos nuevos hasta ${targetToBlock || 'hoy'} (sin cache)`,
			toBlock: targetToBlock,
			maxPages: getMaxPagesForPeriod(timePeriod),
			isComplete: false,
		};
	}

	if ((!cached.toBlockDate || cached.toBlockDate === '') && targetToBlock) {
		return {
			type: 'filter_cache',
			description: `Filtrar cache completo hasta ${targetToBlock}`,
			isComplete: true,
		};
	}

	if (cached.toBlockDate && (!targetToBlock || targetToBlock === '')) {
		return {
			type: 'fetch_new',
			description: `Obtener datos completos hasta hoy (cache obsoleto con fecha ${cached.toBlockDate})`,
			toBlock: '',
			maxPages: getMaxPagesForPeriod(timePeriod),
			isComplete: false,
		};
	}

	if (cached.toBlockDate && targetToBlock) {
		const cachedDate = new Date(cached.toBlockDate);
		const targetDate = new Date(targetToBlock);

		if (cachedDate <= targetDate) {
			return {
				type: 'filter_cache',
				description: `Usar cache existente (${cached.toBlockDate} <= ${targetToBlock})`,
				isComplete: true,
			};
		} else {
			return {
				type: 'fetch_new',
				description: `Obtener datos hasta ${targetToBlock} (cache tiene fecha posterior)`,
				toBlock: targetToBlock,
				maxPages: getMaxPagesForPeriod(timePeriod),
				isComplete: false,
			};
		}
	}

	return {
		type: 'fetch_new',
		description: 'Estrategia por defecto - obtener datos nuevos',
		toBlock: targetToBlock,
		maxPages: getMaxPagesForPeriod(timePeriod),
		isComplete: false,
	};
}

function getMaxPagesForPeriod(timePeriod: number): number {
	if (timePeriod <= 7) return 10;
	if (timePeriod <= 30) return 25;
	if (timePeriod <= 90) return 50;
	return 100;
}

function updateDelegationCache(
	username: string,
	operations: DelegationOperationResponse['operations_result'],
	toBlockDate: string,
	isComplete: boolean
): void {
	const cacheKey = username.toLowerCase();

	delegationCacheMap.set(cacheKey, {
		username,
		operations,
		fetchedAt: new Date(),
		toBlockDate,
		isComplete,
	});
}

const DELEGATION_OPERATION_TYPE = '40';
const DEFAULT_PAGE_SIZE = 200;
const DEFAULT_DATA_SIZE_LIMIT = 150000;

export async function fetchDelegationOperationsComplete(
	username: string,
	toBlockDate: string
): Promise<DelegationOperationResponse['operations_result']> {
	const allOperations: DelegationOperationResponse['operations_result'] = [];

	if (!username) {
		throw new Error('username is required');
	}

	const cachedProps = await getGlobalPropsWithCache();
	const chainWithFailover = cachedProps.chainWithFailover;

	const chainExtendedRestApi = {
		'hafah-api': {
			accounts: {
				operations: {
					urlPath: '{accountName}/operations',
				},
			},
		},
	};

	const baseQuery: Record<string, string | number> = {
		accountName: username,
		'operation-types': DELEGATION_OPERATION_TYPE,
		'page-size': DEFAULT_PAGE_SIZE,
		'data-size-limit': DEFAULT_DATA_SIZE_LIMIT,
	};

	if (toBlockDate && toBlockDate !== '') {
		baseQuery['to-block'] = toBlockDate;
	}

	let currentPage = 1;
	let totalPages = 1;
	let hasMorePages = true;

	while (hasMorePages) {
		const query = { ...baseQuery };

		if (currentPage > 1) {
			query['page'] = currentPage;
		}

		const data = await chainWithFailover.executeRestWithFailover(
			async (chain) => {
				const extended: TWaxRestExtended<typeof chainExtendedRestApi> =
					chain.extendRest(chainExtendedRestApi);
				return (extended.restApi as any)['hafah-api'].accounts.operations(query) as DelegationOperationResponse;
			},
			`fetchDelegationOperations(${username}, page ${currentPage})`
		);

		if (currentPage === 1) {
			totalPages = data.total_pages || 1;
		}

		const operations = data.operations_result || [];

		allOperations.push(...operations);

		hasMorePages = currentPage < totalPages;
		currentPage++;

		if (hasMorePages) {
			const delay = Math.min(500 + currentPage * 50, 1000);
			await new Promise(resolve => setTimeout(resolve, delay));
		}
	}

	return allOperations;
}

export async function fetchDelegationOperationsOptimized(
	username: string,
	toBlockDate: string
): Promise<DelegationOperationResponse['operations_result']> {
	return await fetchDelegationOperationsComplete(username, toBlockDate);
}

export async function fetchDelegationOperationsWithLimit(
	username: string,
	toBlockDate: string,
	_maxPages?: number
): Promise<DelegationOperationResponse['operations_result']> {
	return await fetchDelegationOperationsComplete(username, toBlockDate);
}

async function processDelegationOperationsForCalculate(
	operations: DelegationOperationResponse['operations_result'],
	username: string,
	_filters: OptimizedDelegationFilters,
	cutoffDate: Date
): Promise<Map<string, DelegatorInfo>> {
	const delegatorsMap = new Map<string, DelegatorInfo>();

	for (const operation of operations) {
		const { delegator, delegatee, vesting_shares } = operation.op.value;
		const operationDate = new Date(operation.timestamp);

		if (delegator === username || delegatee !== username) {
			continue;
		}

		if (operationDate < cutoffDate) {
			continue;
		}

		const vestingAmount = vesting_shares.amount;
		const currentHP = await vestsToHP(`${vestingAmount} VESTS`);

		const existingInfo = delegatorsMap.get(delegator);

		if (!existingInfo || operation.timestamp > existingInfo.timestamp) {
			delegatorsMap.set(delegator, {
				delegator,
				currentHP,
				vestingShares: `${vestingAmount} VESTS`,
				timestamp: operation.timestamp,
				trx_id: operation.trx_id,
				block_num: operation.block,
				operation_id: operation.operation_id,
				participationPercentage: 0,
			});
		}
	}

	const activeDelegators = new Map<string, DelegatorInfo>();
	for (const [delegator, info] of delegatorsMap.entries()) {
		if (info.currentHP > 0) {
			activeDelegators.set(delegator, info);
		}
	}

	return activeDelegators;
}

function calculateDelegationStats(
	delegatorsMap: Map<string, DelegatorInfo>,
	filters: OptimizedDelegationFilters,
	timeRangeStart: string
): OptimizedDelegationsResult {
	const allDelegators = Array.from(delegatorsMap.values());
	const excludedDelegators: string[] = [];
	const belowMinimumDelegators: string[] = [];
	const activeDelegations: DelegatorInfo[] = [];

	for (const delegator of allDelegators) {
		if (filters.excludedUsers.includes(delegator.delegator)) {
			excludedDelegators.push(delegator.delegator);
			continue;
		}

		if (delegator.currentHP < filters.minimumHP) {
			belowMinimumDelegators.push(delegator.delegator);
			continue;
		}

		if (delegator.currentHP > 0) {
			activeDelegations.push(delegator);
		}
	}

	const totalDelegationsHP = activeDelegations.reduce((sum, d) => sum + d.currentHP, 0);

	activeDelegations.forEach(delegation => {
		delegation.participationPercentage =
			totalDelegationsHP > 0 ? (delegation.currentHP / totalDelegationsHP) * 100 : 0;
	});

	activeDelegations.sort((a, b) => b.currentHP - a.currentHP);

	return {
		activeDelegations,
		totalDelegationsHP,
		totalDelegators: activeDelegations.length,
		excludedDelegators,
		belowMinimumDelegators,
		metadata: {
			totalOperationsFound: allDelegators.length,
			operationsInTimeRange: allDelegators.length,
			processedDelegators: allDelegators.length,
			filteredByMinHP: belowMinimumDelegators.length,
			filteredByExclusion: excludedDelegators.length,
			timeRangeStart,
			timeRangeEnd: new Date().toISOString(),
		},
	};
}

export interface OutgoingDelegation {
	delegatee: string;
	amount: string;
	operation_id: string;
	block_num: number;
}

export interface IncomingDelegation {
	delegator: string;
	amount: string;
	operation_id: string;
	block_num: number;
}

export interface BalanceApiDelegationsResponse {
	outgoing_delegations: OutgoingDelegation[];
	incoming_delegations: IncomingDelegation[];
}

export interface DelegationWithDetails extends IncomingDelegation {
	hpAmount?: number;
	timestamp?: string;
	date?: Date;
	trx_id?: string;
	operation_details?: unknown;
}

const BALANCE_API_CONFIG = {
	'balance-api': {
		accounts: {
			delegations: {
				urlPath: '{accountName}/delegations',
			},
		},
	},
} as const;

export async function getAllDelegationsIncoming(
	delegatorAccount: string
): Promise<IncomingDelegation[]> {
	try {
		const chainWithFailover = await getHiveChain();

		const response = await chainWithFailover.executeRestWithFailover(
			async (chain) => {
				const extendedHiveChain = chain.extendRest(BALANCE_API_CONFIG);
				return (extendedHiveChain.restApi as any)['balance-api'].accounts.delegations({
					accountName: delegatorAccount,
				});
			},
			`getAllDelegationsIncoming(${delegatorAccount})`
		);

		if (!response || typeof response !== 'object') {
			return [];
		}

		const balanceResponse = response as BalanceApiDelegationsResponse;
		return balanceResponse.incoming_delegations || [];
	} catch (error) {
		console.error(`Error fetching vesting delegations for ${delegatorAccount}:`, error);
		return [];
	}
}

export async function convertDelegationsToHP(
	delegations: IncomingDelegation[]
): Promise<Array<IncomingDelegation & { hpAmount: number }>> {
	if (delegations.length === 0) return [];

	try {
		const cachedProps = await getGlobalPropsWithCache();
		const chain = cachedProps.chainWithFailover.getChain();

		return delegations.map(delegation => {
			try {
				const hpAmount = chain.vestsToHp(
					delegation.amount,
					cachedProps.total_vesting_fund_hive,
					cachedProps.total_vesting_shares
				);

				return {
					...delegation,
					hpAmount: parseFloat(hpAmount.amount) / 1000,
				};
			} catch {
				const vestsAmount = parseFloat(delegation.amount);
				return {
					...delegation,
					hpAmount: vestsAmount * FALLBACK_VESTS_TO_HP_RATIO,
				};
			}
		});
	} catch (error) {
		console.error('Error en conversión en lote:', error);

		return delegations.map(delegation => ({
			...delegation,
			hpAmount: parseFloat(delegation.amount) * FALLBACK_VESTS_TO_HP_RATIO,
		}));
	}
}

const HAFSQL_API_BASE_URL = 'https://hafsql-api.mahdiyari.info';
const HAFSQL_DELEGATION_LIMIT = 100;

interface HafSqlDelegation {
	delegator: string;
	vests: string;
	hp_equivalent: string;
	timestamp: string;
}

export async function getAllDelegationsWithDetails(
	username: string
): Promise<DelegationWithDetails[]> {
	try {
		const allDelegations: DelegationWithDetails[] = [];
		let startTimestamp: string | null = null;
		let hasMore = true;

		while (hasMore) {
			const url = startTimestamp
				? `${HAFSQL_API_BASE_URL}/delegations/${username}/incoming?limit=${HAFSQL_DELEGATION_LIMIT}&start=${encodeURIComponent(startTimestamp)}`
				: `${HAFSQL_API_BASE_URL}/delegations/${username}/incoming?limit=${HAFSQL_DELEGATION_LIMIT}`;

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data: HafSqlDelegation[] = await response.json();

			if (data.length === 0) {
				hasMore = false;
				break;
			}

			const pageDelegations: DelegationWithDetails[] = data.map((del) => ({
				delegator: del.delegator,
				amount: del.vests,
				operation_id: '',
				block_num: 0,
				hpAmount: parseFloat(del.hp_equivalent),
				timestamp: del.timestamp,
				date: new Date(del.timestamp),
			}));

			allDelegations.push(...pageDelegations);

			if (data.length < HAFSQL_DELEGATION_LIMIT) {
				hasMore = false;
			} else {
				const lastDelegation = data[data.length - 1];
				startTimestamp = lastDelegation?.timestamp ?? null;

				if (!startTimestamp) {
					hasMore = false;
				}

				await new Promise(resolve => setTimeout(resolve, 100));
			}
		}

		return allDelegations;
	} catch (error) {
		console.error('Error obteniendo delegaciones desde HafSQL:', error);
		return getAllDelegationsWithDetailsLegacy(username);
	}
}

async function getAllDelegationsWithDetailsLegacy(
	username: string
): Promise<DelegationWithDetails[]> {
	try {
		const basicDelegations = await getAllDelegationsIncoming(username);

		if (basicDelegations.length === 0) {
			return [];
		}

		const delegationsWithHP = await convertDelegationsToHP(basicDelegations);

		return delegationsWithHP.map(delegation => ({
			...delegation,
		}));
	} catch (error) {
		console.error('Error en getAllDelegationsWithDetailsLegacy:', error);
		return [];
	}
}

export async function addFullDetailsToDelegationsOptimized(
	delegations: DelegationWithDetails[]
): Promise<DelegationWithDetails[]> {
	return delegations.map(delegation => ({
		...delegation,
		timestamp: undefined,
		date: undefined,
		trx_id: undefined,
		operation_details: undefined,
	}));
}

export function formatDelegationDate(timestamp: string): string {
	const date = new Date(timestamp);
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

export async function getDelegations(
	filters?: OptimizedDelegationFilters
): Promise<OptimizedDelegationsResult> {
	const { getCurrentAuthenticatedUser } = await import('./auth/guards.js');
	const authenticatedUser = getCurrentAuthenticatedUser();

	if (!authenticatedUser) {
		throw new Error('Usuario no autenticado. Debes iniciar sesión para obtener delegaciones.');
	}

	const defaultFilters: OptimizedDelegationFilters = {
		timePeriod: 30,
		minimumHP: 50,
		excludedUsers: [],
		...filters
	};

	return await getDelegationsWithFilters(authenticatedUser, defaultFilters);
}

export async function getDashboardDelegations(): Promise<DelegationWithDetails[]> {
	const { getCurrentAuthenticatedUser } = await import('./auth/guards.js');
	const authenticatedUser = getCurrentAuthenticatedUser();

	if (!authenticatedUser) {
		throw new Error('Usuario no autenticado. Debes iniciar sesión para obtener delegaciones del dashboard.');
	}

	return await getAllDelegationsWithDetails(authenticatedUser);
}

export async function getUserCurationStats(): Promise<CurationStatsResult> {
	const { getCurrentAuthenticatedUser } = await import('./auth/guards.js');
	const authenticatedUser = getCurrentAuthenticatedUser();

	if (!authenticatedUser) {
		throw new Error('Usuario no autenticado. Debes iniciar sesión para obtener estadísticas de curación.');
	}

	return await curationStats(authenticatedUser);
}

export async function getUserHistoryRewards(
	page?: number,
	fromDate?: Date
): Promise<CurationRewardsResponse | null> {
	const { getCurrentAuthenticatedUser } = await import('./auth/guards.js');
	const authenticatedUser = getCurrentAuthenticatedUser();

	if (!authenticatedUser) {
		throw new Error('Usuario no autenticado. Debes iniciar sesión para obtener historial de recompensas.');
	}

	return await getHistoryRewards(authenticatedUser, page, fromDate);
}
