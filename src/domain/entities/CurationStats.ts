/**
 * 🎯 DOMINIO - Entidad CurationStats
 *
 * Representa las estadísticas de recompensas de curación de una cuenta
 * en la blockchain de Hive, tanto para 24 horas como para 7 días.
 */

export interface CurationStats {
  readonly '24hr': number; // Recompensas de curación en las últimas 24 horas (HP)
  readonly '7d': number; // Recompensas de curación en los últimos 7 días (HP)
}

export interface CurationReward {
  readonly operationId: string; // ID único de la operación
  readonly timestampMs: number; // Timestamp en milisegundos
  readonly rewardVests: number; // Recompensa en VESTS (sin convertir)
  readonly rewardHP: number; // Recompensa convertida a HP
  readonly blockNum: number; // Número de bloque
  readonly trxId: string; // ID de transacción
  readonly curator: string; // Usuario que hizo la curación
  readonly author: string; // Autor del post curado
  readonly permlink: string; // Permlink del post curado
  readonly mustBeClaimed: boolean; // Si debe ser reclamada manualmente
}

/**
 * Clase de valor para representar un período de tiempo
 * Inmutable y con validaciones de negocio
 */
export class TimePeriod {
  private constructor(
    public readonly startDate: Date,
    public readonly endDate: Date
  ) {}

  static create24Hours(): TimePeriod {
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return new TimePeriod(start, now);
  }

  static create7Days(): TimePeriod {
    const now = new Date();
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return new TimePeriod(start, now);
  }

  static createCustom(startDate: Date, endDate: Date): TimePeriod {
    if (startDate >= endDate) {
      throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    const maxDays = 30; // Límite máximo de 30 días
    const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays > maxDays) {
      throw new Error(`El período no puede exceder ${maxDays} días`);
    }

    return new TimePeriod(startDate, endDate);
  }

  isWithinPeriod(timestamp: number): boolean {
    return timestamp >= this.startDate.getTime() && timestamp <= this.endDate.getTime();
  }

  getDurationInMs(): number {
    return this.endDate.getTime() - this.startDate.getTime();
  }
}

/**
 * Objeto de valor para validar nombres de cuenta de Hive
 */
export class HiveAccountName {
  private constructor(public readonly value: string) {}

  static create(accountName: string): HiveAccountName {
    if (!accountName || typeof accountName !== 'string') {
      throw new Error('El nombre de cuenta es requerido');
    }

    const cleaned = accountName.toLowerCase().trim();

    // Validaciones básicas de nombres de cuenta de Hive
    if (cleaned.length < 3 || cleaned.length > 16) {
      throw new Error('El nombre de cuenta debe tener entre 3 y 16 caracteres');
    }

    if (!/^[a-z0-9.-]+$/.test(cleaned)) {
      throw new Error(
        'El nombre de cuenta solo puede contener letras minúsculas, números, puntos y guiones'
      );
    }

    if (
      cleaned.startsWith('.') ||
      cleaned.endsWith('.') ||
      cleaned.startsWith('-') ||
      cleaned.endsWith('-')
    ) {
      throw new Error('El nombre de cuenta no puede empezar o terminar con punto o guión');
    }

    return new HiveAccountName(cleaned);
  }

  equals(other: HiveAccountName): boolean {
    return this.value === other.value;
  }
}
