import { d as defineMiddleware } from './index_DvFy-YNV.mjs';
import { s as sessionManager } from './SessionManager_D_9xdLr4.mjs';

const PROTECTED_ROUTES = [
  "/dashboard",
  "/calculate",
  "/payments",
  "/api/calculate",
  "/api/curation-stats",
  "/api/delegations"
];
const PUBLIC_ROUTES = ["/", "/login", "/api/auth/login", "/api/auth/logout", "/api/auth/validate"];
const BROWSER_ROUTES = ["/.well-known/", "/favicon.ico", "/robots.txt", "/sitemap.xml"];
const PROTECTED_API_ROUTES = ["/api/calculate", "/api/curation-stats", "/api/delegations"];
function extractUserFromSession(context) {
  try {
    const session = sessionManager.getSessionFromContext(context);
    if (session) {
      if (session.expiresAt.getTime() > Date.now()) {
        return session.username;
      }
    }
    const authHeader = context.request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const validation = sessionManager.validateSession(token);
      if (validation.isValid) {
        return validation.user || null;
      }
    }
    return null;
  } catch (error) {
    console.error("Error extracting user from session:", error);
    return null;
  }
}
function isProtectedRoute(pathname) {
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}
function isProtectedAPIRoute(pathname) {
  return PROTECTED_API_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}
function isPublicRoute(pathname) {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}
function isBrowserRoute(pathname) {
  return BROWSER_ROUTES.some((route) => pathname === route || pathname.startsWith(route));
}
function createAPIErrorResponse(message, status = 401) {
  return new Response(
    JSON.stringify({
      error: message,
      authenticated: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    }
  );
}
const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  console.log(`🛡️ Middleware: ${context.request.method} ${pathname}`);
  if (isBrowserRoute(pathname)) {
    console.log(`🔧 Ruta técnica del navegador: ${pathname}`);
    return next();
  }
  if (isPublicRoute(pathname)) {
    console.log(`✅ Ruta pública permitida: ${pathname}`);
    return next();
  }
  const currentUser = extractUserFromSession(context);
  context.locals.user = currentUser;
  context.locals.isAuthenticated = !!currentUser;
  if (isProtectedRoute(pathname)) {
    if (!currentUser) {
      console.log(`❌ Acceso denegado a ruta protegida: ${pathname}`);
      if (isProtectedAPIRoute(pathname)) {
        return createAPIErrorResponse(
          "Autenticación requerida. Debes iniciar sesión para acceder a este recurso.",
          401
        );
      }
      return context.redirect("/?reason=auth_required");
    }
    console.log(`✅ Usuario autenticado: ${currentUser} accediendo a ${pathname}`);
    if (isProtectedAPIRoute(pathname)) {
      const headers = new Headers();
      context.request.headers.forEach((value, key) => {
        headers.set(key, value);
      });
      headers.set("x-authenticated-user", currentUser);
      console.log(
        `🔧 Middleware: Agregando header x-authenticated-user: ${currentUser} para ${pathname}`
      );
      const modifiedRequest = new Request(context.request.url, {
        method: context.request.method,
        headers,
        body: context.request.body,
        // Node 18 requiere la opción 'duplex' cuando se envía un ReadableStream como body
        // @ts-ignore - la propiedad aún no está en los typings estándar
        duplex: "half"
      });
      context.request = modifiedRequest;
    }
  }
  if (process.env.NODE_ENV === "development") {
    console.log(`🔍 Middleware debug:`, {
      pathname,
      method: context.request.method,
      user: currentUser,
      isProtected: isProtectedRoute(pathname),
      isAPI: isProtectedAPIRoute(pathname),
      isPublic: isPublicRoute(pathname),
      isBrowser: isBrowserRoute(pathname)
    });
  }
  return next();
});
function getAuthenticatedUser(context) {
  return context.locals.user || null;
}
function requireAuthentication(context) {
  const user = getAuthenticatedUser(context);
  if (!user) {
    throw new Error("Autenticación requerida");
  }
  return user;
}

export { getAuthenticatedUser as g, onRequest as o, requireAuthentication as r };
