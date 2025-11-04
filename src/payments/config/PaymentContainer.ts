/**
 * 🏗️ PAYMENT MODULE CONTAINER
 *
 * Dependency injection configuration for payments module.
 * Registers all payment-related services and their dependencies.
 */

import type { Container } from '../../shared/kernel/Container';

// Domain
import type { PaymentRepository } from '../domain/ports/PaymentRepository';
import type { PaymentGateway } from '../domain/ports/PaymentGateway';
import type { HiveDataGateway } from '../domain/ports/HiveDataGateway';
import type { PaymentCalculationService } from '../domain/ports/PaymentCalculationService';

// Application
import { ExecuteMultipleTransfersUseCase } from '../application/ExecuteMultipleTransfersUseCase';
import { ProcessSinglePaymentUseCase } from '../application/ProcessSinglePaymentUseCase';
import { CalculatePaymentDistributionUseCase } from '../application/CalculatePaymentDistributionUseCase';
import { GetPaymentHistoryUseCase } from '../application/GetPaymentHistoryUseCase';
import { GetPaymentStatsUseCase } from '../application/GetPaymentStatsUseCase';
import { CancelPaymentUseCase } from '../application/CancelPaymentUseCase';
import { ValidatePaymentParamsUseCase } from '../application/ValidatePaymentParamsUseCase';

// Adapters
import { InMemoryPaymentRepository } from '../adapters/secondary/InMemoryPaymentRepository';
import { HivePaymentGateway } from '../adapters/secondary/HivePaymentGateway';
import { HiveHttpDataGateway } from '../adapters/secondary/HiveHttpDataGateway';
import { PaymentCalculationServiceImpl } from '../adapters/secondary/PaymentCalculationServiceImpl';
import { PaymentController } from '../adapters/primary/PaymentController';

/**
 * Service tokens for dependency injection
 */
export const PAYMENT_TOKENS = {
  // Repositories
  PaymentRepository: Symbol('PaymentRepository'),

  // Gateways
  PaymentGateway: Symbol('PaymentGateway'),
  HiveDataGateway: Symbol('HiveDataGateway'),

  // Services
  PaymentCalculationService: Symbol('PaymentCalculationService'),

  // Use Cases
  ExecuteMultipleTransfersUseCase: Symbol('ExecuteMultipleTransfersUseCase'),
  ProcessSinglePaymentUseCase: Symbol('ProcessSinglePaymentUseCase'),
  CalculatePaymentDistributionUseCase: Symbol('CalculatePaymentDistributionUseCase'),
  GetPaymentHistoryUseCase: Symbol('GetPaymentHistoryUseCase'),
  GetPaymentStatsUseCase: Symbol('GetPaymentStatsUseCase'),
  CancelPaymentUseCase: Symbol('CancelPaymentUseCase'),
  ValidatePaymentParamsUseCase: Symbol('ValidatePaymentParamsUseCase'),

  // Controllers
  PaymentController: Symbol('PaymentController'),
} as const;

/**
 * Register payment module dependencies
 */
