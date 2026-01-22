import type { APIRoute } from 'astro';
import { getAuthenticatedUser } from '../../middleware';
import { curationStatsServer } from '../../lib/curation-stats-server';

export const prerender = false;

const API_TIMEOUT_MS = 25000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
	return Promise.race([
		promise,
		new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs)),
	]);
}

export const GET: APIRoute = async ({ request, locals }) => {
	const startTime = Date.now();

	try {
		const authenticatedUser = getAuthenticatedUser({ request, locals } as any);

		if (!authenticatedUser) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Autenticación requerida',
					authenticated: false,
					curation24h: 0,
					curation7d: 0,
					curation30d: 0,
					lastUpdate: new Date().toISOString(),
					timestamp: Date.now(),
				}),
				{
					status: 401,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		const curationStatsResult = await withTimeout(
			curationStatsServer(authenticatedUser),
			API_TIMEOUT_MS,
			`Timeout: curation stats took longer than ${API_TIMEOUT_MS}ms`
		);

		if (!curationStatsResult) {
			throw new Error('No se pudieron obtener las estadísticas de curación');
		}

		const elapsed = Date.now() - startTime;

		return new Response(
			JSON.stringify({
				success: true,
				user: authenticatedUser,
				curation24h: curationStatsResult.total24Hr,
				curation7d: curationStatsResult.total7D,
				curation30d: curationStatsResult.total30D,
				lastUpdate: new Date().toISOString(),
				timestamp: Date.now(),
				_elapsed: elapsed,
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'no-cache, must-revalidate',
				},
			}
		);
	} catch (error) {
		const elapsed = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
		const errorStack = error instanceof Error ? error.stack : undefined;

		console.error(`API CurationStats Error [${elapsed}ms]:`, errorMessage);
		if (errorStack) {
			console.error('Stack:', errorStack);
		}

		return new Response(
			JSON.stringify({
				success: false,
				error: errorMessage,
				curation24h: 0,
				curation7d: 0,
				curation30d: 0,
				lastUpdate: new Date().toISOString(),
				timestamp: Date.now(),
				_elapsed: elapsed,
				_errorType: error instanceof Error ? error.constructor.name : typeof error,
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
};
