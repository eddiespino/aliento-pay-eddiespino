import './SessionManager_D_9xdLr4.mjs';

function requireAuthentication(options = {}) {
  const {
    redirectTo = "/",
    allowUnauthenticated = false,
    requireSpecificUser,
    showError = true
  } = options;
  try {
    if (typeof window === "undefined") {
      return {
        isAuthenticated: false,
        user: null,
        error: "Guard ejecutado en server-side, usar server guard"
      };
    }
    const currentUser = localStorage.getItem("authenticated_user");
    if (!currentUser) {
      if (allowUnauthenticated) {
        return { isAuthenticated: false, user: null };
      }
      return {
        isAuthenticated: false,
        user: null,
        error: "Usuario no autenticado",
        redirectTo
      };
    }
    if (requireSpecificUser && currentUser !== requireSpecificUser) {
      return {
        isAuthenticated: false,
        user: currentUser,
        error: `Acceso denegado. Se requiere usuario: ${requireSpecificUser}`,
        redirectTo
      };
    }
    return {
      isAuthenticated: true,
      user: currentUser
    };
  } catch (error) {
    console.error("❌ Error en guard de autenticación:", error);
    return {
      isAuthenticated: false,
      user: null,
      error: "Error validando autenticación",
      redirectTo
    };
  }
}
async function withAuthentication(fn, options = {}) {
  const validation = requireAuthentication(options);
  if (!validation.isAuthenticated) {
    if (validation.error && options.showError !== false) {
      console.error("🔒 Acceso denegado:", validation.error);
    }
    if (validation.redirectTo && typeof window !== "undefined") {
      console.log(`🔄 Redirigiendo a: ${validation.redirectTo}`);
      window.location.href = validation.redirectTo;
    }
    return null;
  }
  try {
    return await fn(validation.user);
  } catch (error) {
    console.error("❌ Error ejecutando función autenticada:", error);
    throw error;
  }
}
function canAccessAccountData(targetAccount) {
  const validation = requireAuthentication();
  if (!validation.isAuthenticated) {
    return validation;
  }
  if (validation.user !== targetAccount) {
    return {
      isAuthenticated: false,
      user: validation.user,
      error: `No tienes permisos para acceder a datos de @${targetAccount}`,
      redirectTo: "/dashboard"
    };
  }
  return validation;
}

async function protectedGetCurationStats(account) {
  return withAuthentication(async (authenticatedUser) => {
    const targetAccount = account || authenticatedUser;
    console.log(`🔒 Obteniendo estadísticas de curación para: ${targetAccount}`);
    const accessValidation = canAccessAccountData(targetAccount);
    if (!accessValidation.isAuthenticated) {
      throw new Error(accessValidation.error || "Sin permisos para acceder a estos datos");
    }
    const { curationStats } = await import('./get-delegations_F_I3zebc.mjs');
    return await curationStats(targetAccount);
  });
}
async function validateApiAuthentication(request) {
  try {
    const authenticatedUser = request.headers.get("x-authenticated-user");
    console.log(`🔧 validateApiAuthentication: Header x-authenticated-user: ${authenticatedUser}`);
    console.log(`🔧 validateApiAuthentication: Todos los headers:`, Array.from(request.headers.entries()));
    if (!authenticatedUser) {
      return {
        isAuthenticated: false,
        user: null,
        error: "Usuario no autenticado"
      };
    }
    return {
      isAuthenticated: true,
      user: authenticatedUser
    };
  } catch (error) {
    console.error("❌ Error validando autenticación en API:", error);
    return {
      isAuthenticated: false,
      user: null,
      error: "Error interno de autenticación"
    };
  }
}

export { protectedGetCurationStats as p, validateApiAuthentication as v };
