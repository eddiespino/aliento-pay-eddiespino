/**
 * 🛡️ ASTRO AUTHENTICATION MIDDLEWARE
 *
 * Middleware de autenticación para Astro que valida sesiones automáticamente
 * y protege rutas que requieren autenticación.
 */

// @ts-nocheck

import type { APIContext } from 'astro';
import { defineMiddleware } from 'astro:middleware';
import { sessionManager } from './lib/auth/SessionManager';

// Configuración de rutas protegidas y públicas
const PROTECTED_ROUTES = [
  '/dashboard',
  '/calculate',
  '/payments',
  '/api/calculate',
  '/api/curation-stats',
  '/api/delegations',
];

const PUBLIC_ROUTES = ['/', '/login', '/api/auth/login', '/api/auth/logout', '/api/auth/validate'];

// Rutas técnicas del navegador que deben permitirse
const BROWSER_ROUTES = ['/.well-known/', '/favicon.ico', '/robots.txt', '/sitemap.xml'];

// Rutas de API que requieren autenticación específica
const PROTECTED_API_ROUTES = ['/api/calculate', '/api/curation-stats', '/api/delegations'];

/**
 * Extrae el username de la sesión actual validando la sesión
 */
function extractUserFromSession(context: APIContext): string | null {
  try {
    // Usar el SessionManager para obtener sesiones directamente
    const session = sessionManager.getSessionFromContext(context);
    if (session) {
      // Verificar que la sesión no haya expirado manualmente
      if (session.expiresAt.getTime() > Date.now()) {
        return session.username;
      }
    }

    // Fallback: verificar headers para requests del cliente
    const authHeader = context.request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const validation = sessionManager.validateSession(token);
      if (validation.isValid) {
        return validation.user || null;
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting user from session:', error);
    return null;
  }
}

/**
 * Verifica si una ruta está protegida
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

/**
 * Verifica si es una ruta de API protegida
 */
function isProtectedAPIRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

/**
 * Verifica si es una ruta pública
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

/**
 * Verifica si es una ruta técnica del navegador
 */
function isBrowserRoute(pathname: string): boolean {
  return BROWSER_ROUTES.some(route => pathname === route || pathname.startsWith(route));
}

/**
 * Crea respuesta de error para APIs
 */
function createAPIErrorResponse(message: string, status: number = 401): Response {
  return new Response(
    JSON.stringify({
      error: message,
      authenticated: false,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}

/**
 * Middleware principal de autenticación
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  console.log(`🛡️ Middleware: ${context.request.method} ${pathname}`);

  // Permitir rutas técnicas del navegador sin procesamiento
  if (isBrowserRoute(pathname)) {
    console.log(`🔧 Ruta técnica del navegador: ${pathname}`);
    return next();
  }

  // Permitir rutas completamente públicas
  if (isPublicRoute(pathname)) {
    console.log(`✅ Ruta pública permitida: ${pathname}`);
    return next();
  }

  // Extraer usuario de la sesión
  const currentUser = extractUserFromSession(context);

  // Agregar información del usuario al contexto para uso posterior
  context.locals.user = currentUser;
  context.locals.isAuthenticated = !!currentUser;

  // Verificar autenticación para rutas protegidas
  if (isProtectedRoute(pathname)) {
    if (!currentUser) {
      console.log(`❌ Acceso denegado a ruta protegida: ${pathname}`);

      // Rutas de API: responder con JSON
      if (isProtectedAPIRoute(pathname)) {
        return createAPIErrorResponse(
          'Autenticación requerida. Debes iniciar sesión para acceder a este recurso.',
          401
        );
      }

      // Rutas de página: redirigir al login
      return context.redirect('/?reason=auth_required');
    }

    console.log(`✅ Usuario autenticado: ${currentUser} accediendo a ${pathname}`);

    // Para rutas de API protegidas, agregar el usuario autenticado a los headers
    if (isProtectedAPIRoute(pathname)) {
      // Crear una nueva request con el header de autenticación
      const headers = new Headers();

      // Copiar headers existentes
      context.request.headers.forEach((value, key) => {
        headers.set(key, value);
      });

      // Agregar el header de autenticación
      headers.set('x-authenticated-user', currentUser);

      console.log(
        `🔧 Middleware: Agregando header x-authenticated-user: ${currentUser} para ${pathname}`
      );

      const modifiedRequest = new Request(context.request.url, {
        method: context.request.method,
        headers: headers,
        body: context.request.body,
        // Node 18 requiere la opción 'duplex' cuando se envía un ReadableStream como body
        // @ts-ignore - la propiedad aún no está en los typings estándar
        duplex: 'half',
      } as any);

      // Actualizar el contexto con la nueva request
      context.request = modifiedRequest;
    }
  }

  // Log de debugging para desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 Middleware debug:`, {
      pathname,
      method: context.request.method,
      user: currentUser,
      isProtected: isProtectedRoute(pathname),
      isAPI: isProtectedAPIRoute(pathname),
      isPublic: isPublicRoute(pathname),
      isBrowser: isBrowserRoute(pathname),
    });
  }

  // Continuar con la request
  return next();
});

/**
 * Utilidad para obtener el usuario autenticado en componentes Astro
 */
export function getAuthenticatedUser(context: APIContext): string | null {
  return context.locals.user || null;
}

/**
 * Utilidad para verificar autenticación en componentes Astro
 */
export function isAuthenticated(context: APIContext): boolean {
  return context.locals.isAuthenticated === true;
}

/**
 * Utilidad para requerir autenticación (lanza error si no está autenticado)
 */
export function requireAuthentication(context: APIContext): string {
  const user = getAuthenticatedUser(context);
  if (!user) {
    throw new Error('Autenticación requerida');
  }
  return user;
}
