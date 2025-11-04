import type { ProcessedDelegation, DelegationProcessingResult } from '../lib/get-delegations.ts';

/**
 * Interface para los parámetros de cálculo de pago
 */
export interface PaymentCalculationParams {
  interestPercentage: number;
  hivePowerToConsider: number;
}

/**
 * Interface para el resultado del cálculo de pago
 */
export interface PaymentCalculationResult {
  totalAmount: number;
  paymentPerDelegator: PaymentPerDelegator[];
  summary: PaymentSummary;
}

/**
 * Interface para el pago individual por delegador
 */
export interface PaymentPerDelegator {
  readonly delegator: string;
  readonly delegatedHP: number;
  readonly paymentAmount: number;
  readonly percentage: number;
}

/**
 * Interface para el resumen del pago
 */
export interface PaymentSummary {
  readonly totalRecipients: number;
  readonly totalHiveToDistribute: number;
  readonly averagePayment: number;
  readonly percentageDistributed: number;
}

/**
 * Clase principal para el cálculo de pagos de curación
 * Implementa el patrón Service con inyección de dependencias
 */
export class PaymentCalculatorService {
  private readonly PRECISION_DECIMALS = 3;
  private readonly MIN_PAYMENT_AMOUNT = 0.001; // Mínimo pago en HIVE

  /**
   * Calcula los pagos de curación basados en delegaciones y parámetros
   */
  public calculatePayments(
    delegationsResult: DelegationProcessingResult,
    params: PaymentCalculationParams
  ): PaymentCalculationResult {
    this.validateCalculationParams(params);

    if (delegationsResult.activeDelegations.length === 0) {
      return this.createEmptyResult();
    }

    const totalAmount = this.calculateTotalAmount(params);
    const paymentPerDelegator = this.calculateIndividualPayments(
      delegationsResult.activeDelegations,
      totalAmount,
      delegationsResult.totalDelegationsHP
    );

    const summary = this.createPaymentSummary(
      paymentPerDelegator,
      totalAmount,
      delegationsResult.totalDelegationsHP,
      params.hivePowerToConsider
    );

    return {
      totalAmount,
      paymentPerDelegator,
      summary,
    };
  }

  /**
   * Calcula el monto total a distribuir
   */
  private calculateTotalAmount(params: PaymentCalculationParams): number {
    const amount = (params.hivePowerToConsider * params.interestPercentage) / 100;
    return this.roundToPrecision(amount);
  }

  /**
   * Calcula los pagos individuales para cada delegador
   */
  private calculateIndividualPayments(
    delegations: ProcessedDelegation[],
    totalAmount: number,
    totalDelegationsHP: number
  ): PaymentPerDelegator[] {
    if (totalDelegationsHP <= 0) {
      throw new Error('El total de HP delegado debe ser mayor que 0');
    }

    const payments: PaymentPerDelegator[] = [];

    for (const delegation of delegations) {
      const percentage = (delegation.hpAmount / totalDelegationsHP) * 100;
      const paymentAmount = (delegation.hpAmount / totalDelegationsHP) * totalAmount;
      
      // Solo incluir pagos que sean mayores al mínimo
      if (paymentAmount >= this.MIN_PAYMENT_AMOUNT) {
        payments.push({
          delegator: delegation.delegator,
          delegatedHP: this.roundToPrecision(delegation.hpAmount),
          paymentAmount: this.roundToPrecision(paymentAmount),
          percentage: this.roundToPrecision(percentage, 2),
        });
      }
    }

    // Ordenar por monto de pago descendente
    return payments.sort((a, b) => b.paymentAmount - a.paymentAmount);
  }

  /**
   * Crea el resumen de pagos
   */
  private createPaymentSummary(
    payments: PaymentPerDelegator[],
    totalAmount: number,
    totalDelegationsHP: number,
    hivePowerConsidered: number
  ): PaymentSummary {
    const actualDistributed = payments.reduce((sum, p) => sum + p.paymentAmount, 0);
    const averagePayment = payments.length > 0 ? actualDistributed / payments.length : 0;
    const percentageDistributed = (actualDistributed / totalAmount) * 100;

    return {
      totalRecipients: payments.length,
      totalHiveToDistribute: this.roundToPrecision(actualDistributed),
      averagePayment: this.roundToPrecision(averagePayment),
      percentageDistributed: this.roundToPrecision(percentageDistributed, 2),
    };
  }

  /**
   * Crea un resultado vacío para casos sin delegaciones
   */
  private createEmptyResult(): PaymentCalculationResult {
    return {
      totalAmount: 0,
      paymentPerDelegator: [],
      summary: {
        totalRecipients: 0,
        totalHiveToDistribute: 0,
        averagePayment: 0,
        percentageDistributed: 0,
      },
    };
  }

