// 🔧 SCRIPT PARA CAMBIAR EL PERÍODO DE CURACIÓN A 30D
// Ejecutar en la consola del navegador del dashboard

console.log('🔧 === CAMBIAR PERÍODO DE CURACIÓN A 30D ===');

// Función para cambiar el período activo a 30d
function switchTo30Days() {
  console.log('🔄 Cambiando período activo a 30d...');

  // 1. Actualizar estado global
  window.filterState.curationPeriod = '30d';

  // 2. Obtener el valor actual del botón 30d
  const btn30d = document.getElementById('curation-btn-30d');
  if (btn30d) {
    const value30d = parseFloat(btn30d.dataset.value || '0');
    window.filterState.curationValue = value30d;

    console.log(`✅ Nuevo valor: ${value30d} HP para 30d`);
  }

  // 3. Activar visualmente el botón de 30d
  setActiveButton('curation-period', '30d');

  // 4. Actualizar configuración guardada
  const config = {
    ...window.filterState,
    timestamp: new Date().toISOString(),
    version: '1.0',
  };
  localStorage.setItem('aliento_filter_config', JSON.stringify(config));

  console.log('✅ Configuración actualizada:', config);
  console.log('🔄 Recarga la página para ver los cambios aplicados');
}

// Función para verificar el estado actual
function checkCurrentState() {
  console.log('📋 Estado actual:', {
    filterState: window.filterState,
    activeButton: document.querySelector('[data-filter-state="active"]')?.id,
    values: {
      '24h': document.getElementById('curation-btn-24h')?.dataset.value,
      '7d': document.getElementById('curation-btn-7d')?.dataset.value,
      '30d': document.getElementById('curation-btn-30d')?.dataset.value,
    },
  });
}

// Función para mostrar todos los valores
function showAllValues() {
  console.log('📊 Valores actuales de curación:');

  ['24h', '7d', '30d'].forEach(period => {
    const btn = document.getElementById(`curation-btn-${period}`);
    if (btn) {
      const value = parseFloat(btn.dataset.value || '0');
      const isActive = btn.dataset.filterState === 'active';

      console.log(`  ${period}: ${value.toFixed(4)} HP ${isActive ? '(ACTIVO)' : ''}`);
    }
  });
}

// Función para limpiar toda la configuración
function resetFilterConfig() {
  console.log('🗑️ Limpiando configuración de filtros...');

  localStorage.removeItem('aliento_filter_config');

  // Restablecer estado por defecto
  window.filterState = {
    timePeriod: 30,
    minimumHP: 50,
    excludedUsers: [],
    applied: false,
    curationPeriod: '30d',
    curationValue: 0,
  };

  console.log('✅ Configuración restablecida. Recarga la página.');
}

// Instrucciones
console.log(`
📋 === INSTRUCCIONES ===

1. Ver estado actual:
   checkCurrentState()

2. Ver todos los valores:
   showAllValues()

3. Cambiar a 30d:
   switchTo30Days()

4. Limpiar configuración:
   resetFilterConfig()

========================
`);

// Ejecutar verificación inicial
checkCurrentState();
showAllValues();

// Exportar funciones
window.curationTools = {
  switchTo30Days,
  checkCurrentState,
  showAllValues,
  resetFilterConfig,
};
