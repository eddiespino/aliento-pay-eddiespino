/**
 * Script de prueba para verificar las funciones de delegaciones y cálculos
 * Ejecutar desde la consola del navegador para probar la funcionalidad
 */

import { getDelegationsWithFilters, type DelegationFilters } from '../lib/get-delegations';
import { paymentCalculatorService, type PaymentCalculationParams } from '../services/payment-calculator';

/**
 * Función de prueba principal
 */
export async function testDelegationsAndPayments(accountName: string = 'example-curator') {
  console.log(`🧪 Iniciando pruebas para la cuenta: ${accountName}`);
  
  try {
    // 1. Probar filtros de delegaciones
    console.log('\n📋 1. Probando filtros de delegaciones...');
    
    const filters: DelegationFilters = {
      timePeriod: 30, // últimos 30 días
      minimumHP: 50,  // mínimo 50 HP
      excludedUsers: ['test-user', 'excluded-account'] // usuarios excluidos
    };
    
    console.log('🔍 Filtros aplicados:', filters);
    
    const delegationsResult = await getDelegationsWithFilters(accountName, filters);
    
    console.log('✅ Resultado de delegaciones:', {
      activeDelegators: delegationsResult.totalDelegators,
      totalHP: delegationsResult.totalDelegationsHP,
      excluded: delegationsResult.excludedDelegators.length,
      belowMinimum: delegationsResult.belowMinimumDelegators.length,
      metadata: delegationsResult.metadata
    });
    
    // 2. Probar cálculo de pagos
    console.log('\n💰 2. Probando cálculo de pagos...');
    
    const paymentParams: PaymentCalculationParams = {
      interestPercentage: 10,    // 10% de interés
      hivePowerToConsider: 1000  // 1000 HP a considerar
    };
    
    console.log('📊 Parámetros de pago:', paymentParams);
    
    const paymentResult = paymentCalculatorService.calculatePayments(
      delegationsResult,
      paymentParams
    );
    
    console.log('✅ Resultado de pagos:', {
      totalAmount: paymentResult.totalAmount,
      recipients: paymentResult.summary.totalRecipients,
      totalToDistribute: paymentResult.summary.totalHiveToDistribute,
      averagePayment: paymentResult.summary.averagePayment,
      percentageDistributed: paymentResult.summary.percentageDistributed
    });
    
    // 3. Validar pagos
    console.log('\n🔍 3. Validando pagos...');
    
    const validation = paymentCalculatorService.validatePayments(paymentResult);
    console.log('✅ Validación:', validation);
    
    // 4. Obtener estadísticas
    console.log('\n📈 4. Obteniendo estadísticas...');
    
    const stats = paymentCalculatorService.getCalculationStats(paymentResult);
    console.log('✅ Estadísticas:', stats);
    
    // 5. Mostrar top 10 pagos
    console.log('\n🏆 5. Top 10 pagos:');
    
    const top10 = paymentResult.paymentPerDelegator.slice(0, 10);
    console.table(top10.map(p => ({
      Delegator: p.delegator,
      'HP Delegado': p.delegatedHP,
      'Pago (HIVE)': p.paymentAmount,
      'Porcentaje': `${p.percentage}%`
    })));
    
    // 6. Exportar a CSV (para verificar)
    console.log('\n📄 6. Generando CSV...');
    
    const csvContent = paymentCalculatorService.exportToCSV(paymentResult);
    console.log('✅ CSV generado (primeras 5 líneas):');
    console.log(csvContent.split('\n').slice(0, 6).join('\n'));
    
    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
    
    return {
      delegationsResult,
      paymentResult,
      validation,
      stats,
      csvContent
    };
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    throw error;
  }
}

/**
 * Función para probar con diferentes parámetros
 */
export async function testWithDifferentParams(accountName: string = 'aliento') {
  console.log(`🔄 Probando con diferentes parámetros para: ${accountName}`);
  
  const testCases = [
    {
      name: 'Conservador',
      filters: { timePeriod: 7, minimumHP: 100, excludedUsers: [] },
      payment: { interestPercentage: 5, hivePowerToConsider: 500 }
    },
    {
      name: 'Moderado',
      filters: { timePeriod: 14, minimumHP: 50, excludedUsers: ['excluded1'] },
      payment: { interestPercentage: 10, hivePowerToConsider: 1000 }
    },
    {
      name: 'Agresivo',
      filters: { timePeriod: 30, minimumHP: 25, excludedUsers: [] },
      payment: { interestPercentage: 15, hivePowerToConsider: 2000 }
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n🧪 Probando caso: ${testCase.name}`);
      
      const delegationsResult = await getDelegationsWithFilters(accountName, testCase.filters);
      const paymentResult = paymentCalculatorService.calculatePayments(
        delegationsResult,
        testCase.payment
      );
      
      console.log(`✅ ${testCase.name}:`, {
        delegators: delegationsResult.totalDelegators,
        totalHP: Math.round(delegationsResult.totalDelegationsHP),
        toDistribute: paymentResult.summary.totalHiveToDistribute,
        avgPayment: paymentResult.summary.averagePayment
      });
      
    } catch (error) {
      console.error(`❌ Error en caso ${testCase.name}:`, error);
    }
  }
}

/**
 * Función para comparar el rendimiento de diferentes funciones
 */
export async function benchmarkPerformance(accountName: string = 'aliento') {
  console.log(`⏱️ Benchmark de rendimiento para: ${accountName}`);
  
  const filters: DelegationFilters = {
    timePeriod: 30,
    minimumHP: 50,
    excludedUsers: []
  };
  
  // Probar función optimizada
  console.time('getDelegationsWithFilters');
  const result1 = await getDelegationsWithFilters(accountName, filters);
  console.timeEnd('getDelegationsWithFilters');
  
  console.log('📊 Resultados del benchmark:', {
    totalDelegators: result1.totalDelegators,
    totalHP: Math.round(result1.totalDelegationsHP),
    processingTime: 'Ver console.time arriba'
  });
  
  return result1;
}

// Exportar funciones para uso en el navegador
if (typeof window !== 'undefined') {
  (window as any).testDelegationsAndPayments = testDelegationsAndPayments;
  (window as any).testWithDifferentParams = testWithDifferentParams;
  (window as any).benchmarkPerformance = benchmarkPerformance;
  
  console.log(`
🧪 Funciones de prueba disponibles en la consola:

1. testDelegationsAndPayments('nombre-cuenta') - Prueba completa
2. testWithDifferentParams('nombre-cuenta') - Prueba con diferentes parámetros  
3. benchmarkPerformance('nombre-cuenta') - Benchmark de rendimiento

Ejemplo de uso:
await testDelegationsAndPayments('aliento')
  `);
}
