/**
 * 🎯 SERVICIO DE LOTES DE PAGOS (30 USUARIOS)
 *
 * Divide los pagos en lotes de 30 usuarios para procesamiento secuencial.
 * Cada lote se procesa individualmente con keychain, mostrando progreso.
 */

import type { Payment } from '../domain/models/Payment';

export interface PaymentBatch30 {
  id: string;
  batchNumber: number;
  totalBatches: number;
  payments: Payment[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: Date;
  transactionIds?: string[];
  error?: string;
}

export interface BatchProcessingState {
  batches: PaymentBatch30[];
  currentBatchIndex: number;
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  completedAmount: number;
  isProcessing: boolean;
  isCompleted: boolean;
  errors: string[];
}

/**
 * Divide una lista de pagos en lotes de 30 usuarios
 */
export function createPaymentBatches(
  payments: Payment[],
  batchSize: number = 30
): PaymentBatch30[] {
  console.log(`📦 Creando lotes de ${batchSize} usuarios de ${payments.length} pagos totales...`);

  const batches: PaymentBatch30[] = [];
  const totalBatches = Math.ceil(payments.length / batchSize);

  for (let i = 0; i < payments.length; i += batchSize) {
    const batchPayments = payments.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalAmount = batchPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const batch: PaymentBatch30 = {
      id: `batch_${batchNumber}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      batchNumber,
      totalBatches,
      payments: batchPayments,
      totalAmount,
      status: 'pending',
    };

    batches.push(batch);
  }

  console.log(`✅ Creados ${batches.length} lotes:`);
  batches.forEach(batch => {
    console.log(
      `   - Lote ${batch.batchNumber}: ${batch.payments.length} pagos, ${batch.totalAmount.toFixed(3)} HIVE`
    );
  });

  return batches;
}

/**
 * Inicializa el estado de procesamiento de lotes
 */
export function initializeBatchProcessingState(
  payments: Payment[],
  batchSize: number = 30
): BatchProcessingState {
  const batches = createPaymentBatches(payments, batchSize);
  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return {
    batches,
    currentBatchIndex: 0,
    totalPayments: payments.length,
    totalAmount,
    completedPayments: 0,
    completedAmount: 0,
    isProcessing: false,
    isCompleted: false,
    errors: [],
  };
}

/**
 * Obtiene el lote actual para procesar
 */
export function getCurrentBatch(state: BatchProcessingState): PaymentBatch30 | null {
  if (state.currentBatchIndex >= state.batches.length) {
    return null;
  }
  return state.batches[state.currentBatchIndex] || null;
}

/**
 * Marca un lote como completado y avanza al siguiente
 */
export function completeBatch(
  state: BatchProcessingState,
  batchId: string,
  transactionIds: string[] = []
): BatchProcessingState {
  const batchIndex = state.batches.findIndex(b => b.id === batchId);

  if (batchIndex === -1) {
    return state;
  }

  const updatedBatches = [...state.batches];
  const batch = updatedBatches[batchIndex];

  if (!batch) {
    return state;
  }

  // Marcar lote como completado
  batch.status = 'completed';
  batch.processedAt = new Date();
  batch.transactionIds = transactionIds;

  // Actualizar contadores
  const completedPayments = state.completedPayments + batch.payments.length;
  const completedAmount = state.completedAmount + batch.totalAmount;

  // Avanzar al siguiente lote
  const currentBatchIndex = state.currentBatchIndex + 1;
  const isCompleted = currentBatchIndex >= state.batches.length;

  return {
    ...state,
    batches: updatedBatches,
    currentBatchIndex,
    completedPayments,
    completedAmount,
    isCompleted,
    isProcessing: !isCompleted,
  };
}

/**
 * Marca un lote como fallido
 */
export function failBatch(
  state: BatchProcessingState,
  batchId: string,
  error: string
): BatchProcessingState {
  const batchIndex = state.batches.findIndex(b => b.id === batchId);

  if (batchIndex === -1) {
    return state;
  }

  const updatedBatches = [...state.batches];
  const batch = updatedBatches[batchIndex];

  if (!batch) {
    return state;
  }

  // Marcar lote como fallido
  batch.status = 'failed';
  batch.error = error;
  batch.processedAt = new Date();

  return {
    ...state,
    batches: updatedBatches,
    errors: [...state.errors, `Lote ${batch.batchNumber}: ${error}`],
  };
}

/**
 * Obtiene estadísticas del progreso actual
 */
export function getProgressStats(state: BatchProcessingState): {
  currentBatch: number;
  totalBatches: number;
  progressPercentage: number;
  completedPayments: number;
  totalPayments: number;
  completedAmount: number;
  totalAmount: number;
  remainingBatches: number;
  remainingPayments: number;
  remainingAmount: number;
} {
  const remainingBatches = state.batches.length - state.currentBatchIndex;
  const remainingPayments = state.totalPayments - state.completedPayments;
  const remainingAmount = state.totalAmount - state.completedAmount;
  const progressPercentage =
    state.totalPayments > 0 ? (state.completedPayments / state.totalPayments) * 100 : 0;

  return {
    currentBatch: state.currentBatchIndex + 1,
    totalBatches: state.batches.length,
    progressPercentage,
    completedPayments: state.completedPayments,
    totalPayments: state.totalPayments,
    completedAmount: state.completedAmount,
    totalAmount: state.totalAmount,
    remainingBatches,
    remainingPayments,
    remainingAmount,
  };
}

/**
 * Valida si un lote puede ser procesado
 */
export function validateBatchForProcessing(batch: PaymentBatch30): string[] {
  const errors: string[] = [];

  if (!batch.payments || batch.payments.length === 0) {
    errors.push('El lote no contiene pagos');
  }

  if (batch.status !== 'pending') {
    errors.push(`El lote ya fue procesado (estado: ${batch.status})`);
  }

  // Validar cada pago en el lote
  batch.payments.forEach((payment, index) => {
    if (!payment.to || payment.to.trim() === '') {
      errors.push(`Pago ${index + 1}: Destinatario es requerido`);
    }

    const amount = parseFloat(payment.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Pago ${index + 1}: Cantidad inválida (${payment.amount})`);
    }
  });

  return errors;
}

/**
 * Genera un resumen del estado de procesamiento
 */
export function generateProcessingSummary(state: BatchProcessingState): string {
  const stats = getProgressStats(state);
  const completedBatches = state.batches.filter(b => b.status === 'completed').length;
  const failedBatches = state.batches.filter(b => b.status === 'failed').length;

  let summary = `📊 RESUMEN DE PROCESAMIENTO\n`;
  summary += `=====================================\n`;
  summary += `• Progreso: ${stats.currentBatch - 1}/${stats.totalBatches} lotes (${stats.progressPercentage.toFixed(1)}%)\n`;
  summary += `• Pagos: ${stats.completedPayments}/${stats.totalPayments} completados\n`;
  summary += `• Cantidad: ${stats.completedAmount.toFixed(3)}/${stats.totalAmount.toFixed(3)} HIVE\n`;
  summary += `• Estado: ${completedBatches} exitosos, ${failedBatches} fallidos\n`;

  if (state.isCompleted) {
    summary += `\n✅ PROCESAMIENTO COMPLETADO`;
  } else if (state.isProcessing) {
    summary += `\n⏳ Procesando lote ${stats.currentBatch}...`;
  } else {
    summary += `\n⏸️ En espera de continuar`;
  }

  if (state.errors.length > 0) {
    summary += `\n\n❌ ERRORES:\n${state.errors.join('\n')}`;
  }

  return summary;
}
