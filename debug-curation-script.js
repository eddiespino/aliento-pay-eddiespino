// 🔍 SCRIPT DE DIAGNÓSTICO PARA PROBLEMAS DE CURACIÓN
// Ejecutar este script en la consola del navegador en la página del dashboard

console.log('🔍 === DIAGNÓSTICO DE CURACIÓN ===');

// 1. Verificar variables globales
console.log('\n📋 1. VERIFICACIÓN DE VARIABLES GLOBALES:');
console.log('- window.getCurationStatsData:', typeof window.getCurationStatsData);
console.log('- window.refreshCurationStats:', typeof window.refreshCurationStats);
console.log('- window.userCache:', typeof window.userCache);

// 2. Verificar localStorage
console.log('\n💾 2. VERIFICACIÓN DE LOCALSTORAGE:');
const user = localStorage.getItem('authenticated_user');
console.log('- authenticated_user:', user);
console.log(
  '- dashboard_curation_stats:',
  localStorage.getItem('dashboard_curation_stats') ? 'EXISTS' : 'NOT_FOUND'
);

// 3. Verificar caché del usuario
console.log('\n📊 3. VERIFICACIÓN DE CACHÉ DE USUARIO:');
if (window.userCache) {
  try {
    const curationAge = window.userCache.getAge('curation_stats');
    console.log('- curationAge:', curationAge);
    console.log('- hasCurationData:', window.userCache.has('curation_stats'));
  } catch (error) {
    console.error('- Error accediendo al userCache:', error.message);
  }
} else {
  console.log('- userCache no disponible');
}

// 4. Probar función de curación
console.log('\n🧪 4. PRUEBA DE FUNCIÓN DE CURACIÓN:');
if (typeof window.getCurationStatsData === 'function') {
  console.log('✅ getCurationStatsData disponible, probando...');

  window
    .getCurationStatsData()
    .then(data => {
      console.log('✅ Función ejecutada exitosamente');
      console.log('📊 Datos:', data);
    })
    .catch(error => {
      console.error('❌ Error ejecutando función:', error);
    });
} else {
  console.error('❌ getCurationStatsData NO está disponible');
}

// 5. Probar endpoint directo
console.log('\n🌐 5. PRUEBA DE ENDPOINT DIRECTO:');
fetch('/api/curation-stats')
  .then(response => {
    console.log('- Response status:', response.status);
    console.log('- Response ok:', response.ok);
    return response.json();
  })
  .then(data => {
    console.log('✅ Endpoint respondió correctamente');
    console.log('📊 Datos del endpoint:', data);
  })
  .catch(error => {
    console.error('❌ Error en endpoint:', error);
  });

// 6. Verificar elementos DOM
console.log('\n🎯 6. VERIFICACIÓN DE DOM:');
const elements = {
  'curation-stats': document.getElementById('curation-stats'),
  'curation-loading': document.getElementById('curation-loading'),
  'curation-error': document.getElementById('curation-error'),
};

Object.entries(elements).forEach(([id, element]) => {
  console.log(`- ${id}:`, element ? 'FOUND' : 'NOT_FOUND');
});

// 7. Verificar timers y locks
console.log('\n🔒 7. VERIFICACIÓN DE LOCKS Y TIMERS:');
console.log('- isRefreshingCurationStats:', window.isRefreshingCurationStats || 'undefined');
console.log('- refreshCurationStatsPromise:', window.refreshCurationStatsPromise || 'undefined');

console.log('\n🔍 === FIN DEL DIAGNÓSTICO ===');
