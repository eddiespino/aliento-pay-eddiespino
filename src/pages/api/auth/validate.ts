/**
 * ✅ VALIDATE SESSION API ENDPOINT
 * 
 * API endpoint para validar sesiones y renovarlas si es necesario
 */

import type { APIRoute } from 'astro';
import { sessionManager } from '../../../lib/auth/SessionManager';

export const GET: APIRoute = async ({ cookies, locals }) => {
  try {
    console.log('✅ Validate API: Verificando sesión');

    const sessionToken = cookies.get(sessionManager.getConfig().cookieName)?.value;
    
    if (!sessionToken) {
      return new Response(
        JSON.stringify({
          valid: false,
          authenticated: false,
          user: null,
          error: 'No hay token de sesión'
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );
    }

    const validation = sessionManager.validateSession(sessionToken);
    
    if (!validation.isValid) {
      // Limpiar cookie inválida
      cookies.delete(sessionManager.getConfig().cookieName, {
        path: '/'
      });

      return new Response(
        JSON.stringify({
          valid: false,
          authenticated: false,
          user: null,
          error: validation.error || 'Sesión inválida'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Sesión válida
    const session = sessionManager.parseSessionToken(sessionToken);
    let renewedToken = null;

    // Verificar si la sesión está próxima a expirar y renovarla
    if (session && sessionManager.isSessionNearExpiry(session)) {
      console.log(`🔄 Renovando sesión para usuario: ${session.username}`);
      
      const renewedSession = sessionManager.renewSession(session);
      renewedToken = sessionManager.generateSessionToken(renewedSession);
      
      // Actualizar cookie
      cookies.set(sessionManager.getConfig().cookieName, renewedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: renewedSession.expiresAt,
        path: '/',
        maxAge: Math.floor(sessionManager.getConfig().sessionDuration / 1000)
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
        renewedToken: renewedToken
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
    console.error('❌ Error en validate API:', error);

    return new Response(
      JSON.stringify({
        valid: false,
        authenticated: false,
        user: null,
        error: 'Error interno validando sesión'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// POST para validación con datos adicionales
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { token } = body;

    // Validar token específico (útil para validación desde el cliente)
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
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Si no hay token en el body, usar el mismo flujo que GET
    return await this.GET({ cookies } as any);

  } catch (error) {
    console.error('❌ Error en validate POST:', error);

    return new Response(
      JSON.stringify({
        valid: false,
        authenticated: false,
        user: null,
        error: 'Error validando sesión'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};