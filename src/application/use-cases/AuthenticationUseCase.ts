import type { HiveRepository, AuthenticationPort } from '../../domain/ports/HiveRepository';
import { HiveAccountService } from '../../domain/services/HiveAccountService';

/**
 * Caso de uso: Autenticación de usuario
 * Orquesta la validación, firma y guardado de sesión
 */
export class AuthenticationUseCase {
  constructor(
    private readonly hiveRepository: HiveRepository,
    private readonly authPort: AuthenticationPort
  ) {}

  /**
   * Proceso completo de login
   */
  async login(username: string): Promise<void> {
    // 1. Validar y normalizar username
    const normalizedUsername = HiveAccountService.normalizeUsername(username);

    if (!HiveAccountService.isValidUsername(normalizedUsername)) {
      throw new Error('El nombre de usuario no es válido');
    }

    // 2. Verificar que la cuenta existe en Hive
    const account = await this.hiveRepository.getAccount(normalizedUsername);
    if (!account) {
      throw new Error('La cuenta no existe en Hive');
    }

    // 3. Solicitar firma de mensaje con Keychain (esto abrirá el popup)
    const challengeMessage = `Aliento Pay Login - ${Date.now()}`;
    try {
      await this.authPort.signMessage(normalizedUsername, challengeMessage);
    } catch (error) {
      throw new Error('Error al firmar con Keychain: ' + (error as Error).message);
    }

    // 4. Guardar sesión después de la firma exitosa
    this.authPort.saveSession(normalizedUsername);
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.authPort.clearSession();
  }

  /**
   * Obtener usuario autenticado
   */
  getCurrentUser(): string | null {
    return this.authPort.getCurrentUser();
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}
