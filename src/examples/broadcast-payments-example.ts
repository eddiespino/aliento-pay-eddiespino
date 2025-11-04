/**
 * 📝 EJEMPLO DE USO: Servicio de Transferencias Múltiples v2
 *
 * Demostración completa de cómo usar el servicio de transferencias múltiples
 * con Hive Keychain usando RequestBroadcast para múltiples pagos en una sola transacción.
 */

import {
  executeMultipleTransfers,
  multipleTransferService,
  type MultipleTransferOptions,
  type MultipleTransferPayment,
  type MultipleTransferResult,
} from '../services/multiple-transfers';

import { KeychainKeyType } from '../types/keychain';

// Ejemplo 1: Uso básico con pagos de curación
export async function executeBasicCurationPayments(): Promise<void> {
  console.log('🎯 Ejecutando pagos de curación básicos...');

  // Datos de pago tipados y seguros
  const curationPayments: readonly MultipleTransferPayment[] = [
    {
      to: 'user1',
      amount: '1.500 HIVE',
      memo: 'Recompensa de curación - Aliento.pay',
    },
    {
      to: 'user2',
      amount: '0.750 HIVE',
      memo: 'Recompensa de curación - Aliento.pay',
    },
    {
      to: 'user3',
      amount: '0.250 HIVE',
      memo: 'Recompensa de curación - Aliento.pay',
    },
  ] as const;

  // Obtener usuario autenticado
  const username = multipleTransferService.getCurrentUser();
  if (!username) {
    console.error('❌ No hay usuario autenticado');
    return;
  }

  // Opciones de transferencia
  const options: MultipleTransferOptions = {
    username,
    payments: curationPayments,
    keyType: KeychainKeyType.Active,
    timeout: 30000, // 30 segundos
  };

  try {
    // Ejecutar transferencias múltiples
    const result = await executeMultipleTransfers(options);

    if (result.success) {
      console.log('✅ Pagos ejecutados exitosamente!');
      console.log('📊 Resultado:', {
        transactionId: result.transactionId,
        blockNumber: result.blockNumber,
        totalAmount: result.totalAmount,
        totalPayments: result.totalPayments,
        message: result.message,
      });
    } else {
      console.error('❌ Error al ejecutar pagos:', result.error);
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejemplo 2: Uso avanzado con diferentes tipos de pagos
export async function executeAdvancedPayments(): Promise<void> {
  console.log('🚀 Ejecutando pagos avanzados...');

  // Pagos mixtos con HIVE y HBD
  const mixedPayments: readonly MultipleTransferPayment[] = [
    {
      to: 'delegation-reward-1',
      amount: '2.000 HIVE',
      memo: 'Recompensa por delegación - Aliento.pay',
    },
    {
      to: 'curation-reward-1',
      amount: '1.500 HBD',
      memo: 'Recompensa de curación en HBD - Aliento.pay',
    },
    {
      to: 'contest-winner',
      amount: '5.000 HIVE',
      memo: 'Premio del concurso - Aliento.pay',
    },
    {
      to: 'monthly-bonus',
      amount: '0.750 HIVE',
      memo: 'Bonus mensual - Aliento.pay',
    },
  ] as const;

  const username = multipleTransferService.getCurrentUser();
  if (!username) {
    console.error('❌ No hay usuario autenticado');
    return;
  }

  try {
    // Usar el servicio directamente
    const result = await multipleTransferService.executeMultipleTransfers({
      username,
      payments: mixedPayments,
      keyType: KeychainKeyType.Active,
      timeout: 45000, // 45 segundos para pagos más complejos
    });

    if (result.success) {
      console.log('✅ Pagos mixtos ejecutados exitosamente!');
      console.log('💰 Total procesado:', result.totalAmount);
      console.log('📦 Número de pagos:', result.totalPayments);

      if (result.transactionId) {
        console.log('🔗 ID de transacción:', result.transactionId);
        console.log('🏗️ Bloque:', result.blockNumber);
      }
    } else {
      console.error('❌ Error en pagos mixtos:', result.error);
    }
  } catch (error) {
    console.error('❌ Error inesperado en pagos mixtos:', error);
  }
}

// Ejemplo 3: Procesamiento por lotes con manejo de errores
export async function processBatchPayments(): Promise<void> {
  console.log('📦 Procesando pagos por lotes...');

  // Definir diferentes grupos de pagos
  const highValuePayments: readonly MultipleTransferPayment[] = [
    { to: 'whale-1', amount: '10.000 HIVE', memo: 'Pago alto valor 1' },
    { to: 'whale-2', amount: '8.500 HIVE', memo: 'Pago alto valor 2' },
  ] as const;

  const mediumValuePayments: readonly MultipleTransferPayment[] = [
    { to: 'user-1', amount: '2.000 HIVE', memo: 'Pago valor medio 1' },
    { to: 'user-2', amount: '1.500 HIVE', memo: 'Pago valor medio 2' },
    { to: 'user-3', amount: '1.250 HIVE', memo: 'Pago valor medio 3' },
  ] as const;

  const lowValuePayments: readonly MultipleTransferPayment[] = [
    { to: 'minnow-1', amount: '0.500 HIVE', memo: 'Pago bajo valor 1' },
    { to: 'minnow-2', amount: '0.250 HIVE', memo: 'Pago bajo valor 2' },
    { to: 'minnow-3', amount: '0.100 HIVE', memo: 'Pago bajo valor 3' },
  ] as const;

  const paymentBatches = [
    { name: 'Alto Valor', payments: highValuePayments },
    { name: 'Valor Medio', payments: mediumValuePayments },
    { name: 'Bajo Valor', payments: lowValuePayments },
  ] as const;

  const username = multipleTransferService.getCurrentUser();
  if (!username) {
    console.error('❌ No hay usuario autenticado');
    return;
  }

  // Procesar cada lote
  for (const batch of paymentBatches) {
    console.log(`\n🔄 Procesando lote: ${batch.name}`);
    console.log(`📊 Pagos en el lote: ${batch.payments.length}`);

    try {
      const result = await multipleTransferService.executeMultipleTransfers({
        username,
        payments: batch.payments,
        keyType: KeychainKeyType.Active,
        timeout: 30000,
      });

      if (result.success) {
        console.log(`✅ Lote ${batch.name} procesado exitosamente`);
        console.log(`💰 Total del lote: ${result.totalAmount}`);
        console.log(`🔗 TX ID: ${result.transactionId}`);
      } else {
        console.error(`❌ Error en lote ${batch.name}:`, result.error);
      }
    } catch (error) {
      console.error(`❌ Error inesperado en lote ${batch.name}:`, error);
    }

    // Esperar entre lotes para evitar spam
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Función principal para ejecutar todos los ejemplos
export async function runAllExamples(): Promise<void> {
  console.log('🎬 Ejecutando todos los ejemplos...\n');

  try {
    // 1. Pagos básicos
    await executeBasicCurationPayments();

    // 2. Pagos avanzados
    await executeAdvancedPayments();

    // 3. Procesamiento por lotes
    await processBatchPayments();

    console.log('\n🎉 Todos los ejemplos ejecutados');
  } catch (error) {
    console.error('❌ Error ejecutando ejemplos:', error);
  }
}

// Exportar para uso en otros archivos
export { executeMultipleTransfers, multipleTransferService };
export type { KeychainKeyType };

// Tipos para reutilización
export type { MultipleTransferOptions, MultipleTransferPayment, MultipleTransferResult };
