/**
 * ✅ VALIDATE PAYMENT PARAMS USE CASE
 */

import { ValidUsername } from '../../authentication/domain/value-objects/ValidUsername';
import { Currency } from '../domain/value-objects/PaymentAmount';
import type {
  PaymentCalculationService,
  ValidationResult,
} from '../domain/ports/PaymentCalculationService';
import type { HiveDataGateway } from '../domain/ports/HiveDataGateway';

export interface ValidationRequest {
  readonly type: 'delegation' | 'curation' | 'single' | 'multiple';
  readonly params: Record<string, any>;
}

export interface ValidationResponse {
  readonly success: boolean;
  readonly valid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
  readonly error?: string;
}

export class ValidatePaymentParamsUseCase {
  constructor(
    private readonly calculationService: PaymentCalculationService,
    private readonly hiveDataGateway: HiveDataGateway
  ) {}

  async execute(request: ValidationRequest): Promise<ValidationResponse> {
    try {
      const validationResult = await this.calculationService.validateCalculationParams(
        request.params
      );

      return {
        success: true,
        valid: validationResult.valid,
        errors: validationResult.errors.map(e => e.message),
        warnings: validationResult.warnings.map(w => w.message),
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation error'],
        warnings: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
