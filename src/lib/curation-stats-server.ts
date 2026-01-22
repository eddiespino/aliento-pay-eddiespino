import {
	getGlobalDynamicProperties,
	hafahApiCall,
	parseAsset,
	vestsToHp,
	type GlobalDynamicProperties,
} from './hive-http-client';

const CURATION_REWARD_OPERATION_TYPE = '52';
const CACHE_DURATION_MS = 5 * 60 * 1000;

interface GlobalPropsCache {
	props: GlobalDynamicProperties;
	timestamp: number;
}

interface CurationStatsCache {
	data: CurationStatsResult;
	timestamp: number;
}

export interface CurationStatsResult {
	total24Hr: number;
	total7D: number;
	total30D: number;
	rewards24Hr: CurationReward[];
	rewards7D: CurationReward[];
	rewards30D: CurationReward[];
}

interface CurationReward {
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

interface HafahCurationOperation {
	timestamp: string;
	block: number;
	trx_id: string | null;
	operation_id: string;
	op: {
		type: string;
		value: {
			reward?: { amount: string; precision: number; nai: string };
			curator?: string;
			author?: string;
			permlink?: string;
			payout_must_be_claimed?: boolean;
		};
	};
}

let globalPropsCache: GlobalPropsCache | null = null;
const curationStatsCache = new Map<string, CurationStatsCache>();

async function getGlobalPropsWithCache(): Promise<GlobalDynamicProperties> {
	const now = Date.now();

	if (globalPropsCache && now - globalPropsCache.timestamp < CACHE_DURATION_MS) {
		return globalPropsCache.props;
	}

	const props = await getGlobalDynamicProperties();
	globalPropsCache = { props, timestamp: now };

	return props;
}

function parseOperationToCurationReward(
	operation: HafahCurationOperation,
	globalProps: GlobalDynamicProperties
): CurationReward | null {
	if (operation.op.type !== 'curation_reward_operation') {
		return null;
	}

	const opValue = operation.op.value;
	const rewardVests = opValue.reward;

	if (!rewardVests || !rewardVests.amount || parseFloat(rewardVests.amount) <= 0) {
		return null;
	}

	const vestsParsed = parseAsset(rewardVests);
	const totalVestingFundHive = parseAsset(globalProps.total_vesting_fund_hive);
	const totalVestingShares = parseAsset(globalProps.total_vesting_shares);

	const hpReward = vestsToHp(vestsParsed, totalVestingFundHive, totalVestingShares);

	return {
		operationId: operation.operation_id,
		timestamp: operation.timestamp,
		blockNum: operation.block,
		trxId: operation.trx_id ?? '',
		reward: hpReward,
		rewardVests: Number(vestsParsed.amount) / Math.pow(10, vestsParsed.precision),
		curator: opValue.curator ?? '',
		author: opValue.author ?? '',
		permlink: opValue.permlink ?? '',
		mustBeClaimed: opValue.payout_must_be_claimed ?? false,
	};
}

export async function curationStatsServer(account: string): Promise<CurationStatsResult> {
	if (!account || account.trim() === '') {
		throw new Error('El nombre de cuenta es requerido');
	}

	const accountLower = account.toLowerCase().trim();

	const cacheKey = `curation-stats-${accountLower}`;
	const cachedData = curationStatsCache.get(cacheKey);
	if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION_MS) {
		return cachedData.data;
	}

	const now = new Date();
	const date24HoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const date7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	const fromBlockDate = date30DaysAgo.toISOString().split('T')[0]!;
	const toBlockDate = now.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');

	const globalProps = await getGlobalPropsWithCache();

	const processed24Hr = new Set<string>();
	const processed7D = new Set<string>();
	const processed30D = new Set<string>();

	const rewards24Hr: CurationReward[] = [];
	const rewards7D: CurationReward[] = [];
	const rewards30D: CurationReward[] = [];

	let currentPage = 1;
	let totalPages = 1;

	while (currentPage <= totalPages) {
		const response = await hafahApiCall(accountLower, CURATION_REWARD_OPERATION_TYPE, {
			page: currentPage,
			pageSize: 100,
			fromBlock: fromBlockDate,
			toBlock: toBlockDate,
		});

		if (!response || !response.operations_result || response.operations_result.length === 0) {
			break;
		}

		if (currentPage === 1) {
			totalPages = response.total_pages;
		}

		for (const rawOp of response.operations_result) {
			const operation = rawOp as unknown as HafahCurationOperation;
			const reward = parseOperationToCurationReward(operation, globalProps);
			if (!reward) continue;

			// API returns timestamps without timezone - treat as UTC
			const timestampUtc = reward.timestamp.endsWith('Z') ? reward.timestamp : reward.timestamp + 'Z';
			const rewardDate = new Date(timestampUtc);

			if (rewardDate >= date24HoursAgo && !processed24Hr.has(reward.operationId)) {
				processed24Hr.add(reward.operationId);
				rewards24Hr.push(reward);
			}

			if (rewardDate >= date7DaysAgo && !processed7D.has(reward.operationId)) {
				processed7D.add(reward.operationId);
				rewards7D.push(reward);
			}

			if (rewardDate >= date30DaysAgo && !processed30D.has(reward.operationId)) {
				processed30D.add(reward.operationId);
				rewards30D.push(reward);
			}
		}

		currentPage++;

		if (currentPage <= totalPages) {
			await new Promise(resolve => setTimeout(resolve, 50));
		}
	}

	const result: CurationStatsResult = {
		total24Hr: rewards24Hr.reduce((sum, r) => sum + r.reward, 0),
		total7D: rewards7D.reduce((sum, r) => sum + r.reward, 0),
		total30D: rewards30D.reduce((sum, r) => sum + r.reward, 0),
		rewards24Hr,
		rewards7D,
		rewards30D,
	};

	curationStatsCache.set(cacheKey, { data: result, timestamp: Date.now() });

	return result;
}
