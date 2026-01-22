import { HiveChainWithFailover, createHiveChainWithFailover } from './hive-chain-failover';

let hiveChainInstance: HiveChainWithFailover | null = null;
let initializationPromise: Promise<HiveChainWithFailover> | null = null;

export async function getHiveChain(): Promise<HiveChainWithFailover> {
	if (hiveChainInstance) {
		return hiveChainInstance;
	}

	if (initializationPromise) {
		return initializationPromise;
	}

	initializationPromise = createHiveChainWithFailover()
		.then(chain => {
			hiveChainInstance = chain;
			initializationPromise = null;
			return chain;
		})
		.catch(error => {
			initializationPromise = null;
			throw error;
		});

	return initializationPromise;
}

export function resetHiveChain(): void {
	hiveChainInstance = null;
	initializationPromise = null;
}

export function isHiveChainInitialized(): boolean {
	return hiveChainInstance !== null;
}
