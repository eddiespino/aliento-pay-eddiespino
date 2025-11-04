/**
 * 🔓 LOGOUT API ENDPOINT
 * 
 * API endpoint para cerrar sesión y limpiar cookies
 */

import type { APIRoute } from 'astro';
import { sessionManager } from '../../../lib/auth/SessionManager';

export const POST: APIRoute = async ({ cookies, locals }) => {
  try {
    console.log('🔓 Logout API: Cerrando sesión');

    // Obtener usuario actual antes de cerrar sesión
    const currentUser = locals.user;

    // Limpiar cookie de sesión
    cookies.delete(sessionManager.getConfig().cookieName, {
      path: '/'
    });

    // Limpiar locals para el resto del request
    locals.user = null;
    locals.isAuthenticated = false;

    console.log(`✅ Sesión cerrada para usuario: ${currentUser || 'desconocido'}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sesión cerrada exitosamente',
        user: currentUser
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );

  } catch (error) {
    console.error('❌ Error en logout API:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error cerrando sesión'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// GET también puede usarse para logout (menos común pero útil para links)
export const GET: APIRoute = async ({ cookies, locals, redirect }) => {
  try {
    const currentUser = locals.user;

    // Limpiar cookie de sesión
    cookies.delete(sessionManager.getConfig().cookieName, {
      path: '/'
    });

    console.log(`✅ Logout via GET para usuario: ${currentUser || 'desconocido'}`);

    // Redirigir a la página principal después del logout
    return redirect('/?logged_out=true');

  } catch (error) {
    console.error('❌ Error en logout GET:', error);
    return redirect('/?error=logout_failed');
  }
};