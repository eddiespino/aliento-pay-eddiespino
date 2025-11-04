// 🔧 SCRIPT PARA FORZAR ACTUALIZACIÓN DEL PERÍODO ACTIVO
// Ejecutar en la consola del navegador del dashboard

console.log('🔧 === FORZAR ACTUALIZACIÓN DE PERÍODO ACTIVO ===');

// Función para forzar la actualización del período activo
function forceUpdateCurationPeriod(targetPeriod = '30d') {
  console.log(`🎯 Forzando actualización a período: ${targetPeriod}`);

  // 1. Actualizar estado global
  window.filterState.curationPeriod = targetPeriod;

  // 2. Resetear todos los botones
  const buttons = document.querySelectorAll('[data-filter-type="curation-period"]');
  buttons.forEach(btn => {
    btn.dataset.filterState = 'inactive';
    btn.classList.remove('bg-green-500', 'bg-blue-500', 'bg-gray-600');
    btn.classList.add('bg-gray-700');

    const radio = btn.querySelector('.curation-radio');
    if (radio) {
      radio.classList.remove('bg-white', 'bg-blue-400');
      radio.classList.add('border-2', 'border-gray-500');
    }
  });

  // 3. Activar el botón objetivo
  const targetBtn = document.querySelector(`[data-filter-value="${targetPeriod}"]`);
  if (targetBtn) {
    targetBtn.dataset.filterState = 'active';
    targetBtn.classList.remove('bg-gray-700');

    // Aplicar color específico
    if (targetPeriod === '24h') {
      targetBtn.classList.add('bg-green-500');
    } else if (targetPeriod === '7d') {
      targetBtn.classList.add('bg-blue-500');
    } else if (targetPeriod === '30d') {
      targetBtn.classList.add('bg-gray-600');
    }

    // Actualizar radio
    const radio = targetBtn.querySelector('.curation-radio');
    if (radio) {
      radio.classList.remove('border-2', 'border-gray-500');
      radio.classList.add('bg-white');
    }

    // 4. Actualizar valor en el estado
    const currentValue = parseFloat(targetBtn.dataset.value || '0');
    window.filterState.curationValue = currentValue;

    console.log(`✅ Período actualizado: ${targetPeriod} con valor ${currentValue} HP`);
    console.log('📊 Estado actual:', window.filterState);

    return {
      period: targetPeriod,
      value: currentValue,
      button: targetBtn.id,
    };
  } else {
    console.error(`❌ No se encontró botón para período: ${targetPeriod}`);
    return null;
  }
}

// Función para obtener datos actuales
function getCurrentCurationData() {
  if (typeof window.getCurationStatsData === 'function') {
    const data = window.getCurationStatsData();
    console.log('📊 Datos actuales de curación:', data);
    return data;
  } else {
    console.error('❌ getCurationStatsData no está disponible');
    return null;
  }
}

// Función para refrescar datos
async function refreshAndUpdate() {
  console.log('🔄 Refrescando datos y actualizando UI...');

  try {
    // Obtener datos frescos
    const data = getCurrentCurationData();
    if (!data) return;

    // Actualizar botones con valores
    const buttonIds = ['curation-btn-24h', 'curation-btn-7d', 'curation-btn-30d'];
    buttonIds.forEach(buttonId => {
      const btn = document.getElementById(buttonId);
      if (!btn) return;

      const period = btn.dataset.period;
      const valueElement = btn.querySelector('.curation-value');

      if (valueElement) {
        let value = 0;
        switch (period) {
          case '24h':
            value = data.curation24h || 0;
            break;
          case '7d':
            value = data.curation7d || 0;
            break;
          case '30d':
            value = data.curation30d || 0;
            break;
        }

        btn.dataset.value = value.toString();
        valueElement.textContent = `${value.toFixed(4)} HP`;
        console.log(`✅ Actualizado ${buttonId}: ${value.toFixed(4)} HP`);
      }
    });

    // Forzar actualización del período activo
    const result = forceUpdateCurationPeriod(window.filterState.curationPeriod || '30d');
    return result;
  } catch (error) {
    console.error('❌ Error refrescando:', error);
  }
}

// Función para verificar estado
function checkCurrentState() {
  console.log('\n🔍 === ESTADO ACTUAL ===');
  console.log('📊 filterState:', window.filterState);

  const activeBtn = document.querySelector(
    '[data-filter-type="curation-period"][data-filter-state="active"]'
  );
  if (activeBtn) {
    console.log('✅ Botón activo:', {
      id: activeBtn.id,
      period: activeBtn.dataset.period,
      value: activeBtn.dataset.value,
      filterValue: activeBtn.dataset.filterValue,
    });
  } else {
    console.log('❌ No hay botón activo');
  }
}

// Exponer funciones globalmente
window.forceUpdateCurationPeriod = forceUpdateCurationPeriod;
window.refreshAndUpdate = refreshAndUpdate;
window.checkCurrentState = checkCurrentState;
window.getCurrentCurationData = getCurrentCurationData;

console.log('\n💡 COMANDOS DISPONIBLES:');
console.log('- forceUpdateCurationPeriod("30d") - Forzar período específico');
console.log('- refreshAndUpdate() - Refrescar datos y actualizar UI');
console.log('- checkCurrentState() - Verificar estado actual');
console.log('- getCurrentCurationData() - Obtener datos de curación');

console.log('\n🚀 EJECUTANDO ACTUALIZACIÓN AUTOMÁTICA...');
refreshAndUpdate();
