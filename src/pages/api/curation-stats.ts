import type { APIRoute } from 'astro';
import { getCurationStatsForUI } from '../../lib/payment-calculator';
import { getAuthenticatedUser } from '../../middleware';

// Configurar como server-rendered
export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 🔐 OBTENER USUARIO AUTENTICADO DEL MIDDLEWARE
    const authenticatedUser = getAuthenticatedUser({ request, locals } as any);
    
    if (!authenticatedUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Autenticación requerida. Debes iniciar sesión para obtener estadísticas de curación.',
          authenticated: false,
          curation24h: 0,
          curation7d: 0,
          curation30d: 0,
          lastUpdate: new Date().toISOString(),
          timestamp: Date.now(),
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`🔐 API CurationStats - Usuario autenticado: ${authenticatedUser}`);

    // ✅ OBTENER ESTADÍSTICAS DIRECTAMENTE (ya autenticado por middleware)
    const { curationStats } = await import('../../lib/get-delegations');
    const curationStatsResult = await curationStats(authenticatedUser);
    
    if (!curationStatsResult) {
      throw new Error('No se pudieron obtener las estadísticas de curación');
    }

    // Convertir a formato de UI
    const curationStatsForUI = {
      curation24h: curationStatsResult.total24Hr,
      curation7d: curationStatsResult.total7D,
      curation30d: curationStatsResult.total30D,
      lastUpdate: new Date()
    };

    const response = {
      success: true,
      user: authenticatedUser, // Incluir usuario en la respuesta
      curation24h: curationStatsForUI.curation24h,
      curation7d: curationStatsForUI.curation7d,
      curation30d: curationStatsForUI.curation30d,
      lastUpdate: curationStatsForUI.lastUpdate,
      timestamp: Date.now(),
      error: false,
    };

    console.log(`✅ API CurationStats - Datos obtenidos exitosamente para ${authenticatedUser}`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('❌ API CurationStats - Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        curation24h: 0,
        curation7d: 0,
        curation30d: 0,
        lastUpdate: new Date().toISOString(),
        timestamp: Date.now(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