  /**
   * Valida los parámetros de cálculo
   */
  private validateCalculationParams(params: PaymentCalculationParams): void {
    if (!params) {
      throw new Error('Los parámetros de cálculo son requeridos');
    }

    if (params.interestPercentage <= 0 || params.interestPercentage > 100) {
      throw new Error('El porcentaje de interés debe estar entre 0 y 100');
    }

    if (params.hivePowerToConsider <= 0) {
      throw new Error('El HivePower a considerar debe ser mayor que 0');
    }

    if (!Number.isFinite(params.interestPercentage) || !Number.isFinite(params.hivePowerToConsider)) {
      throw new Error('Los parámetros deben ser números válidos');
    }
  }

  /**
   * Redondea un número a la precisión especificada
   */
  private roundToPrecision(value: number, decimals: number = this.PRECISION_DECIMALS): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  /**
   * Obtiene estadísticas detalladas del cálculo
   */
  public getCalculationStats(result: PaymentCalculationResult): CalculationStats {
    const payments = result.paymentPerDelegator;
    
    if (payments.length === 0) {
      return {
        totalPayments: 0,
        minPayment: 0,
        maxPayment: 0,
        medianPayment: 0,
        standardDeviation: 0,
        distribution: {
          small: 0,   // < 0.1 HIVE
          medium: 0,  // 0.1 - 1 HIVE
          large: 0,   // > 1 HIVE
        },
      };
    }

    const amounts = payments.map(p => p.paymentAmount).sort((a, b) => a - b);
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    const mean = total / amounts.length;
    
    // Calcular mediana
    const mid = Math.floor(amounts.length / 2);
    const median = amounts.length % 2 === 0 
      ? (amounts[mid - 1] + amounts[mid]) / 2 
      : amounts[mid];

    // Calcular desviación estándar
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
    const standardDeviation = Math.sqrt(variance);

    // Distribución por rangos
    const distribution = {
      small: amounts.filter(amount => amount < 0.1).length,
      medium: amounts.filter(amount => amount >= 0.1 && amount <= 1).length,
      large: amounts.filter(amount => amount > 1).length,
    };

    return {
      totalPayments: payments.length,
      minPayment: this.roundToPrecision(amounts[0]),
      maxPayment: this.roundToPrecision(amounts[amounts.length - 1]),
      medianPayment: this.roundToPrecision(median),
      standardDeviation: this.roundToPrecision(standardDeviation),
      distribution,
    };
  }

  /**
   * Exporta los resultados en formato CSV
   */
  public exportToCSV(result: PaymentCalculationResult): string {
    if (result.paymentPerDelegator.length === 0) {
      return 'No data to export';
    }

    const headers = ['Delegator', 'Delegated HP', 'Payment Amount (HIVE)', 'Percentage'];
    const rows = result.paymentPerDelegator.map(payment => [
      payment.delegator,
      payment.delegatedHP.toString(),
      payment.paymentAmount.toString(),
      `${payment.percentage}%`
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Valida que los pagos sean factibles
   */
  public validatePayments(result: PaymentCalculationResult): ValidationResult {
    const issues: string[] = [];

    if (result.summary.totalRecipients === 0) {
      issues.push('No hay destinatarios para el pago');
    }

    if (result.summary.totalHiveToDistribute <= 0) {
      issues.push('El monto total a distribuir debe ser mayor que 0');
    }

    if (result.summary.percentageDistributed < 95) {
      issues.push(`Solo se distribuirá el ${result.summary.percentageDistributed}% del monto total`);
    }

    const tinyPayments = result.paymentPerDelegator.filter(p => p.paymentAmount < 0.01).length;
    if (tinyPayments > 0) {
      issues.push(`${tinyPayments} pagos son menores a 0.01 HIVE`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings: issues.filter(issue => issue.includes('distribuirá') || issue.includes('menores')),
    };
  }
}

/**
 * Interface para las estadísticas de cálculo
 */
export interface CalculationStats {
  readonly totalPayments: number;
  readonly minPayment: number;
  readonly maxPayment: number;
  readonly medianPayment: number;
  readonly standardDeviation: number;
  readonly distribution: {
    readonly small: number;
    readonly medium: number;
    readonly large: number;
  };
}

/**
 * Interface para el resultado de validación
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly issues: string[];
  readonly warnings: string[];
}

/**
 * Factory function para crear una instancia del servicio
 */
export function createPaymentCalculatorService(): PaymentCalculatorService {
  return new PaymentCalculatorService();
}

/**
 * Instancia singleton del servicio para uso global
 */
export const paymentCalculatorService = createPaymentCalculatorService();
