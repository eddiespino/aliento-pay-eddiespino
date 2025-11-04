// 🔍 SCRIPT DE DIAGNÓSTICO: CARGA DE DATOS DE CURACIÓN
// Ejecutar paso a paso en la consola del navegador del dashboard

console.log('🔍 === DIAGNÓSTICO DE CARGA DE DATOS DE CURACIÓN ===');

// 1. Verificar si la función getCurationStatsData está disponible
function checkCurationFunction() {
  console.log('📋 1. Verificando función getCurationStatsData...');

  if (typeof window.getCurationStatsData === 'function') {
    console.log('✅ Función getCurationStatsData disponible');

    // Llamar a la función y ver qué devuelve
    const data = window.getCurationStatsData();
    console.log('📊 Datos obtenidos:', data);

    return data;
  } else {
    console.log('❌ Función getCurationStatsData NO disponible');
    return null;
  }
}

// 2. Verificar el estado de autenticación
function checkAuthenticationStatus() {
  console.log('📋 2. Verificando estado de autenticación...');

  const userData = localStorage.getItem('user_data');
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      console.log('✅ Usuario autenticado:', parsed.username);
      return true;
    } catch (error) {
      console.log('❌ Error parseando datos de usuario:', error);
      return false;
    }
  } else {
    console.log('❌ No hay datos de usuario en localStorage');
    return false;
  }
}

// 3. Verificar el cache de datos
function checkCurationCache() {
  console.log('📋 3. Verificando cache de datos de curación...');

  const cacheKey = 'curation_stats_cache';
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      console.log('✅ Cache encontrado:', parsed);

      // Verificar si el cache es válido (no expirado)
      const now = Date.now();
      if (parsed.timestamp && now - parsed.timestamp < 30000) {
        // 30 segundos
        console.log('✅ Cache válido (menos de 30 segundos)');
      } else {
        console.log('⏰ Cache expirado');
      }

      return parsed;
    } catch (error) {
      console.log('❌ Error parseando cache:', error);
      return null;
    }
  } else {
    console.log('❌ No hay cache de datos de curación');
    return null;
  }
}

// 4. Verificar la API de curación
async function checkCurationAPI() {
  console.log('📋 4. Verificando API de curación...');

  try {
    const response = await fetch('/api/curation-stats');
    console.log('📡 Respuesta API:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Datos de API:', data);
      return data;
    } else {
      console.log('❌ Error en API:', response.status);
      return null;
    }
  } catch (error) {
    console.log('❌ Error llamando a API:', error);
    return null;
  }
}

// 5. Verificar el estado de los botones de filtro
function checkFilterButtons() {
  console.log('📋 5. Verificando estado de botones de filtro...');

  const buttonIds = ['curation-btn-24h', 'curation-btn-7d', 'curation-btn-30d'];

  buttonIds.forEach(buttonId => {
    const btn = document.getElementById(buttonId);
    if (btn) {
      console.log(`🔘 ${buttonId}:`, {
        filterState: btn.dataset.filterState,
        period: btn.dataset.period,
        value: btn.dataset.value,
        innerHTML: btn.querySelector('.curation-value')?.textContent,
      });
    } else {
      console.log(`❌ Botón ${buttonId} no encontrado`);
    }
  });
}

// 6. Verificar el estado global de filtros
function checkFilterState() {
  console.log('📋 6. Verificando estado global de filtros...');

  if (window.filterState) {
    console.log('✅ Estado de filtros:', window.filterState);
  } else {
    console.log('❌ No hay estado de filtros');
  }
}

// 7. Función para forzar actualización de datos
async function forceUpdateCurationData() {
  console.log('🔄 7. Forzando actualización de datos...');

  try {
    // Limpiar cache
    localStorage.removeItem('curation_stats_cache');
    console.log('🗑️ Cache limpiado');

    // Obtener datos frescos de la API
    const apiData = await checkCurationAPI();

    if (apiData) {
      // Actualizar botones manualmente
      const buttonIds = ['curation-btn-24h', 'curation-btn-7d', 'curation-btn-30d'];

      buttonIds.forEach(buttonId => {
        const btn = document.getElementById(buttonId);
        if (btn) {
          const period = btn.dataset.period;
          const valueElement = btn.querySelector('.curation-value');

          if (valueElement) {
            let value = 0;
            switch (period) {
              case '24h':
                value = apiData.curation24h || 0;
                break;
              case '7d':
                value = apiData.curation7d || 0;
                break;
              case '30d':
                value = apiData.curation30d || 0;
                break;
            }

            btn.dataset.value = value.toString();
            valueElement.textContent = `${value.toFixed(4)} HP`;
            console.log(`✅ ${buttonId} actualizado: ${value.toFixed(4)} HP`);
          }
        }
      });

      // Actualizar estado global
      if (window.filterState) {
        const activeBtn = document.querySelector('[data-filter-state="active"]');
        if (activeBtn) {
          const period = activeBtn.dataset.period;
          const value = parseFloat(activeBtn.dataset.value || '0');

          window.filterState.curationPeriod = period;
          window.filterState.curationValue = value;

          console.log(`✅ Estado global actualizado: ${period} = ${value} HP`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Error forzando actualización:', error);
  }
}

// 8. Función para ejecutar diagnóstico completo
async function runFullDiagnosis() {
  console.log('🔍 === EJECUTANDO DIAGNÓSTICO COMPLETO ===');

  // Verificaciones síncronas
  checkAuthenticationStatus();
  checkCurationCache();
  checkCurationFunction();
  checkFilterButtons();
  checkFilterState();

  // Verificaciones asíncronas
  await checkCurationAPI();

  console.log('🔍 === DIAGNÓSTICO COMPLETADO ===');
}

// 9. Función para solución rápida
async function quickFix() {
  console.log('🛠️ === APLICANDO SOLUCIÓN RÁPIDA ===');

  await forceUpdateCurationData();

  console.log('🛠️ === SOLUCIÓN APLICADA ===');
}

// Instrucciones de uso
console.log(`
📋 === INSTRUCCIONES DE USO ===

1. Ejecutar diagnóstico completo:
   runFullDiagnosis()

2. Aplicar solución rápida:
   quickFix()

3. Verificar función específica:
   checkCurationFunction()

4. Verificar API:
   checkCurationAPI()

5. Forzar actualización:
   forceUpdateCurationData()

===============================
`);

// Exportar funciones para uso en consola
window.diagnosticTools = {
  runFullDiagnosis,
  quickFix,
  checkCurationFunction,
  checkAuthenticationStatus,
  checkCurationCache,
  checkCurationAPI,
  checkFilterButtons,
  checkFilterState,
  forceUpdateCurationData,
};