export function registerPaymentDependencies(container: Container): void {
  // Register repositories
  container.register(PAYMENT_TOKENS.PaymentRepository, {
    useClass: InMemoryPaymentRepository,
    lifecycle: 'singleton',
  });

  // Register gateways
  container.register(PAYMENT_TOKENS.HiveDataGateway, {
    useClass: HiveHttpDataGateway,
    lifecycle: 'singleton',
  });

  container.register(PAYMENT_TOKENS.PaymentGateway, {
    useClass: HivePaymentGateway,
    lifecycle: 'singleton',
    dependencies: [PAYMENT_TOKENS.HiveDataGateway],
  });

  // Register services
  container.register(PAYMENT_TOKENS.PaymentCalculationService, {
    useClass: PaymentCalculationServiceImpl,
    lifecycle: 'singleton',
    dependencies: [PAYMENT_TOKENS.HiveDataGateway],
  });

  // Register use cases
  container.register(PAYMENT_TOKENS.ExecuteMultipleTransfersUseCase, {
    useClass: ExecuteMultipleTransfersUseCase,
    lifecycle: 'singleton',
    dependencies: [PAYMENT_TOKENS.PaymentRepository, PAYMENT_TOKENS.PaymentGateway],
  });

  container.register(PAYMENT_TOKENS.ProcessSinglePaymentUseCase, {
    useClass: ProcessSinglePaymentUseCase,
    lifecycle: 'singleton',
    dependencies: [PAYMENT_TOKENS.PaymentRepository, PAYMENT_TOKENS.PaymentGateway],
  });

  container.register(PAYMENT_TOKENS.CalculatePaymentDistributionUseCase, {
    useClass: CalculatePaymentDistributionUseCase,
    lifecycle: 'singleton',
    dependencies: [PAYMENT_TOKENS.PaymentCalculationService, PAYMENT_TOKENS.HiveDataGateway],
  });

  container.register(PAYMENT_TOKENS.GetPaymentHistoryUseCase, {
    useClass: GetPaymentHistoryUseCase,
    lifecycle: 'singleton',
    dependencies: [PAYMENT_TOKENS.PaymentRepository],
  });

  container.register(PAYMENT_TOKENS.GetPaymentStatsUseCase, {
    useClass: GetPaymentStatsUseCase,
    lifecycle: 'singleton',
    dependencies: [PAYMENT_TOKENS.PaymentRepository],
  });

  container.register(PAYMENT_TOKENS.CancelPaymentUseCase, {
    useClass: CancelPaymentUseCase,
    lifecycle: 'singleton',
    dependencies: [PAYMENT_TOKENS.PaymentRepository, PAYMENT_TOKENS.PaymentGateway],
  });

  container.register(PAYMENT_TOKENS.ValidatePaymentParamsUseCase, {
    useClass: ValidatePaymentParamsUseCase,
    lifecycle: 'singleton',
    dependencies: [PAYMENT_TOKENS.PaymentCalculationService, PAYMENT_TOKENS.HiveDataGateway],
  });

  // Register controllers
  container.register(PAYMENT_TOKENS.PaymentController, {
    useClass: PaymentController,
    lifecycle: 'singleton',
    dependencies: [
      PAYMENT_TOKENS.ExecuteMultipleTransfersUseCase,
      PAYMENT_TOKENS.ProcessSinglePaymentUseCase,
      PAYMENT_TOKENS.CalculatePaymentDistributionUseCase,
      PAYMENT_TOKENS.GetPaymentHistoryUseCase,
      PAYMENT_TOKENS.GetPaymentStatsUseCase,
      PAYMENT_TOKENS.CancelPaymentUseCase,
      PAYMENT_TOKENS.ValidatePaymentParamsUseCase,
    ],
  });
}

/**
 * Payment module factory methods
 */
export class PaymentModule {
  static getExecuteMultipleTransfersUseCase(container: Container): ExecuteMultipleTransfersUseCase {
    return container.resolve(PAYMENT_TOKENS.ExecuteMultipleTransfersUseCase);
  }

  static getProcessSinglePaymentUseCase(container: Container): ProcessSinglePaymentUseCase {
    return container.resolve(PAYMENT_TOKENS.ProcessSinglePaymentUseCase);
  }

  static getCalculatePaymentDistributionUseCase(
    container: Container
  ): CalculatePaymentDistributionUseCase {
    return container.resolve(PAYMENT_TOKENS.CalculatePaymentDistributionUseCase);
  }

  static getGetPaymentHistoryUseCase(container: Container): GetPaymentHistoryUseCase {
    return container.resolve(PAYMENT_TOKENS.GetPaymentHistoryUseCase);
  }

  static getGetPaymentStatsUseCase(container: Container): GetPaymentStatsUseCase {
    return container.resolve(PAYMENT_TOKENS.GetPaymentStatsUseCase);
  }

  static getCancelPaymentUseCase(container: Container): CancelPaymentUseCase {
    return container.resolve(PAYMENT_TOKENS.CancelPaymentUseCase);
  }

  static getValidatePaymentParamsUseCase(container: Container): ValidatePaymentParamsUseCase {
    return container.resolve(PAYMENT_TOKENS.ValidatePaymentParamsUseCase);
  }

  static getPaymentController(container: Container): PaymentController {
    return container.resolve(PAYMENT_TOKENS.PaymentController);
  }
}
