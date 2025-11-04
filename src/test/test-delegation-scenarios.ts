/**
 * 🧪 PRUEBAS DE ESCENARIOS ESPECÍFICOS DE DELEGACIONES
 * 
 * Validar que la lógica de períodos funcione correctamente según los escenarios reales.
 */

import type { DelegationOperationResponse } from '../lib/get-delegations';

/**
 * Crea operaciones de delegación de prueba
 */
function createTestOperation(
  delegator: string,
  daysAgo: number,
  vestingAmount: string,
  operationId: string
): DelegationOperationResponse['operations_result'][0] {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  
  return {
    operation_id: operationId,
    block: 12345 + daysAgo,
    trx_id: `trx_${operationId}`,
    op_pos: 0,
    op_type_id: 40,
    timestamp: date.toISOString(),
    virtual_op: false,
    trx_in_block: 1,
    op: {
      type: 'delegate_vesting_shares_operation',
      value: {
        delegator: delegator,
        delegatee: 'example-curator',
        vesting_shares: {
          nai: '@@000000037',
          amount: vestingAmount,
          precision: 6
        }
      }
    }
  } as any;
}

/**
 * Simula el procesamiento de delegaciones con datos de prueba
 */
async function simulateProcessing(
  operations: DelegationOperationResponse['operations_result'],
  timePeriod: number
): Promise<Map<string, any>> {
  // Simular la función processDelegationOperationsForCalculate
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timePeriod);
  
  console.log(`📅 Simulando período de ${timePeriod} días (desde ${cutoffDate.toISOString().split('T')[0]})`);
  
  const delegatorsMap = new Map<string, any>();
  let operationsInPeriod = 0;
  
  for (const operation of operations) {
    const { delegator, delegatee, vesting_shares } = operation.op.value;
    const operationDate = new Date(operation.timestamp);
    
    if (delegatee !== 'example-curator' || delegator === 'example-curator') {
      continue;
    }
    
    // ✨ LÓGICA CORREGIDA: Solo procesar operaciones DENTRO del período
    if (operationDate < cutoffDate) {
      continue; // Operación fuera del período
    }
    
    operationsInPeriod++;
    
    const vestingAmount = vesting_shares.amount;
    // Simular conversión a HP (simplificado)
    const currentHP = parseFloat(vestingAmount) / 1000000 * 500; // Aproximación
    
    const existingInfo = delegatorsMap.get(delegator);
    
    if (!existingInfo || operation.timestamp > existingInfo.timestamp) {
      delegatorsMap.set(delegator, {
        delegator,
        currentHP,
        vestingShares: `${vestingAmount} VESTS`,
        timestamp: operation.timestamp,
        operation_id: operation.operation_id
      });
    }
  }
  
  console.log(`   ✨ Operaciones en período: ${operationsInPeriod}`);
  console.log(`   👥 Delegadores únicos: ${delegatorsMap.size}`);
  
  // Filtrar solo activos (HP > 0)
  const activeDelegators = new Map<string, any>();
  for (const [delegator, info] of delegatorsMap.entries()) {
    if (info.currentHP > 0) {
      activeDelegators.set(delegator, info);
    }
  }
  
  console.log(`   🔥 Delegadores activos: ${activeDelegators.size}`);
  
  return activeDelegators;
}

/**
 * Prueba del Escenario 1: Usuario tuvo delegación y la quitó
 */
export async function testScenario1() {
  console.log('\n📋 ESCENARIO 1: Usuario tuvo 1000 hace 33 días, quitó hace 25 días');
  console.log('=' * 70);
  
  const operations = [
    createTestOperation('usuario1', 33, '2000000000', 'op1'), // 1000 HP hace 33 días
    createTestOperation('usuario1', 25, '0', 'op2'),         // 0 HP hace 25 días (quitó)
  ];
  
  console.log('Operaciones de prueba:');
  operations.forEach(op => {
    const date = new Date(op.timestamp);
    const hp = parseFloat(op.op.value.vesting_shares.amount) / 1000000 * 500;
    console.log(`   - ${date.toISOString().split('T')[0]}: ${hp} HP (${op.operation_id})`);
  });
  
  // Probar filtro de 30 días
  console.log('\n🔍 Filtro 30 días:');
  const result30d = await simulateProcessing(operations, 30);
  const user30d = result30d.get('usuario1');
  
  if (!user30d) {
    console.log('   ✅ CORRECTO: Usuario no aparece (última operación en período fue 0 HP)');
  } else {
    console.log(`   ❌ ERROR: Usuario aparece con ${user30d.currentHP} HP`);
  }
  
  // Probar filtro de 7 días  
  console.log('\n🔍 Filtro 7 días:');
  const result7d = await simulateProcessing(operations, 7);
  const user7d = result7d.get('usuario1');
  
  if (!user7d) {
    console.log('   ✅ CORRECTO: Usuario no aparece (no hay operaciones en los últimos 7 días)');
  } else {
    console.log(`   ❌ ERROR: Usuario aparece con ${user7d.currentHP} HP`);
  }
}

