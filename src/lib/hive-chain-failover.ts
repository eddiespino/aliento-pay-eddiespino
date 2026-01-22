import { createHiveChain, type IHiveChainInterface } from '@hiveio/wax';
import { isRecoverableChainError } from './chain-errors';

export const HIVE_RPC_NODES = [
	'https://api.hive.blog',
	'https://api.openhive.network',
	'https://api.deathwing.me',
	'https://rpc.mahdiyari.info',
] as const;

export const HIVE_REST_NODES = [
	'https://api.hive.blog',
	'https://api.syncad.com',
] as const;

const FAILOVER_CONFIG = {
	baseRetryDelay: 500,
	maxRetryDelay: 5000,
} as const;

export class HiveChainWithFailover {
	private chain: IHiveChainInterface;
	private currentNodeIndex = 0;
	private currentRestNodeIndex = 0;
	private readonly nodes: readonly string[];

	constructor(chain: IHiveChainInterface) {
		this.chain = chain;
		this.nodes = HIVE_RPC_NODES;
	}

	getChain(): IHiveChainInterface {
		return this.chain;
	}

	getCurrentNode(): string {
		return this.nodes[this.currentNodeIndex] ?? HIVE_RPC_NODES[0];
	}

	getCurrentRestNode(): string {
		return HIVE_REST_NODES[this.currentRestNodeIndex] ?? HIVE_REST_NODES[0];
	}

	private switchNode(): void {
		this.currentNodeIndex = (this.currentNodeIndex + 1) % this.nodes.length;
		this.chain.endpointUrl = this.getCurrentNode();
	}

	private switchRestNode(): void {
		this.currentRestNodeIndex = (this.currentRestNodeIndex + 1) % HIVE_REST_NODES.length;
	}

	private calculateDelayWithJitter(attempt: number): number {
		const exponentialDelay = FAILOVER_CONFIG.baseRetryDelay * Math.pow(2, attempt);
		const jitter = Math.random() * 0.3 * exponentialDelay;
		return Math.min(exponentialDelay + jitter, FAILOVER_CONFIG.maxRetryDelay);
	}

	async executeWithFailover<T>(
		operation: (chain: IHiveChainInterface) => Promise<T>,
		operationName = 'operation'
	): Promise<T> {
		const maxRetries = this.nodes.length * 2;
		let lastError: unknown;
		let nodesTriedInCurrentRound = 0;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				return await operation(this.chain);
			} catch (error) {
				lastError = error;

				if (!isRecoverableChainError(error)) {
					throw error;
				}

				this.switchNode();
				nodesTriedInCurrentRound++;

				if (nodesTriedInCurrentRound >= this.nodes.length) {
					nodesTriedInCurrentRound = 0;
					const delay = this.calculateDelayWithJitter(Math.floor(attempt / this.nodes.length));
					await this.sleep(delay);
				}
			}
		}

		throw lastError ?? new Error(`${operationName} failed after ${maxRetries} attempts`);
	}

	async executeRestWithFailover<T>(
		operation: (chain: IHiveChainInterface) => Promise<T>,
		operationName = 'REST operation'
	): Promise<T> {
		const maxRetries = HIVE_REST_NODES.length * 2;
		let lastError: unknown;
		let nodesTriedInCurrentRound = 0;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			const currentNode = this.getCurrentRestNode();

			try {
				const restChain = await createHiveChain({
					apiEndpoint: currentNode,
					restApiEndpoint: currentNode,
				});

				return await operation(restChain);
			} catch (error) {
				lastError = error;

				if (!isRecoverableChainError(error)) {
					throw error;
				}

				this.switchRestNode();
				nodesTriedInCurrentRound++;

				if (nodesTriedInCurrentRound >= HIVE_REST_NODES.length) {
					nodesTriedInCurrentRound = 0;
					const delay = this.calculateDelayWithJitter(Math.floor(attempt / HIVE_REST_NODES.length));
					await this.sleep(delay);
				}
			}
		}

		throw lastError ?? new Error(`${operationName} failed after ${maxRetries} attempts`);
	}

	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

export async function createHiveChainWithFailover(
	nodeUrl: string = HIVE_RPC_NODES[0]
): Promise<HiveChainWithFailover> {
	const chain = await createHiveChain({
		apiEndpoint: nodeUrl,
		restApiEndpoint: HIVE_REST_NODES[0],
	});
	return new HiveChainWithFailover(chain);
}
