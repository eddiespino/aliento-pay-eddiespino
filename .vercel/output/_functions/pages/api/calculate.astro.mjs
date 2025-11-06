import { g as getCurationStatsForUI, c as calculateCurationDistribution, a as getPaymentConfigForAccount, b as calculateDynamicPayments } from '../../chunks/payment-calculator_Bl_B6joU.mjs';
import { v as validateApiAuthentication } from '../../chunks/protected-functions_CRY-T2Fm.mjs';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async ({ request, locals }) => {
  try {
    const authValidation = await validateApiAuthentication(request);
    if (!authValidation.isAuthenticated || !authValidation.user) {
      return new Response(
        JSON.stringify({
          error: authValidation.error || "Autenticación requerida. Debes iniciar sesión para realizar cálculos.",
          success: false,
          authenticated: false
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const authenticatedUser = authValidation.user;
    console.log(`🔐 API Calculate - Usuario autenticado con guards: ${authenticatedUser}`);
    let filters;
    try {
      const body = await request.text();
      console.log("🔍 Body recibido:", body);
      if (!body || body.trim() === "") {
        throw new Error("Body vacío");
      }
      filters = JSON.parse(body);
    } catch (jsonError) {
      console.error("❌ Error parseando JSON:", jsonError);
      return new Response(
        JSON.stringify({
          error: "JSON inválido en el body de la petición",
          success: false
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    console.log("🔄 API Calculate - Filtros recibidos:", filters);
    if (!filters || !filters.applied) {
      return new Response(
        JSON.stringify({
          error: "Filtros no válidos o no aplicados",
          success: false
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const userAccount = authenticatedUser;
    const defaultInterestPercentage = 10;
    let curationStats = null;
    let updatedFilters = { ...filters };
    if (!updatedFilters.curationValue || updatedFilters.curationValue === 0) {
      console.log("🔄 curationValue no definido, obteniendo estadísticas de curación...");
      curationStats = await getCurationStatsForUI(userAccount);
      switch (updatedFilters.curationPeriod) {
        case "24h":
          updatedFilters.curationValue = curationStats.curation24h;
          break;
        case "7d":
          updatedFilters.curationValue = curationStats.curation7d;
          break;
        case "30d":
        default:
          updatedFilters.curationValue = curationStats.curation30d;
          break;
      }
      console.log(`✅ curationValue actualizado desde API: ${updatedFilters.curationValue} HP`);
    } else {
      console.log(
        `✅ curationValue ya disponible desde cliente: ${updatedFilters.curationValue} HP`
      );
      curationStats = {
        curation24h: 0,
        curation7d: 0,
        curation30d: 0,
        lastUpdate: /* @__PURE__ */ new Date()
      };
      switch (updatedFilters.curationPeriod) {
        case "24h":
          curationStats.curation24h = updatedFilters.curationValue;
          break;
        case "7d":
          curationStats.curation7d = updatedFilters.curationValue;
          break;
        case "30d":
        default:
          curationStats.curation30d = updatedFilters.curationValue;
          break;
      }
    }
    const calculationResult = await calculateCurationDistribution(
      userAccount,
      updatedFilters,
      updatedFilters.curationValue || 0,
      defaultInterestPercentage
    );
    const userPaymentConfig = await getPaymentConfigForAccount(userAccount);
    const dynamicPaymentConfig = await calculateDynamicPayments(
      calculationResult,
      updatedFilters,
      userPaymentConfig
    );
    const response = {
      success: true,
      user: userAccount,
      // Incluir usuario en la respuesta
      userPaymentConfig,
      // Incluir configuración personalizada del usuario
      filters: updatedFilters,
      curationStats,
      calculationResult,
      dynamicPaymentConfig,
      defaultInterestPercentage
    };
    console.log(`✅ API Calculate - Cálculo completado para ${userAccount}:`, {
      delegators: calculationResult.delegators.length,
      totalHP: calculationResult.totalHP,
      totalHive: calculationResult.totalHiveToDistribute
    });
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("❌ API Calculate - Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Error interno del servidor",
        success: false
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
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
