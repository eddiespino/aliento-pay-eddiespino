import { s as sessionManager } from '../../../chunks/SessionManager_D_9xdLr4.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async ({ cookies, locals }) => {
  try {
    console.log("✅ Validate API: Verificando sesión");
    const sessionToken = cookies.get(sessionManager.getConfig().cookieName)?.value;
    if (!sessionToken) {
      return new Response(
        JSON.stringify({
          valid: false,
          authenticated: false,
          user: null,
          error: "No hay token de sesión"
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        }
      );
    }
    const validation = sessionManager.validateSession(sessionToken);
    if (!validation.isValid) {
      cookies.delete(sessionManager.getConfig().cookieName, {
        path: "/"
      });
      return new Response(
        JSON.stringify({
          valid: false,
          authenticated: false,
          user: null,
          error: validation.error || "Sesión inválida"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const session = sessionManager.parseSessionToken(sessionToken);
    let renewedToken = null;
    if (session && sessionManager.isSessionNearExpiry(session)) {
      console.log(`🔄 Renovando sesión para usuario: ${session.username}`);
      const renewedSession = sessionManager.renewSession(session);
      renewedToken = sessionManager.generateSessionToken(renewedSession);
      cookies.set(sessionManager.getConfig().cookieName, renewedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: renewedSession.expiresAt,
        path: "/",
        maxAge: Math.floor(sessionManager.getConfig().sessionDuration / 1e3)
      });
    }
    console.log(`✅ Sesión válida para usuario: ${validation.user}`);
    return new Response(
      JSON.stringify({
        valid: true,
        authenticated: true,
        user: validation.user,
        expiresAt: validation.expiresAt?.toISOString(),
        renewed: !!renewedToken,
        renewedToken
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      }
    );
  } catch (error) {
    console.error("❌ Error en validate API:", error);
    return new Response(
      JSON.stringify({
        valid: false,
        authenticated: false,
        user: null,
        error: "Error interno validando sesión"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
const POST = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { token } = body;
    if (token) {
      const validation = sessionManager.validateSession(token);
      return new Response(
        JSON.stringify({
          valid: validation.isValid,
          authenticated: validation.isValid,
          user: validation.user || null,
          expiresAt: validation.expiresAt?.toISOString(),
          error: validation.error
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    return await (void 0).GET({ cookies });
  } catch (error) {
    console.error("❌ Error en validate POST:", error);
    return new Response(
      JSON.stringify({
        valid: false,
        authenticated: false,
        user: null,
        error: "Error validando sesión"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
