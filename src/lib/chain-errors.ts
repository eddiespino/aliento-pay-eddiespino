const RECOVERABLE_ERROR_PATTERNS = [
	'network',
	'timeout',
	'fetch',
	'econnrefused',
	'econnreset',
	'etimedout',
	'enotfound',
	'socket hang up',
	'503',
	'502',
	'504',
	'500',
	'service unavailable',
	'bad gateway',
	'gateway timeout',
	'internal server error',
] as const;

const BUSINESS_ERROR_PATTERNS = [
	'missing required',
	'invalid account',
	'does not exist',
	'insufficient',
	'expired',
	'invalid signature',
	'invalid operation',
	'assert_exception',
	'bandwidth',
	'rc_exhausted',
] as const;

const RECOVERABLE_WAX_ERROR_NAMES = [
	'WaxRequestError',
	'WaxChainRequestError',
	'WaxRequestTimeoutError',
	'WaxTimeoutError',
] as const;

type RecoverableWaxErrorName = (typeof RECOVERABLE_WAX_ERROR_NAMES)[number];

interface ErrorLike {
	name?: string;
	message?: string;
	msg?: string;
	error?: unknown;
	constructor?: { name?: string };
}

function isErrorLike(value: unknown): value is ErrorLike {
	return typeof value === 'object' && value !== null;
}

function getErrorName(error: ErrorLike): string | undefined {
	return error.name ?? error.constructor?.name;
}

function extractErrorString(error: unknown): string {
	if (typeof error === 'string') return error;

	if (error instanceof Error) {
		return `${error.name}: ${error.message}`;
	}

	if (isErrorLike(error)) {
		const message = error.message ?? error.msg ?? error.error;

		if (typeof message === 'string') return message;
		if (typeof message === 'object' && message !== null) {
			return JSON.stringify(message);
		}
	}

	return String(error);
}

function hasRecoverableWaxErrorName(error: unknown): boolean {
	if (!isErrorLike(error)) return false;

	const name = getErrorName(error);
	return RECOVERABLE_WAX_ERROR_NAMES.includes(name as RecoverableWaxErrorName);
}

function isWaxInternalError(error: unknown): boolean {
	if (!isErrorLike(error)) return false;

	const name = getErrorName(error);
	if (name !== 'WaxChainApiError') return false;

	return extractErrorString(error).toLowerCase().includes('internal_error');
}

function matchesPattern(errorLower: string, patterns: readonly string[]): boolean {
	return patterns.some((pattern) => errorLower.includes(pattern));
}

export function isRecoverableChainError(error: unknown): boolean {
	if (!error) return false;

	const errorLower = extractErrorString(error).toLowerCase();

	if (matchesPattern(errorLower, BUSINESS_ERROR_PATTERNS)) {
		return false;
	}

	if (matchesPattern(errorLower, RECOVERABLE_ERROR_PATTERNS)) {
		return true;
	}

	if (hasRecoverableWaxErrorName(error)) return true;
	if (isWaxInternalError(error)) return true;

	return true;
}

export function formatErrorForLog(error: unknown): string {
	const errorString = extractErrorString(error);
	const recoverable = isRecoverableChainError(error);

	return `[${recoverable ? 'RECOVERABLE' : 'FATAL'}] ${errorString}`;
}
