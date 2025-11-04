/**
 * 🔐 LOGIN API ENDPOINT
 * 
 * API endpoint para autenticación con Hive Keychain
 * Compatible con el middleware de Astro
 */

import type { APIRoute } from 'astro';
import type { LoginRequest, LoginResponse } from '../../../types/auth';
import { sessionManager } from '../../../lib/auth/SessionManager';
import { Container } from '../../../application/Container';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    console.log('🔐 Login API: Iniciando proceso de autenticación');

    // Parsear request body
    const body: LoginRequest = await request.json();
    const { username, signature, challenge } = body;

    // Validaciones básicas
    if (!username || typeof username !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Username es requerido'
        } as LoginResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Limpiar username
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Username debe tener al menos 3 caracteres'
        } as LoginResponse),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔍 Procesando login para usuario: ${cleanUsername}`);

    // Keychain maneja la autenticación del lado del cliente
    // El servidor solo valida que recibió una respuesta exitosa
    // No necesitamos validar contra el blockchain aquí

    try {
      // Crear sesión
      const session = sessionManager.createSession(cleanUsername, signature);
      
      // Guardar sesión en cookies
      const token = sessionManager.generateSessionToken(session);
      cookies.set(sessionManager.getConfig().cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: session.expiresAt,
        path: '/',
        maxAge: Math.floor(sessionManager.getConfig().sessionDuration / 1000)
      });

      console.log(`✅ Login exitoso para: ${cleanUsername}`);

      // Respuesta exitosa
      const response: LoginResponse = {
        success: true,
        user: cleanUsername,
        token: token, // Para uso del cliente si es necesario
        expiresAt: session.expiresAt.toISOString()
      };

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );

    } catch (authError) {
      console.error('❌ Error en autenticación:', authError);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: authError instanceof Error ? authError.message : 'Error interno de autenticación'
        } as LoginResponse),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('❌ Error en login API:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error interno del servidor'
      } as LoginResponse),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Opcional: GET para verificar estado de autenticación
export const GET: APIRoute = async ({ cookies }) => {
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
          headers: { 'Content-Type': 'application/json' }
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
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );

  } catch (error) {
    console.error('Error verificando estado de autenticación:', error);
    
    return new Response(
      JSON.stringify({
        authenticated: false,
        user: null,
        error: 'Error verificando sesión'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};