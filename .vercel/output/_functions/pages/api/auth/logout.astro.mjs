import { s as sessionManager } from '../../../chunks/SessionManager_D_9xdLr4.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ cookies, locals }) => {
  try {
    console.log("🔓 Logout API: Cerrando sesión");
    const currentUser = locals.user;
    cookies.delete(sessionManager.getConfig().cookieName, {
      path: "/"
    });
    locals.user = null;
    locals.isAuthenticated = false;
    console.log(`✅ Sesión cerrada para usuario: ${currentUser || "desconocido"}`);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Sesión cerrada exitosamente",
        user: currentUser
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
    console.error("❌ Error en logout API:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error cerrando sesión"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
const GET = async ({ cookies, locals, redirect }) => {
  try {
    const currentUser = locals.user;
    cookies.delete(sessionManager.getConfig().cookieName, {
      path: "/"
    });
    console.log(`✅ Logout via GET para usuario: ${currentUser || "desconocido"}`);
    return redirect("/?logged_out=true");
  } catch (error) {
    console.error("❌ Error en logout GET:", error);
    return redirect("/?error=logout_failed");
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
