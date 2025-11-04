// Contenedor de dependencias - Inversión de control simple
import { HiveHttpRepository } from '../infrastructure/http/HiveHttpRepository';
import { HiveKeychainAuth } from '../infrastructure/keychain/HiveKeychainAuth';
import { AuthenticationUseCase } from './use-cases/AuthenticationUseCase';
import { DelegationsUseCase } from './use-cases/DelegationsUseCase';

/**
 * Contenedor de dependencias
 * Configura las instancias de todos los servicios
 */
export class Container {
  private static instance: Container;

  // Adaptadores de infraestructura
  private readonly hiveRepository = new HiveHttpRepository();
  private readonly authPort = new HiveKeychainAuth();

  // Casos de uso
  private readonly authenticationUseCase = new AuthenticationUseCase(
    this.hiveRepository,
    this.authPort
  );

  private readonly delegationsUseCase = new DelegationsUseCase(this.hiveRepository);

  private constructor() {}

  /**
   * Singleton: Una sola instancia del contenedor
   */
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Obtiene el caso de uso de autenticación
   */
  getAuthenticationUseCase(): AuthenticationUseCase {
    return this.authenticationUseCase;
  }

  /**
   * Obtiene el caso de uso de delegaciones
   */
  getDelegationsUseCase(): DelegationsUseCase {
    return this.delegationsUseCase;
  }

  /**
   * Obtiene el repositorio de Hive (para casos especiales)
   */
  getHiveRepository(): HiveHttpRepository {
    return this.hiveRepository;
  }

  /**
   * Obtiene el puerto de autenticación (para casos especiales)
   */
  getAuthPort(): HiveKeychainAuth {
    return this.authPort;
  }
}

// Instancia global exportada para usar en toda la aplicación
export const container = Container.getInstance();
