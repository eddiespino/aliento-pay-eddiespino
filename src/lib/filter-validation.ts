import type { CalculateFilters } from './calculate-curation';

/**
 * Valida si un objeto tiene la estructura correcta de CalculateFilters
 */
export function isValidFilterObject(obj: any): obj is CalculateFilters {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Validar propiedades requeridas
  const requiredProps = ['timePeriod', 'minimumHP', 'excludedUsers', 'applied'];
  for (const prop of requiredProps) {
    if (!(prop in obj)) {
      return false;
    }
  }

  // Validar tipos específicos
  if (typeof obj.timePeriod !== 'number' || obj.timePeriod < 1 || obj.timePeriod > 365) {
    return false;
  }

  if (typeof obj.minimumHP !== 'number' || obj.minimumHP < 0) {
    return false;
  }

  if (!Array.isArray(obj.excludedUsers)) {
    return false;
  }

  if (typeof obj.applied !== 'boolean') {
    return false;
  }

  // Validar propiedades opcionales
  if (obj.curationPeriod && !['24h', '7d', '30d'].includes(obj.curationPeriod)) {
    return false;
  }

  if (obj.curationValue && typeof obj.curationValue !== 'number') {
    return false;
  }

  return true;
}

/**
 * Normaliza un objeto de filtros para asegurar que tenga la estructura correcta
 */
export function normalizeFilters(rawFilters: any): CalculateFilters {
  const defaultFilters: CalculateFilters = {
    timePeriod: 30,
    minimumHP: 50,
    excludedUsers: [],
    applied: true,
    curationPeriod: '30d',
    curationValue: 0,
  };

  if (!rawFilters || typeof rawFilters !== 'object') {
    return defaultFilters;
  }

  return {
    timePeriod:
      typeof rawFilters.timePeriod === 'number' && rawFilters.timePeriod > 0
        ? Math.min(rawFilters.timePeriod, 365)
        : defaultFilters.timePeriod,
    minimumHP:
      typeof rawFilters.minimumHP === 'number' && rawFilters.minimumHP >= 0
        ? rawFilters.minimumHP
        : defaultFilters.minimumHP,
    excludedUsers: Array.isArray(rawFilters.excludedUsers)
      ? rawFilters.excludedUsers.filter(
          (user: any) => typeof user === 'string' && user.trim() !== ''
        )
      : defaultFilters.excludedUsers,
    applied: typeof rawFilters.applied === 'boolean' ? rawFilters.applied : defaultFilters.applied,
    curationPeriod:
      typeof rawFilters.curationPeriod === 'string' &&
      ['24h', '7d', '30d'].includes(rawFilters.curationPeriod)
        ? rawFilters.curationPeriod
        : defaultFilters.curationPeriod,
    curationValue:
      typeof rawFilters.curationValue === 'number' && rawFilters.curationValue >= 0
        ? rawFilters.curationValue
        : defaultFilters.curationValue,
  };
}

/**
 * Codifica filtros para usar en URL
 */
export function encodeFiltersForUrl(filters: CalculateFilters): string {
  try {
    return encodeURIComponent(JSON.stringify(filters));
  } catch (error) {
    console.error('❌ Error codificando filtros:', error);
    throw new Error('Error al codificar filtros para URL');
  }
}

/**
 * Decodifica filtros desde URL
 */
export function decodeFiltersFromUrl(encodedFilters: string): CalculateFilters {
  try {
    const decoded = decodeURIComponent(encodedFilters);
    const parsed = JSON.parse(decoded);

    if (!isValidFilterObject(parsed)) {
      console.warn('⚠️ Filtros inválidos, usando normalización');
      return normalizeFilters(parsed);
    }

    return parsed;
  } catch (error) {
    console.error('❌ Error decodificando filtros:', error);
    throw new Error('Error al decodificar filtros desde URL');
  }
}

/**
 * Obtiene filtros desde sessionStorage
 */
export function getFiltersFromSessionStorage(): CalculateFilters | null {
  try {
    const stored = sessionStorage.getItem('applied_filters');
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);

    if (!isValidFilterObject(parsed)) {
      console.warn('⚠️ Filtros en sessionStorage inválidos, limpiando');
      sessionStorage.removeItem('applied_filters');
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('❌ Error obteniendo filtros desde sessionStorage:', error);
    sessionStorage.removeItem('applied_filters');
    return null;
  }
}

/**
 * Guarda filtros en sessionStorage
 */
export function saveFiltersToSessionStorage(filters: CalculateFilters): void {
  try {
    if (!isValidFilterObject(filters)) {
      throw new Error('Filtros inválidos');
    }

    sessionStorage.setItem('applied_filters', JSON.stringify(filters));
    console.log('✅ Filtros guardados en sessionStorage');
  } catch (error) {
    console.error('❌ Error guardando filtros en sessionStorage:', error);
    throw new Error('Error al guardar filtros en sessionStorage');
  }
}
