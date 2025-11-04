// 🔍 DIAGNÓSTICO ESPECÍFICO DE FILTROS
// Ejecutar en consola del navegador en la página del dashboard

console.log('🔍 === DIAGNÓSTICO DE FILTROS ===');

// 1. Verificar estado actual de filterState
console.log('\n📊 1. ESTADO ACTUAL DE FILTERSTATE:');
console.log('- window.filterState:', window.filterState);
if (window.filterState) {
  console.log('  - curationPeriod:', window.filterState.curationPeriod);
  console.log('  - curationValue:', window.filterState.curationValue);
  console.log('  - applied:', window.filterState.applied);
}

// 2. Verificar botones de curación
console.log('\n🔘 2. VERIFICACIÓN DE BOTONES DE CURACIÓN:');
const curationButtons = ['curation-btn-24h', 'curation-btn-7d', 'curation-btn-30d'];

curationButtons.forEach(buttonId => {
  const btn = document.getElementById(buttonId);
  if (btn) {
    console.log(`- ${buttonId}:`);
    console.log(`  - data-filter-state: ${btn.dataset.filterState}`);
    console.log(`  - data-value: ${btn.dataset.value}`);
    console.log(`  - data-period: ${btn.dataset.period}`);

    const valueElement = btn.querySelector('.curation-value');
    if (valueElement) {
      console.log(`  - texto mostrado: ${valueElement.textContent}`);
    }
  } else {
    console.log(`❌ ${buttonId} no encontrado`);
  }
});

// 3. Verificar botón activo
console.log('\n✅ 3. VERIFICACIÓN DEL BOTÓN ACTIVO:');
const activeBtn = document.querySelector(
  '[data-filter-type="curation-period"][data-filter-state="active"]'
);
if (activeBtn) {
  console.log('- Botón activo encontrado:', activeBtn.id);
  console.log('- data-period:', activeBtn.dataset.period);
  console.log('- data-value:', activeBtn.dataset.value);
  console.log('- data-filter-value:', activeBtn.dataset.filterValue);
} else {
  console.log('❌ No se encontró botón activo');
}

// 4. Verificar función getCurationStatsData
console.log('\n📡 4. VERIFICACIÓN DE FUNCIÓN DE DATOS:');
console.log('- window.getCurationStatsData:', typeof window.getCurationStatsData);
if (typeof window.getCurationStatsData === 'function') {
  try {
    const data = window.getCurationStatsData();
    console.log('- Datos obtenidos:', data);
  } catch (error) {
    console.error('- Error obteniendo datos:', error);
  }
}

// 5. Verificar localStorage
console.log('\n💾 5. VERIFICACIÓN DE LOCALSTORAGE:');
const filterConfig = localStorage.getItem('filter_configuration');
if (filterConfig) {
  try {
    const config = JSON.parse(filterConfig);
    console.log('- Configuración guardada:', config);
  } catch (error) {
    console.error('- Error parseando configuración:', error);
  }
} else {
  console.log('- No hay configuración guardada');
}

// 6. Simular selección de período
console.log('\n🎯 6. SIMULACIÓN DE SELECCIÓN:');
function testPeriodSelection(period) {
  console.log(`\n🧪 Probando selección de período: ${period}`);

  // Encontrar el botón
  const btn = document.querySelector(`[data-filter-value="${period}"]`);
  if (btn) {
    console.log('- Botón encontrado:', btn.id);
    console.log('- Valor actual:', btn.dataset.value);

    // Simular click
    btn.click();

    // Verificar estado después del click
    setTimeout(() => {
      const newActiveBtn = document.querySelector(
        '[data-filter-type="curation-period"][data-filter-state="active"]'
      );
      if (newActiveBtn) {
        console.log('- Nuevo botón activo:', newActiveBtn.id);
        console.log('- Nuevo valor en filterState:', window.filterState.curationValue);
      }
    }, 100);
  } else {
    console.log('❌ Botón no encontrado');
  }
}

// Exponer función para pruebas
window.testPeriodSelection = testPeriodSelection;

console.log('\n💡 COMANDOS DISPONIBLES:');
console.log('- testPeriodSelection("24h") - Probar selección de 24h');
console.log('- testPeriodSelection("7d") - Probar selección de 7d');
console.log('- testPeriodSelection("30d") - Probar selección de 30d');

console.log('\n🔍 === FIN DEL DIAGNÓSTICO ===');
