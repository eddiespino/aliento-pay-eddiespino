// Script del cliente para manejo de filtros - Versión mejorada
(function () {
  'use strict';

  console.log('🚀 Calculate page - Script del cliente iniciado');

  // Verificar si hay filtros en la URL actual
  const currentUrl = new URL(window.location.href);
  const filtersParam = currentUrl.searchParams.get('filters');

  console.log('🔍 Filtros desde URL (cliente):', filtersParam);
  console.log('🔍 URL completa (cliente):', window.location.href);

  // Si hay filtros en la URL del cliente, procesarlos inmediatamente
  if (filtersParam) {
    console.log('✅ Filtros encontrados en URL del cliente, procesando...');

    try {
      const filtersObj = JSON.parse(decodeURIComponent(filtersParam));

      if (filtersObj && filtersObj.applied) {
        console.log('✅ Filtros válidos desde URL del cliente:', filtersObj);

        // Mostrar los filtros inmediatamente en la UI
        showFiltersInUI(filtersObj);

        return; // Salir temprano si hay filtros válidos
      }
    } catch (error) {
      console.error('❌ Error procesando filtros desde URL del cliente:', error);
    }
  }

  // Función para mostrar filtros en la UI
  function showFiltersInUI(filtersObj) {
    console.log('🎨 Mostrando filtros en la UI...');

    // Esperar a que el DOM esté listo
    const updateUI = () => {
      // Ocultar mensaje de loading
      const loadingMessage = document.querySelector('[data-filters-loading]');
      if (loadingMessage) {
        loadingMessage.style.display = 'none';
        console.log('🔄 Mensaje de loading ocultado');
      }

      // Mostrar sección de filtros aplicados
      const filtersSection = document.querySelector('[data-filters-applied]');
      if (filtersSection) {
        filtersSection.style.display = 'block';
        console.log('🔄 Sección de filtros mostrada');

        // Actualizar valores en los elementos
        const timePeriodElement = document.querySelector('[data-filter-time-period]');
        if (timePeriodElement) {
          timePeriodElement.textContent = `${filtersObj.timePeriod} días`;
        }

        const minimumHPElement = document.querySelector('[data-filter-minimum-hp]');
        if (minimumHPElement) {
          minimumHPElement.textContent = `${filtersObj.minimumHP} HP`;
        }

        const curationPeriodElement = document.querySelector('[data-filter-curation-period]');
        if (curationPeriodElement) {
          curationPeriodElement.textContent = filtersObj.curationPeriod;
        }

        const excludedUsersElement = document.querySelector('[data-filter-excluded-users]');
        if (excludedUsersElement) {
          excludedUsersElement.textContent = `${filtersObj.excludedUsers.length} usuarios`;
        }
      }
    };

    // Intentar actualizar inmediatamente
    updateUI();

    // También intentar cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateUI);
    }
  }

  // Función para buscar filtros en sessionStorage
  function checkSessionStorageFilters() {
    console.log('🔍 Buscando filtros en sessionStorage...');

    try {
      const sessionFilters = sessionStorage.getItem('appliedFilters');
      if (sessionFilters) {
        console.log('📦 Filtros encontrados en sessionStorage:', sessionFilters);

        const filtersObj = JSON.parse(sessionFilters);

        if (filtersObj && filtersObj.applied) {
          console.log('✅ Filtros aplicados encontrados, redirigiendo...');
          const filtersEncoded = encodeURIComponent(JSON.stringify(filtersObj));
          window.location.href = `/calculate?filters=${filtersEncoded}`;
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Error procesando sessionStorage:', error);
      return false;
    }
  }

  // Función para redirigir al dashboard
  function redirectToDashboard() {
    console.log('🔙 No hay filtros aplicados, redirigiendo al dashboard...');
    window.location.href = '/dashboard';
  }

  // Si no hay filtros en la URL, intentar con sessionStorage
  if (!filtersParam) {
    console.log('⚠️ No hay filtros en URL del cliente, buscando en sessionStorage...');

    if (!checkSessionStorageFilters()) {
      // Si no hay filtros, redirigir al dashboard después de un breve delay
      setTimeout(redirectToDashboard, 2000);
    }
  }

  // Verificar autenticación cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', async function () {
    console.log('📄 DOM loaded, verificando autenticación...');

    // Verificar autenticación
    try {
      const { container } = await import('../application/Container');
      const authUseCase = container.getAuthenticationUseCase();
      const authenticatedUser = authUseCase.getCurrentUser();

      if (authenticatedUser) {
        console.log(`👤 Usuario autenticado: @${authenticatedUser}`);
        const userSubtitle = document.getElementById('user-subtitle');
        if (userSubtitle) {
          userSubtitle.textContent = `Distribución de recompensas entre delegadores de @${authenticatedUser}`;
        }
      } else {
        console.warn('⚠️ No se encontró usuario autenticado, redirigiendo a login');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
    }
  });
})();