/**
 * Prueba del Escenario 2: Usuario nuevo delegó hace 3 días
 */
export async function testScenario2() {
  console.log('\n📋 ESCENARIO 2: Usuario nuevo delegó hace 3 días');
  console.log('=' * 70);
  
  const operations = [
    createTestOperation('usuario2', 3, '4000000000', 'op3'), // 2000 HP hace 3 días
  ];
  
  console.log('Operaciones de prueba:');
  operations.forEach(op => {
    const date = new Date(op.timestamp);
    const hp = parseFloat(op.op.value.vesting_shares.amount) / 1000000 * 500;
    console.log(`   - ${date.toISOString().split('T')[0]}: ${hp} HP (${op.operation_id})`);
  });
  
  // Probar filtro de 7 días
  console.log('\n🔍 Filtro 7 días:');
  const result7d = await simulateProcessing(operations, 7);
  const user7d = result7d.get('usuario2');
  
  if (user7d && user7d.currentHP > 0) {
    console.log(`   ✅ CORRECTO: Usuario aparece con ${user7d.currentHP} HP (operación dentro de 7 días)`);
  } else {
    console.log('   ❌ ERROR: Usuario debería aparecer (delegó hace 3 días)');
  }
  
  // Probar filtro de 30 días
  console.log('\n🔍 Filtro 30 días:');
  const result30d = await simulateProcessing(operations, 30);
  const user30d = result30d.get('usuario2');
  
  if (user30d && user30d.currentHP > 0) {
    console.log(`   ✅ CORRECTO: Usuario aparece con ${user30d.currentHP} HP (operación dentro de 30 días)`);
  } else {
    console.log('   ❌ ERROR: Usuario debería aparecer (delegó hace 3 días)');
  }
}

/**
 * Prueba del Escenario 3: Usuario cambió delegación hace 10 días
 */
export async function testScenario3() {
  console.log('\n📋 ESCENARIO 3: Usuario cambió de 1000 a 6000 hace 10 días');
  console.log('=' * 70);
  
  const operations = [
    createTestOperation('usuario3', 35, '2000000000', 'op4'), // 1000 HP hace 35 días
    createTestOperation('usuario3', 10, '12000000000', 'op5'), // 6000 HP hace 10 días
  ];
  
  console.log('Operaciones de prueba:');
  operations.forEach(op => {
    const date = new Date(op.timestamp);
    const hp = parseFloat(op.op.value.vesting_shares.amount) / 1000000 * 500;
    console.log(`   - ${date.toISOString().split('T')[0]}: ${hp} HP (${op.operation_id})`);
  });
  
  // Probar filtro de 30 días
  console.log('\n🔍 Filtro 30 días:');
  const result30d = await simulateProcessing(operations, 30);
  const user30d = result30d.get('usuario3');
  
  if (user30d && user30d.currentHP === 6000) {
    console.log(`   ✅ CORRECTO: Usuario aparece con ${user30d.currentHP} HP (última operación en 30 días)`);
  } else if (user30d) {
    console.log(`   ⚠️ VERIFICAR: Usuario aparece con ${user30d.currentHP} HP (esperábamos 6000)`);
  } else {
    console.log('   ❌ ERROR: Usuario debería aparecer con 6000 HP');
  }
  
  // Probar filtro de 7 días
  console.log('\n🔍 Filtro 7 días:');
  const result7d = await simulateProcessing(operations, 7);
  const user7d = result7d.get('usuario3');
  
  if (!user7d) {
    console.log('   ✅ CORRECTO: Usuario no aparece (no hay operaciones en los últimos 7 días)');
  } else {
    console.log(`   ❌ ERROR: Usuario no debería aparecer (última operación hace 10 días), pero aparece con ${user7d.currentHP} HP`);
  }
}

/**
 * Ejecuta todos los escenarios de prueba
 */
export async function runScenarioTests() {
  console.log('🧪 === PRUEBAS DE ESCENARIOS DE DELEGACIONES ===');
  
  try {
    await testScenario1();
    await testScenario2();
    await testScenario3();
    
    console.log('\n🎉 Todas las pruebas de escenarios completadas');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar automáticamente si se importa directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runScenarioTests();
}
