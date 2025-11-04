/**
 * 🔐 AUTHENTICATION MODULE EXPORTS
 *
 * Public API for the authentication bounded context.
 * Only exports what other modules need to interact with this module.
 */

// Module configuration
export { AuthModule, createAuthModule, getAuthController, AUTH_TOKENS } from './config/AuthModule';

// Domain value objects (for use by other modules)
export { ValidUsername } from './domain/value-objects/ValidUsername';
export { SessionToken } from './domain/value-objects/SessionToken';

// Domain entities (for use by other modules)
export { UserSession, SessionStatus } from './domain/entities/UserSession';

// Primary adapter (for UI integration)
export { AuthController } from './adapters/primary/AuthController';

// Use case interfaces (for direct use if needed)
export type { LoginRequest, LoginResponse } from './application/LoginUseCase';
export type { LogoutRequest, LogoutResponse } from './application/LogoutUseCase';
export type {
  ValidateSessionRequest,
  ValidateSessionResponse,
} from './application/ValidateSessionUseCase';

// Port interfaces (for implementing custom adapters)
export type {
  AuthenticationGateway,
  AuthenticationChallenge,
  AuthenticationResult,
} from './domain/ports/AuthenticationGateway';
export type { SessionRepository } from './domain/ports/SessionRepository';

// Re-export common types
export type { KeyType } from './domain/ports/AuthenticationGateway';
