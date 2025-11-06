import { g as getAuthenticatedUser } from '../../chunks/middleware_BdI7ZZ7X.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const GET = async ({ request, locals }) => {
  try {
    const authenticatedUser = getAuthenticatedUser({ request, locals });
    if (!authenticatedUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Autenticación requerida. Debes iniciar sesión para obtener estadísticas de curación.",
          authenticated: false,
          curation24h: 0,
          curation7d: 0,
          curation30d: 0,
          lastUpdate: (/* @__PURE__ */ new Date()).toISOString(),
          timestamp: Date.now()
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    console.log(`🔐 API CurationStats - Usuario autenticado: ${authenticatedUser}`);
    const { curationStats } = await import('../../chunks/get-delegations_F_I3zebc.mjs');
    const curationStatsResult = await curationStats(authenticatedUser);
    if (!curationStatsResult) {
      throw new Error("No se pudieron obtener las estadísticas de curación");
    }
    const curationStatsForUI = {
      curation24h: curationStatsResult.total24Hr,
      curation7d: curationStatsResult.total7D,
      curation30d: curationStatsResult.total30D,
      lastUpdate: /* @__PURE__ */ new Date()
    };
    const response = {
      success: true,
      user: authenticatedUser,
      // Incluir usuario en la respuesta
      curation24h: curationStatsForUI.curation24h,
      curation7d: curationStatsForUI.curation7d,
      curation30d: curationStatsForUI.curation30d,
      lastUpdate: curationStatsForUI.lastUpdate,
      timestamp: Date.now(),
      error: false
    };
    console.log(`✅ API CurationStats - Datos obtenidos exitosamente para ${authenticatedUser}`);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, must-revalidate"
      }
    });
  } catch (error) {
    console.error("❌ API CurationStats - Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
        curation24h: 0,
        curation7d: 0,
        curation30d: 0,
        lastUpdate: (/* @__PURE__ */ new Date()).toISOString(),
        timestamp: Date.now()
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
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
