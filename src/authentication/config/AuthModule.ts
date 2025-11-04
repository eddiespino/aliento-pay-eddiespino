/**
 * 📦 AUTHENTICATION MODULE
 *
 * Module configuration for the authentication bounded context.
 * Registers all dependencies and configures the DI container.
 */

import { BaseModule } from '../../shared/kernel/Module';
import { createServiceToken } from '../../shared/kernel/Container';
import type { Container } from '../../shared/kernel/Container';

// Domain ports
import type { AuthenticationGateway } from '../domain/ports/AuthenticationGateway';
import type { SessionRepository } from '../domain/ports/SessionRepository';

// Application use cases
import { LoginUseCase } from '../application/LoginUseCase';
import { LogoutUseCase } from '../application/LogoutUseCase';
import { ValidateSessionUseCase } from '../application/ValidateSessionUseCase';

// Infrastructure adapters
import { KeychainAuthGateway } from '../adapters/secondary/KeychainAuthGateway';
import { BrowserSessionRepository } from '../adapters/secondary/BrowserSessionRepository';

// Primary adapters
import { AuthController } from '../adapters/primary/AuthController';

// Service tokens for type-safe dependency injection
export const AUTH_TOKENS = {
  // Ports
  AuthenticationGateway: createServiceToken<AuthenticationGateway>('AuthenticationGateway'),
  SessionRepository: createServiceToken<SessionRepository>('SessionRepository'),

  // Use Cases
  LoginUseCase: createServiceToken<LoginUseCase>('LoginUseCase'),
  LogoutUseCase: createServiceToken<LogoutUseCase>('LogoutUseCase'),
  ValidateSessionUseCase: createServiceToken<ValidateSessionUseCase>('ValidateSessionUseCase'),

  // Controllers
  AuthController: createServiceToken<AuthController>('AuthController'),
} as const;

export class AuthModule extends BaseModule {
  async configure(container: Container): Promise<void> {
    // Register secondary adapters (implementations of ports)
    container.registerSingleton(AUTH_TOKENS.AuthenticationGateway, {
      create: () => new KeychainAuthGateway(),
    });

    container.registerSingleton(AUTH_TOKENS.SessionRepository, {
      create: () => new BrowserSessionRepository(this.isDevelopment(container)),
    });

    // Register use cases
    container.registerFactory(AUTH_TOKENS.LoginUseCase, async container => {
      const authGateway = await container.resolve(AUTH_TOKENS.AuthenticationGateway);
      const sessionRepo = await container.resolve(AUTH_TOKENS.SessionRepository);
      return new LoginUseCase(authGateway, sessionRepo);
    });

    container.registerFactory(AUTH_TOKENS.LogoutUseCase, async container => {
      const sessionRepo = await container.resolve(AUTH_TOKENS.SessionRepository);
      return new LogoutUseCase(sessionRepo);
    });

    container.registerFactory(AUTH_TOKENS.ValidateSessionUseCase, async container => {
      const sessionRepo = await container.resolve(AUTH_TOKENS.SessionRepository);
      return new ValidateSessionUseCase(sessionRepo);
    });

    // Register primary adapters (controllers)
    container.registerFactory(AUTH_TOKENS.AuthController, async container => {
      const [loginUseCase, logoutUseCase, validateSessionUseCase] = await Promise.all([
        container.resolve(AUTH_TOKENS.LoginUseCase),
        container.resolve(AUTH_TOKENS.LogoutUseCase),
        container.resolve(AUTH_TOKENS.ValidateSessionUseCase),
      ]);

      return new AuthController({
        loginUseCase,
        logoutUseCase,
        validateSessionUseCase,
      });
    });
  }
}

/**
 * Convenience factory for creating pre-configured auth module
 */
export function createAuthModule(): AuthModule {
  return new AuthModule();
}

/**
 * Helper to get auth controller from container
 */
export async function getAuthController(container: Container): Promise<AuthController> {
  return await container.resolve(AUTH_TOKENS.AuthController);
}
