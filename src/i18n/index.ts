import esTranslations from './es.json';
import enTranslations from './en.json';

// Tipos para las traducciones
export type Locale = 'es' | 'en';
export type TranslationKey = keyof typeof esTranslations;

// Traducciones disponibles
const translations = {
  es: esTranslations,
  en: enTranslations,
} as const;

// Default language - Changed to English
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Detects language from URL or returns default
 * Priority: URL path > default locale
 *
 * Examples:
 * - /en/dashboard -> 'en'
 * - /es/dashboard -> 'es'
 * - /dashboard -> DEFAULT_LOCALE ('en')
 */
export function detectLocale(pathname: string): Locale {
  if (pathname.startsWith('/en/')) {
    return 'en';
  }
  if (pathname.startsWith('/es/')) {
    return 'es';
  }
  return DEFAULT_LOCALE;
}

/**
 * Gets current locale from Astro context
 * This is a helper for Astro components
 * Now uses locale from middleware (Astro.locals.locale) for consistency
 */
export function getCurrentLocale(Astro: any): Locale {
  // Prefer locale from middleware (set in context.locals)
  if (Astro.locals?.locale) {
    return Astro.locals.locale as Locale;
  }

  // Fallback to Astro's currentLocale (from built-in i18n)
  if (Astro.currentLocale) {
    return Astro.currentLocale as Locale;
  }

  // Final fallback to manual detection (for backwards compatibility)
  const pathname = Astro.url?.pathname || Astro.request?.url || '';
  const pathString = typeof pathname === 'string' ? pathname : pathname.toString();
  return detectLocale(pathString);
}

/**
 * Obtiene la traducción para una clave específica
 */
export function getTranslation(locale: Locale, key: string): string {
  const keys = key.split('.');
  let value: any = translations[locale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback al idioma por defecto
      value = translations[DEFAULT_LOCALE];
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return key; // Devolver la clave si no se encuentra
        }
      }
      break;
    }
  }

  return typeof value === 'string' ? value : key;
}

/**
 * Función helper para traducir (alias más corto)
 */
export function t(locale: Locale, key: string): string {
  return getTranslation(locale, key);
}

/**
 * Obtiene la URL con el idioma especificado
 */
export function getLocalizedPath(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) {
    return path;
  }
  return `/${locale}${path}`;
}

/**
 * Obtiene la URL alternativa para cambio de idioma
 */
export function getAlternateLanguageUrl(currentPath: string, currentLocale: Locale): string {
  const alternateLocale = currentLocale === 'es' ? 'en' : 'es';

  // Remover el prefijo de idioma actual si existe
  let basePath = currentPath;
  if (currentPath.startsWith('/en/')) {
    basePath = currentPath.replace('/en', '');
  }

  return getLocalizedPath(basePath, alternateLocale);
}

/**
 * Obtiene las locales disponibles
 */
export function getAvailableLocales(): Locale[] {
  return Object.keys(translations) as Locale[];
}

/**
 * Formatea fechas según el idioma
 */
export function formatDate(date: Date | string, locale: Locale): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const localeCode = locale === 'es' ? 'es-ES' : 'en-US';

  return dateObj.toLocaleDateString(localeCode, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formatea números según el idioma
 */
export function formatNumber(number: number, locale: Locale): string {
  const localeCode = locale === 'es' ? 'es-ES' : 'en-US';
  return number.toLocaleString(localeCode);
}

// Re-exportar las traducciones para uso directo si es necesario
export { esTranslations, enTranslations, translations };
