import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { filters } = body;

    // Validar que los filtros tienen la estructura correcta
    if (!filters || typeof filters !== 'object') {
      return new Response(
        JSON.stringify({
          error: 'Filtros inválidos',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Devolver los filtros validados
    return new Response(
      JSON.stringify({
        success: true,
        filters: filters,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Error procesando solicitud',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
