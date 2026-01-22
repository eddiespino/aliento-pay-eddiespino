const HIVE_RPC_NODES = [
	'https://api.hive.blog',
	'https://api.openhive.network',
	'https://api.deathwing.me',
	'https://rpc.mahdiyari.info',
] as const;

const HIVE_REST_NODES = ['https://api.hive.blog', 'https://api.syncad.com'] as const;

const RECOVERABLE_ERROR_PATTERNS = [
	'network',
	'timeout',
	'fetch',
	'econnrefused',
	'503',
	'502',
	'504',
	'500',
] as const;

interface RPCResponse<T> {
	jsonrpc: string;
	id: number;
	result?: T;
	error?: { code: number; message: string };
}

interface GlobalDynamicProperties {
	total_vesting_fund_hive: string | { amount: string; precision: number; nai: string };
	total_vesting_shares: string | { amount: string; precision: number; nai: string };
}

interface HafahOperationsResponse {
	total_operations: number;
	total_pages: number;
	operations_result?: HafahOperation[];
}

interface HafahOperation {
	timestamp: string;
	block_num: number;
	trx_id: string;
	op: {
		type: string;
		value: {
			reward?: { amount: string; precision: number; nai: string };
			curator?: string;
			comment_author?: string;
			comment_permlink?: string;
			payout_must_be_claimed?: boolean;
		};
	};
}

function isRecoverableError(error: unknown): boolean {
	if (!error) return false;
	const errorStr = String(error).toLowerCase();
	return RECOVERABLE_ERROR_PATTERNS.some(pattern => errorStr.includes(pattern));
}

async function fetchWithRetry<T>(
	fetchFn: () => Promise<T>,
	maxRetries = 3,
	delayMs = 500
): Promise<T> {
	let lastError: unknown;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			return await fetchFn();
		} catch (error) {
			lastError = error;
			if (!isRecoverableError(error) || attempt === maxRetries - 1) {
				throw error;
			}
			await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
		}
	}

	throw lastError;
}

export async function rpcCall<T>(
	method: string,
	params: unknown = {}
): Promise<T> {
	let lastError: unknown;

	for (const node of HIVE_RPC_NODES) {
		try {
			const response = await fetchWithRetry(async () => {
				const res = await fetch(node, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						jsonrpc: '2.0',
						method,
						params,
						id: 1,
					}),
				});

				if (!res.ok) {
					throw new Error(`HTTP ${res.status}`);
				}

				const data: RPCResponse<T> = await res.json();

				if (data.error) {
					throw new Error(data.error.message);
				}

				return data.result as T;
			});

			return response;
		} catch (error) {
			lastError = error;
			if (!isRecoverableError(error)) {
				throw error;
			}
		}
	}

	throw lastError ?? new Error(`${method} failed on all nodes`);
}

export async function getGlobalDynamicProperties(): Promise<GlobalDynamicProperties> {
	return rpcCall<GlobalDynamicProperties>('condenser_api.get_dynamic_global_properties', []);
}

export async function hafahApiCall(
	account: string,
	operationType: string,
	options: {
		page?: number | null;
		pageSize?: number;
		fromBlock?: string;
		toBlock?: string;
	} = {}
): Promise<HafahOperationsResponse> {
	const { page, pageSize = 400, fromBlock, toBlock } = options;
	let lastError: unknown;

	for (const node of HIVE_REST_NODES) {
		try {
			const response = await fetchWithRetry(async () => {
				const params = new URLSearchParams({
					'operation-types': operationType,
					'page-size': String(pageSize),
					'data-size-limit': '200000',
				});

				if (page && page > 1) {
					params.append('page', String(page));
				}

				if (fromBlock) {
					params.append('from-block', fromBlock);
				}

				if (toBlock) {
					params.append('to-block', toBlock);
				}

				const url = `${node}/hafah-api/accounts/${account}/operations?${params.toString()}`;
				const res = await fetch(url);

				if (!res.ok) {
					throw new Error(`HTTP ${res.status}`);
				}

				return res.json();
			});

			return response as HafahOperationsResponse;
		} catch (error) {
			lastError = error;
			if (!isRecoverableError(error)) {
				throw error;
			}
		}
	}

	throw lastError ?? new Error(`hafah-api call failed on all nodes`);
}

interface ParsedAsset {
	amount: bigint;
	precision: number;
}

export function parseAsset(asset: string | { amount: string; precision: number }): ParsedAsset {
	if (typeof asset === 'string') {
		const match = asset.match(/^([\d.]+)\s+\w+$/);
		if (match) {
			const numStr = match[1] ?? '0';
			const parts = numStr.split('.');
			const precision = parts[1]?.length ?? 0;
			const amount = BigInt(numStr.replace('.', ''));
			return { amount, precision };
		}
		return { amount: BigInt(0), precision: 0 };
	}

	return {
		amount: BigInt(asset.amount),
		precision: asset.precision,
	};
}

export function vestsToHpBigInt(
	vests: ParsedAsset,
	totalVestingFundHive: ParsedAsset,
	totalVestingShares: ParsedAsset
): number {
	const numerator = vests.amount * totalVestingFundHive.amount * BigInt(Math.pow(10, totalVestingShares.precision));
	const denominator = totalVestingShares.amount * BigInt(Math.pow(10, vests.precision)) * BigInt(Math.pow(10, totalVestingFundHive.precision));

	if (denominator === BigInt(0)) return 0;

	const result = numerator / denominator;
	return Number(result);
}

export type { HafahOperation, HafahOperationsResponse, GlobalDynamicProperties };
