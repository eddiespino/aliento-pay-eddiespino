// 🧹 SCRIPT DE LIMPIEZA DE CACHÉ Y LOCALSTORAGE
// Para usar en consola del navegador

console.log('🧹 === LIMPIEZA DE CACHÉ Y CONFIGURACIÓN ===');

// 1. Limpiar localStorage
console.log('🗑️ Limpiando localStorage...');
const keysToRemove = [
  'dashboard_curation_stats',
  'dashboard_delegation_stats',
  'dashboard_last_update',
  'applied_filters',
  'filter_configuration',
  'authenticated_user', // Opcional: remover solo si quieres probar login
];

keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    console.log(`✅ Removido: ${key}`);
  }
});

// 2. Limpiar sessionStorage
console.log('🗑️ Limpiando sessionStorage...');
const sessionKeysToRemove = ['applied_filters', 'calculate_loading', 'calculate_source'];

sessionKeysToRemove.forEach(key => {
  if (sessionStorage.getItem(key)) {
    sessionStorage.removeItem(key);
    console.log(`✅ Removido de session: ${key}`);
  }
});

// 3. Limpiar variables globales
console.log('🗑️ Limpiando variables globales...');
if (window.filterState) {
  window.filterState = {
    timePeriod: 30,
    minimumHP: 50,
    excludedUsers: [],
    applied: false,
    curationPeriod: '30d',
    curationValue: 0,
  };
  console.log('✅ filterState reseteado');
}

// 4. Limpiar caché del userCache si existe
console.log('🗑️ Limpiando userCache...');
if (window.userCache && typeof window.userCache.clearAll === 'function') {
  window.userCache.clearAll();
  console.log('✅ userCache limpiado');
}

// 5. Mostrar estado final
console.log('📊 Estado final del localStorage:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key) {
    console.log(`- ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
  }
}

console.log('✅ Limpieza completa. Recargar la página para probar desde cero.');
console.log('🔄 Ejecuta: window.location.reload()');

// Función para recargar automáticamente
function reloadPage() {
  console.log('🔄 Recargando página...');
  window.location.reload();
}

// Ofrecer opción de recarga automática
console.log('💡 Para recargar automáticamente: reloadPage()');
