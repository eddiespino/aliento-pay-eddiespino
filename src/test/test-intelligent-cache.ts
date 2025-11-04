/**
 * 🧪 PRUEBAS DEL SISTEMA DE CACHE INTELIGENTE
 * 
 * Script para probar la nueva lógica de cache inteligente para delegaciones.
 * Simula diferentes escenarios de uso para verificar el comportamiento.
 */

import { 
  getDelegationsWithFilters,
  clearDelegationCache,
  logDelegationCacheStats,
  type OptimizedDelegationFilters 
} from '../lib/get-delegations';

/**
 * Ejecuta pruebas del sistema de cache inteligente
 */
export async function testIntelligentCache() {
  console.log('🧪 === PRUEBAS DEL CACHE INTELIGENTE ===\n');
  
  try {
    // Limpiar cache para empezar limpio
    clearDelegationCache();
    
    // Escenario 1: Primera consulta (7 días)
    console.log('📋 Escenario 1: Primera consulta - 7 días');
    console.log('=' * 50);
    
    const filters7d: OptimizedDelegationFilters = {
      timePeriod: 7,
      minimumHP: 50,
      excludedUsers: ['enrique89']
    };
    
    const start1 = Date.now();
    const result1 = await getDelegationsWithFilters('example-curator', filters7d);
    const time1 = Date.now() - start1;
    
    console.log(`✅ Resultado 1: ${result1.totalDelegators} delegadores, ${time1}ms`);
    logDelegationCacheStats();
    console.log('\n');
    
    // Escenario 2: Segunda consulta (30 días) - debería usar cache inteligente
    console.log('📋 Escenario 2: Ampliación a 30 días (debería usar cache)');
    console.log('=' * 50);
    
    const filters30d: OptimizedDelegationFilters = {
      timePeriod: 30,
      minimumHP: 50,
      excludedUsers: ['enrique89']
    };
    
    const start2 = Date.now();
    const result2 = await getDelegationsWithFilters('example-curator', filters30d);
    const time2 = Date.now() - start2;
    
    console.log(`✅ Resultado 2: ${result2.totalDelegators} delegadores, ${time2}ms`);
    logDelegationCacheStats();
    console.log('\n');
    
    // Escenario 3: Volver a 7 días - debería filtrar del cache existente
    console.log('📋 Escenario 3: Volver a 7 días (debería filtrar cache)');
    console.log('=' * 50);
    
    const start3 = Date.now();
    const result3 = await getDelegationsWithFilters('example-curator', filters7d);
    const time3 = Date.now() - start3;
    
    console.log(`✅ Resultado 3: ${result3.totalDelegators} delegadores, ${time3}ms`);
    logDelegationCacheStats();
    console.log('\n');
    
    // Escenario 4: Consulta sin límite de fecha (datos hasta hoy)
    console.log('📋 Escenario 4: Sin límite de fecha (hasta hoy)');
    console.log('=' * 50);
    
    const filtersNoLimit: OptimizedDelegationFilters = {
      timePeriod: 0, // Sin límite
      minimumHP: 50,
      excludedUsers: ['enrique89']
    };
    
    const start4 = Date.now();
    const result4 = await getDelegationsWithFilters('example-curator', filtersNoLimit);
    const time4 = Date.now() - start4;
    
    console.log(`✅ Resultado 4: ${result4.totalDelegators} delegadores, ${time4}ms`);
    logDelegationCacheStats();
    console.log('\n');
    
    // Resumen de resultados
    console.log('📊 RESUMEN DE PRUEBAS:');
    console.log('=' * 50);
    console.log(`🕐 Tiempo 7d (primera vez): ${time1}ms`);
    console.log(`🕐 Tiempo 30d (con cache): ${time2}ms`);
    console.log(`🕐 Tiempo 7d (filtrado): ${time3}ms`);
    console.log(`🕐 Tiempo sin límite: ${time4}ms`);
    console.log('');
    console.log(`👥 Delegadores 7d: ${result1.totalDelegators}`);
    console.log(`👥 Delegadores 30d: ${result2.totalDelegators}`);
    console.log(`👥 Delegadores 7d (2da vez): ${result3.totalDelegators}`);
    console.log(`👥 Delegadores sin límite: ${result4.totalDelegators}`);
    
    // Validaciones
    if (time3 < time1) {
      console.log('✅ Cache funcionando: segunda consulta 7d más rápida');
    } else {
      console.log('⚠️ Cache podría no estar funcionando correctamente');
    }
    
    if (result2.totalDelegators >= result1.totalDelegators) {
      console.log('✅ Lógica correcta: 30d tiene >= delegadores que 7d');
    } else {
      console.log('❌ Error lógico: 30d debería tener >= delegadores que 7d');
    }
    
    console.log('\n🎉 Pruebas completadas');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    throw error;
  }
}

/**
 * Prueba escenarios específicos de cache
 */
export async function testCacheScenarios() {
  console.log('🔬 === PRUEBAS DE ESCENARIOS ESPECÍFICOS ===\n');
  
  clearDelegationCache();
  
  const scenarios = [
    { name: 'Período muy corto', timePeriod: 1 },
    { name: 'Período corto', timePeriod: 7 },
    { name: 'Período mediano', timePeriod: 30 },
    { name: 'Período largo', timePeriod: 90 }
  ];
  
  for (const scenario of scenarios) {
    console.log(`📋 Probando: ${scenario.name} (${scenario.timePeriod} días)`);
    
    const filters: OptimizedDelegationFilters = {
      timePeriod: scenario.timePeriod,
      minimumHP: 100,
      excludedUsers: []
    };
    
    try {
      const start = Date.now();
      const result = await getDelegationsWithFilters('example-curator', filters);
      const time = Date.now() - start;
      
      console.log(`   ✅ ${result.totalDelegators} delegadores en ${time}ms`);
      console.log(`   📊 Total HP: ${result.totalDelegationsHP.toFixed(2)}`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
    
    console.log('');
  }
  
  logDelegationCacheStats();
}

/**
 * Función principal para ejecutar todas las pruebas
 */
export async function runAllTests() {
  try {
    await testIntelligentCache();
    console.log('\n' + '='.repeat(60) + '\n');
    await testCacheScenarios();
  } catch (error) {
    console.error('💥 Error en las pruebas:', error);
  }
}

// Ejecutar automáticamente si se importa este módulo
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}
