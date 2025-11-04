/**
 * 🎯 EJEMPLO DE USO - TRANSFERENCIAS MÚLTIPLES
 *
 * Ejemplo práctico de cómo usar el servicio de transferencias múltiples
 * con Hive Keychain en el contexto de Aliento.pay
 */

import {
  executeMultipleTransfers,
  executePayments,
  executeTransfersInBatches,
  paymentsToTransfers,
  validateTransfers,
  calculateTotalAmount,
  generateTransferSummary,
  type TransferData,
  type TransferResult,
} from '../services/multiple-transfers';

import type { Payment } from '../domain/models/Payment';

/**
 * Ejemplo 1: Transferencias simples desde un arreglo básico
 */
export async function exampleBasicTransfers(): Promise<void> {
  console.log('🎯 Ejemplo 1: Transferencias básicas');

  // 1. Definir las transferencias
  const transfers: TransferData[] = [
    {
      to: 'usuario1',
      amount: '1.500',
      memo: 'Pago de curación Diciembre 2023 - Aliento.pay',
    },
    {
      to: 'usuario2',
      amount: '2.750',
      memo: 'Pago de curación Diciembre 2023 - Aliento.pay',
    },
    {
      to: 'usuario3',
      amount: '0.850',
      memo: 'Pago de curación Diciembre 2023 - Aliento.pay',
    },
  ];

  // 2. Validar transferencias antes de ejecutar
  const validation = validateTransfers(transfers);
  if (!validation.isValid) {
    console.error('❌ Errores de validación:', validation.errors);
    return;
  }

  // 3. Mostrar resumen
  const summary = generateTransferSummary(transfers);
  console.log('📊 Resumen:', {
    ...summary,
    totalAmount: `${summary.totalAmount.toFixed(3)} HIVE`,
  });

  // 4. Ejecutar transferencias
  try {
    const result = await executeMultipleTransfers({
      transfers,
      timeout: 45000, // 45 segundos de timeout
    });

    if (result.success) {
      console.log('✅ Transferencias exitosas!');
      console.log(`🔗 ID de transacción: ${result.transactionId}`);
      console.log(`📦 Bloque: ${result.blockNumber}`);
    } else {
      console.error('❌ Error en transferencias:', result.error);
    }
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

/**
 * Ejemplo 2: Usar datos existentes de Payment[]
 */
export async function exampleFromPayments(): Promise<void> {
  console.log('🎯 Ejemplo 2: Desde Payment[] existente');

  // Simular datos que vienen del cálculo de curación
  const payments: Payment[] = [
    {
      to: 'curador1',
      amount: '5.250',
      memo: 'Curación periodo 15-30 Nov - ExampleCurator',
      status: 'pending',
    },
    {
      to: 'curador2',
      amount: '3.100',
      memo: 'Curación periodo 15-30 Nov - ExampleCurator',
      status: 'pending',
    },
    {
      to: 'curador3',
      amount: '8.750',
      memo: 'Curación periodo 15-30 Nov - ExampleCurator',
      status: 'pending',
    },
  ];

  // Ejecutar directamente desde Payment[]
  try {
    const result = await executePayments(payments);

    if (result.success) {
      console.log('✅ Pagos de curación ejecutados exitosamente!');
      console.log(`💰 Total: ${calculateTotalAmount(result.transfers).toFixed(3)} HIVE`);
      console.log(`👥 Beneficiarios: ${result.transfers.length}`);
    } else {
      console.error('❌ Error en pagos:', result.error);
    }
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

/**
 * Ejemplo 3: Procesamiento en lotes para muchas transferencias
 */
export async function exampleBatchProcessing(): Promise<void> {
  console.log('🎯 Ejemplo 3: Procesamiento en lotes');

  // Simular muchas transferencias (por ejemplo, 100 usuarios)
  const manyTransfers: TransferData[] = [];
  for (let i = 1; i <= 100; i++) {
    manyTransfers.push({
      to: `usuario${i}`,
      amount: (Math.random() * 5 + 0.1).toFixed(3), // Entre 0.1 y 5.1 HIVE
      memo: `Distribución masiva diciembre - Usuario ${i}`,
    });
  }

  console.log(`📦 Preparando ${manyTransfers.length} transferencias...`);

  try {
    // Ejecutar en lotes de 25 transferencias cada uno
    const results = await executeTransfersInBatches(
      manyTransfers,
      25, // Tamaño del lote
      {
        timeout: 60000, // 1 minuto por lote
        requirePosting: false, // Usar Active key
      }
    );

    // Analizar resultados
    const successfulBatches = results.filter(r => r.success).length;
    const totalProcessed = results.reduce((sum, r) => sum + r.transfers.length, 0);
    const totalAmount = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + calculateTotalAmount(r.transfers), 0);

    console.log('📊 Resultados finales:');
    console.log(`✅ Lotes exitosos: ${successfulBatches}/${results.length}`);
    console.log(`💸 Transferencias procesadas: ${totalProcessed}`);
    console.log(`💰 Total transferido: ${totalAmount.toFixed(3)} HIVE`);

    // Mostrar errores si los hay
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.log('❌ Lotes con errores:');
      failedResults.forEach((result, index) => {
        console.log(`   Lote ${index + 1}: ${result.error}`);
      });
    }
  } catch (error) {
    console.error('💥 Error en procesamiento por lotes:', error);
  }
}

/**
 * Ejemplo 4: Integración completa en el contexto de la aplicación
 */
export async function exampleIntegratedWorkflow(): Promise<void> {
  console.log('🎯 Ejemplo 4: Flujo integrado completo');

  // 1. Simular datos que vienen del cálculo de distribución
  const distributionData = {
    distributor: 'example-curator', // Usar cuenta genérica en ejemplos
    period: 'Diciembre 1-15, 2023',
    totalBudget: 150.0,
    distributions: [
      { username: 'curator1', payment: 25.5, curationPower: 0.17 },
      { username: 'curator2', payment: 18.75, curationPower: 0.125 },
      { username: 'curator3', payment: 42.1, curationPower: 0.281 },
      { username: 'curator4', payment: 15.3, curationPower: 0.102 },
      { username: 'curator5', payment: 12.85, curationPower: 0.086 },
      // ... más curadores
    ],
  };

  // 2. Convertir a formato de transferencias
  const transfers: TransferData[] = distributionData.distributions.map(dist => ({
    to: dist.username,
    amount: dist.payment.toFixed(3),
    memo: `Curación ${distributionData.period} - Poder: ${(dist.curationPower * 100).toFixed(1)}% - ExampleCurator.pay`,
  }));

  // 3. Validaciones previas
  console.log('🔍 Ejecutando validaciones...');

  // Verificar que el usuario esté autenticado
  if (typeof window !== 'undefined') {
    const currentUser = localStorage.getItem('authenticated_user');
    if (!currentUser) {
      console.error('❌ Usuario no autenticado');
      return;
    }
    console.log(`👤 Usuario autenticado: ${currentUser}`);
  }

  // Validar las transferencias
  const validation = validateTransfers(transfers);
  if (!validation.isValid) {
    console.error('❌ Errores de validación:');
    validation.errors.forEach(error => {
      console.error(`   - ${error.field}: ${error.message}`);
    });
    return;
  }

  // 4. Mostrar resumen y pedir confirmación
  const summary = generateTransferSummary(transfers);
  console.log('📋 Resumen de la distribución:');
  console.log(`   💰 Total a distribuir: ${summary.totalAmount.toFixed(3)} HIVE`);
  console.log(`   👥 Beneficiarios: ${summary.count}`);
  console.log(`   📊 Promedio por persona: ${summary.averageAmount.toFixed(3)} HIVE`);
  console.log(`   📈 Pago más alto: ${summary.maxAmount.toFixed(3)} HIVE`);
  console.log(`   📉 Pago más bajo: ${summary.minAmount.toFixed(3)} HIVE`);

  // En una aplicación real, aquí mostrarías un modal de confirmación
  const confirmed = true; // Simular confirmación del usuario

  if (!confirmed) {
    console.log('❌ Operación cancelada por el usuario');
    return;
  }

  // 5. Ejecutar las transferencias
  console.log('🚀 Iniciando transferencias...');

  try {
    let result: TransferResult;

    if (transfers.length <= 30) {
      // Para pocas transferencias, ejecutar todo junto
      result = await executeMultipleTransfers({
        transfers,
        timeout: 45000,
      });

      if (result.success) {
        console.log('✅ Distribución completada exitosamente!');
        console.log(`🔗 Transacción: ${result.transactionId}`);

        // Actualizar estado de los pagos en la aplicación
        updatePaymentStatus(transfers, 'completed', result.transactionId);
      } else {
        console.error('❌ Error en la distribución:', result.error);
        updatePaymentStatus(transfers, 'failed', undefined, result.error);
      }
    } else {
      // Para muchas transferencias, usar procesamiento por lotes
      const results = await executeTransfersInBatches(transfers, 20);

      const successfulBatches = results.filter(r => r.success).length;
      console.log(
        `📊 Procesamiento completado: ${successfulBatches}/${results.length} lotes exitosos`
      );

      // Actualizar estado por lotes
      results.forEach(batchResult => {
        if (batchResult.success) {
          updatePaymentStatus(batchResult.transfers, 'completed', batchResult.transactionId);
        } else {
          updatePaymentStatus(batchResult.transfers, 'failed', undefined, batchResult.error);
        }
      });
    }
  } catch (error) {
    console.error('💥 Error inesperado en la distribución:', error);
    updatePaymentStatus(transfers, 'failed', undefined, 'Error inesperado');
  }
}

/**
 * Función helper para actualizar el estado de los pagos
 */
function updatePaymentStatus(
  transfers: readonly TransferData[],
  status: 'completed' | 'failed',
  transactionId?: string,
  error?: string
): void {
  console.log(`📝 Actualizando estado de ${transfers.length} pagos a: ${status}`);

  if (transactionId) {
    console.log(`🔗 ID de transacción: ${transactionId}`);
  }

  if (error) {
    console.log(`❌ Error: ${error}`);
  }

  // Aquí actualizarías la base de datos o el estado de la aplicación
  // Por ejemplo, podrías guardar en localStorage o enviar a una API

  const paymentHistory = {
    timestamp: new Date().toISOString(),
    transfers,
    status,
    transactionId,
    error,
  };

  // Guardar en localStorage como ejemplo
  if (typeof window !== 'undefined') {
    const existingHistory = JSON.parse(localStorage.getItem('payment_history') || '[]');
    existingHistory.push(paymentHistory);
    localStorage.setItem('payment_history', JSON.stringify(existingHistory));
  }
}

/**
 * Función para ejecutar todos los ejemplos
 */
export async function runAllExamples(): Promise<void> {
  console.log('🚀 Ejecutando todos los ejemplos de transferencias múltiples...\n');

  await exampleBasicTransfers();
  console.log('\n' + '='.repeat(50) + '\n');

  await exampleFromPayments();
  console.log('\n' + '='.repeat(50) + '\n');

  await exampleBatchProcessing();
  console.log('\n' + '='.repeat(50) + '\n');

  await exampleIntegratedWorkflow();
  console.log('\n✅ Todos los ejemplos completados!');
}
