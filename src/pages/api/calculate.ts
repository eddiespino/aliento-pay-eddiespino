import type { APIRoute } from 'astro';
import { calculateCurationDistribution, type CalculateFilters } from '../../lib/calculate-curation';
import {
  calculateDynamicPayments,
  getPaymentConfigForAccount,
  getCurationStatsForUI,
} from '../../lib/payment-calculator';
import { getAuthenticatedUser, requireAuthentication } from '../../middleware';
import { validateApiAuthentication, protectedCalculateDynamicPayments } from '../../lib/auth/protected-functions';

// Configurar como server-rendered
export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 🔐 VALIDACIÓN DE AUTENTICACIÓN REQUERIDA CON GUARDS
    const authValidation = await validateApiAuthentication(request);
    if (!authValidation.isAuthenticated || !authValidation.user) {
      return new Response(
        JSON.stringify({
          error: authValidation.error || 'Autenticación requerida. Debes iniciar sesión para realizar cálculos.',
          success: false,
          authenticated: false
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const authenticatedUser = authValidation.user;
    console.log(`🔐 API Calculate - Usuario autenticado con guards: ${authenticatedUser}`);

    let filters: CalculateFilters;

    try {
      const body = await request.text();
      console.log('🔍 Body recibido:', body);

      if (!body || body.trim() === '') {
        throw new Error('Body vacío');
      }

      filters = JSON.parse(body);
    } catch (jsonError) {
      console.error('❌ Error parseando JSON:', jsonError);
      return new Response(
        JSON.stringify({
          error: 'JSON inválido en el body de la petición',
          success: false,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🔄 API Calculate - Filtros recibidos:', filters);

    // Validar filtros
    if (!filters || !filters.applied) {
      return new Response(
        JSON.stringify({
          error: 'Filtros no válidos o no aplicados',
          success: false,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // ✅ USAR USUARIO AUTENTICADO EN LUGAR DE VALOR HARDCODEADO
    const userAccount = authenticatedUser;
    const defaultInterestPercentage = 10;

    let curationStats: any = null;
    let updatedFilters = { ...filters };

    // OPTIMIZACIÓN: Solo obtener estadísticas de curación si no tenemos curationValue
    if (!updatedFilters.curationValue || updatedFilters.curationValue === 0) {
      console.log('🔄 curationValue no definido, obteniendo estadísticas de curación...');

      // 1. Obtener estadísticas de curación para el usuario autenticado
      curationStats = await getCurationStatsForUI(userAccount);

      // 2. Actualizar curationValue según el período
      switch (updatedFilters.curationPeriod) {
        case '24h':
          updatedFilters.curationValue = curationStats.curation24h;
          break;
        case '7d':
          updatedFilters.curationValue = curationStats.curation7d;
          break;
        case '30d':
        default:
          updatedFilters.curationValue = curationStats.curation30d;
          break;
      }

      console.log(`✅ curationValue actualizado desde API: ${updatedFilters.curationValue} HP`);
    } else {
      console.log(
        `✅ curationValue ya disponible desde cliente: ${updatedFilters.curationValue} HP`
      );

      // Crear un objeto básico de estadísticas para la respuesta
      curationStats = {
        curation24h: 0,
        curation7d: 0,
        curation30d: 0,
        lastUpdate: new Date(),
      };

      // Asignar el valor conocido al período correspondiente
      switch (updatedFilters.curationPeriod) {
        case '24h':
          curationStats.curation24h = updatedFilters.curationValue;
          break;
        case '7d':
          curationStats.curation7d = updatedFilters.curationValue;
          break;
        case '30d':
        default:
          curationStats.curation30d = updatedFilters.curationValue;
          break;
      }
    }

    // 3. Calcular distribución para el usuario autenticado
    const calculationResult = await calculateCurationDistribution(
      userAccount,
      updatedFilters,
      updatedFilters.curationValue || 0,
      defaultInterestPercentage
    );

    // 4. Obtener configuración de pagos personalizada para el usuario
    const userPaymentConfig = await getPaymentConfigForAccount(userAccount);
    
    // 5. Calcular pagos dinámicos con configuración personalizada
    const dynamicPaymentConfig = await calculateDynamicPayments(
      calculationResult,
      updatedFilters,
      userPaymentConfig
    );

    // 6. Preparar respuesta
    const response = {
      success: true,
      user: userAccount, // Incluir usuario en la respuesta
      userPaymentConfig, // Incluir configuración personalizada del usuario
      filters: updatedFilters,
      curationStats,
      calculationResult,
      dynamicPaymentConfig,
      defaultInterestPercentage,
    };

    console.log(`✅ API Calculate - Cálculo completado para ${userAccount}:`, {
      delegators: calculationResult.delegators.length,
      totalHP: calculationResult.totalHP,
      totalHive: calculationResult.totalHiveToDistribute,
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ API Calculate - Error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
