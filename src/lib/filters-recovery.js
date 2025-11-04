// Recuperación dinámica de filtros para calculate.astro
console.log('🚀 CARGANDO FILTROS - Script iniciado');

// Función para recuperar filtros de todas las fuentes
function getFiltersFromAllSources() {
  console.log('🔍 Buscando filtros en todas las fuentes...');

  // 1. Verificar URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlFilters = urlParams.get('filters');

  if (urlFilters) {
    try {
      const decodedFilters = JSON.parse(decodeURIComponent(urlFilters));
      console.log('✅ FILTROS DESDE URL:', decodedFilters);
      return { filters: decodedFilters, source: 'url' };
    } catch (e) {
      console.error('❌ Error parseando URL:', e);
    }
  } else {
    console.log('ℹ️ No hay filtros en URL');
  }

  // 2. Verificar sessionStorage
  try {
    const sessionFilters = sessionStorage.getItem('applied_filters');
    console.log('📦 SessionStorage raw:', sessionFilters);

    if (sessionFilters) {
      const parsed = JSON.parse(sessionFilters);
      console.log('🔍 SessionStorage parsed:', parsed);

      if (parsed && parsed.applied === true) {
        console.log('✅ FILTROS VÁLIDOS DESDE SESSIONSTORAGE');
        return { filters: parsed, source: 'sessionStorage' };
      } else {
        console.log('⚠️ Filtros en sessionStorage no aplicados');
      }
    } else {
      console.log('❌ No hay datos en sessionStorage');
    }
  } catch (e) {
    console.error('❌ Error con sessionStorage:', e);
  }

  // 3. Verificar localStorage como backup
  try {
    const localFilters = localStorage.getItem('applied_filters');
    if (localFilters) {
      const parsed = JSON.parse(localFilters);
      if (parsed && parsed.applied === true) {
        console.log('✅ FILTROS DESDE LOCALSTORAGE (backup)');
        return { filters: parsed, source: 'localStorage' };
      }
    }
  } catch (e) {
    console.error('❌ Error con localStorage:', e);
  }

  console.log('❌ No se encontraron filtros válidos');
  return null;
}

// Función para aplicar filtros a la UI
function applyFiltersToUI(filters, source) {
  console.log(`🎨 APLICANDO FILTROS desde ${source}:`, filters);

  // Actualizar período de tiempo
  const timePeriodDisplay = document.querySelector('.text-blue-600 .text-xs');
  if (timePeriodDisplay) {
    const periodText = filters.timePeriod === 1 ? '1 día' : `${filters.timePeriod} días`;
    timePeriodDisplay.textContent = periodText;
    console.log(`✅ Período actualizado: ${periodText}`);
  }

  // Actualizar HP mínimo
  const minimumHPDisplay = document.querySelector('.text-purple-600 .text-xs');
  if (minimumHPDisplay) {
    minimumHPDisplay.textContent = `${filters.minimumHP} HP`;
    console.log(`✅ HP mínimo actualizado: ${filters.minimumHP} HP`);
  }

  // Actualizar usuarios excluidos
  const excludedUsersDisplay = document.querySelector('.text-red-600 .text-xs');
  if (excludedUsersDisplay) {
    const excludedText =
      filters.excludedUsers.length > 0
        ? `${filters.excludedUsers.length} usuario${filters.excludedUsers.length > 1 ? 's' : ''}`
        : 'Ninguno';
    excludedUsersDisplay.textContent = excludedText;
    console.log(`✅ Usuarios excluidos actualizado: ${excludedText}`);
  }

  // Actualizar período de curación
  const curationPeriodDisplay = document.querySelector('.text-emerald-600 .text-xs');
  if (curationPeriodDisplay) {
    const periodMap = {
      '24h': 'Últimas 24 horas',
      '7d': 'Últimos 7 días',
      '30d': 'Últimos 30 días',
    };
    const periodText = periodMap[filters.curationPeriod] || 'Últimos 30 días';
    curationPeriodDisplay.textContent = periodText;
    console.log(`✅ Período de curación actualizado: ${periodText}`);
  }

  // Mostrar indicador de fuente
  showSourceIndicator(source);
}

// Función para mostrar indicador de fuente
function showSourceIndicator(source) {
  const filtersSection = document.querySelector('[data-filters-display]');
  if (!filtersSection) {
    console.log('❌ No se encontró sección de filtros');
    return;
  }

  // Remover indicadores existentes
  const existing = filtersSection.querySelectorAll('.filters-source-indicator');
  existing.forEach(el => el.remove());

  // Crear indicador
  const indicator = document.createElement('div');
  indicator.className = 'filters-source-indicator mb-3 p-2 rounded-lg text-sm border';

  if (source === 'sessionStorage') {
    indicator.className +=
      ' bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800';
    indicator.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="font-medium">✅ Filtros aplicados desde dashboard</span>
      </div>
    `;
  } else if (source === 'url') {
    indicator.className +=
      ' bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
    indicator.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
        </svg>
        <span class="font-medium">🔗 Filtros desde URL</span>
      </div>
    `;
  }

  // Insertar al inicio
  const title = filtersSection.querySelector('h3');
  if (title) {
    title.parentNode.insertBefore(indicator, title.nextSibling);
    console.log(`✅ Indicador de fuente agregado: ${source}`);
  }
}

// Función principal de recuperación
function recoverFilters() {
  console.log('🔄 INICIANDO RECUPERACIÓN DE FILTROS...');

  const result = getFiltersFromAllSources();

  if (result) {
    console.log(`🎯 FILTROS ENCONTRADOS desde ${result.source}`);

    // Aplicar con un pequeño delay para asegurar que la UI esté lista
    setTimeout(() => {
      applyFiltersToUI(result.filters, result.source);
      console.log('✅ FILTROS APLICADOS EXITOSAMENTE');
    }, 100);
  } else {
    console.log('⚠️ No se encontraron filtros, manteniendo valores por defecto');
  }
}

// Auto-ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 DOM LOADED - Ejecutando recuperación');
    setTimeout(recoverFilters, 200);
  });
} else {
  console.log('📋 DOM YA LISTO - Ejecutando recuperación inmediata');
  setTimeout(recoverFilters, 200);
}

// También exportar para uso manual
window.recoverFilters = recoverFilters;
window.debugFilters = () => {
  console.log('🔍 DEBUG MANUAL:');
  console.log('  - URL:', window.location.search);
  console.log('  - SessionStorage:', sessionStorage.getItem('applied_filters'));
  console.log('  - LocalStorage:', localStorage.getItem('applied_filters'));
};

console.log('✅ Script de recuperación de filtros cargado');
