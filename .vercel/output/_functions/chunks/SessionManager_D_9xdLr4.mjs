class SessionManager {
  static {
    this.DEFAULT_CONFIG = {
      sessionDuration: 24 * 60 * 60 * 1e3,
      // 24 horas
      cookieName: "user_session",
      requireHTTPS: process.env.NODE_ENV === "production",
      sameSite: "lax"
    };
  }
  constructor(config = {}) {
    this.config = { ...SessionManager.DEFAULT_CONFIG, ...config };
  }
  /**
   * Crea una nueva sesión para el usuario
   */
  createSession(username, signature) {
    const now = /* @__PURE__ */ new Date();
    const expiresAt = new Date(now.getTime() + this.config.sessionDuration);
    return {
      username,
      loginTime: now,
      expiresAt,
      signature
    };
  }
  /**
   * Genera un token de sesión seguro
   */
  generateSessionToken(session) {
    const timestamp = session.loginTime.getTime();
    const expires = session.expiresAt.getTime();
    const signatureHash = session.signature ? this.hashSignature(session.signature) : "none";
    return `${session.username}:${timestamp}:${expires}:${signatureHash}`;
  }
  /**
   * Parsea un token de sesión
   */
  parseSessionToken(token) {
    try {
      const [username, timestampStr, expiresStr, signatureHash] = token.split(":");
      if (!username || !timestampStr || !expiresStr) {
        return null;
      }
      const loginTime = new Date(parseInt(timestampStr));
      const expiresAt = new Date(parseInt(expiresStr));
      if (expiresAt.getTime() < Date.now()) {
        return null;
      }
      return {
        username,
        loginTime,
        expiresAt,
        signature: signatureHash !== "none" ? signatureHash : void 0
      };
    } catch (error) {
      console.error("Error parsing session token:", error);
      return null;
    }
  }
  /**
   * Valida una sesión
   */
  validateSession(token) {
    const session = this.parseSessionToken(token);
    if (!session) {
      return {
        isValid: false,
        error: "Token de sesión inválido o expirado"
      };
    }
    if (session.expiresAt.getTime() < Date.now()) {
      return {
        isValid: false,
        error: "Sesión expirada"
      };
    }
    return {
      isValid: true,
      user: session.username,
      expiresAt: session.expiresAt
    };
  }
  /**
   * Guarda la sesión en cookies (server-side)
   */
  saveSessionToContext(context, session) {
    const token = this.generateSessionToken(session);
    context.cookies.set(this.config.cookieName, token, {
      httpOnly: true,
      secure: this.config.requireHTTPS,
      sameSite: this.config.sameSite,
      expires: session.expiresAt,
      path: "/",
      // Prevenir acceso desde JavaScript para mayor seguridad
      maxAge: Math.floor(this.config.sessionDuration / 1e3)
    });
    console.log(`✅ Sesión guardada para usuario: ${session.username}`);
  }
  /**
   * Obtiene la sesión desde cookies (server-side)
   */
  getSessionFromContext(context) {
    const token = context.cookies.get(this.config.cookieName)?.value;
    if (!token) {
      return null;
    }
    return this.parseSessionToken(token);
  }
  /**
   * Elimina la sesión (logout)
   */
  clearSessionFromContext(context) {
    context.cookies.delete(this.config.cookieName, {
      path: "/"
    });
    console.log("🔓 Sesión eliminada");
  }
  /**
   * Renueva una sesión existente
   */
  renewSession(session) {
    const now = /* @__PURE__ */ new Date();
    const newExpiresAt = new Date(now.getTime() + this.config.sessionDuration);
    return {
      ...session,
      expiresAt: newExpiresAt
    };
  }
  /**
   * Verifica si una sesión está próxima a expirar (última hora)
   */
  isSessionNearExpiry(session) {
    const oneHour = 60 * 60 * 1e3;
    const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
    return timeUntilExpiry < oneHour;
  }
  /**
   * Hash simple para la firma (en producción usar crypto más robusto)
   */
  hashSignature(signature) {
    let hash = 0;
    for (let i = 0; i < signature.length; i++) {
      const char = signature.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  /**
   * Obtiene configuración actual
   */
  getConfig() {
    return { ...this.config };
  }
}
const sessionManager = new SessionManager();

export { sessionManager as s };
