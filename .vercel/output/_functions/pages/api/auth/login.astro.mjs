import { s as sessionManager } from '../../../chunks/SessionManager_D_9xdLr4.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, cookies, redirect }) => {
  try {
    console.log("🔐 Login API: Iniciando proceso de autenticación");
    const body = await request.json();
    const { username, signature, challenge } = body;
    if (!username || typeof username !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Username es requerido"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Username debe tener al menos 3 caracteres"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    console.log(`🔍 Procesando login para usuario: ${cleanUsername}`);
    try {
      const session = sessionManager.createSession(cleanUsername, signature);
      const token = sessionManager.generateSessionToken(session);
      cookies.set(sessionManager.getConfig().cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: session.expiresAt,
        path: "/",
        maxAge: Math.floor(sessionManager.getConfig().sessionDuration / 1e3)
      });
      console.log(`✅ Login exitoso para: ${cleanUsername}`);
      const response = {
        success: true,
        user: cleanUsername,
        token,
        // Para uso del cliente si es necesario
        expiresAt: session.expiresAt.toISOString()
      };
      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        }
      );
    } catch (authError) {
      console.error("❌ Error en autenticación:", authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: authError instanceof Error ? authError.message : "Error interno de autenticación"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error("❌ Error en login API:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error interno del servidor"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
const GET = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get(sessionManager.getConfig().cookieName)?.value;
    if (!sessionToken) {
      return new Response(
        JSON.stringify({
          authenticated: false,
          user: null
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const validation = sessionManager.validateSession(sessionToken);
    return new Response(
      JSON.stringify({
        authenticated: validation.isValid,
        user: validation.user || null,
        expiresAt: validation.expiresAt?.toISOString() || null,
        error: validation.error || null
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
    console.error("Error verificando estado de autenticación:", error);
    return new Response(
      JSON.stringify({
        authenticated: false,
        user: null,
        error: "Error verificando sesión"
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
