/**
 * 🔄 LOADING MANAGER
 * 
 * Utility para manejar estados de loading mejorados con skeletons,
 * progress tracking y mejor UX durante las operaciones asíncronas.
 */

export interface LoadingStep {
  id: string;
  message: string;
  duration?: number; // Expected duration in ms (for progress estimation)
}

export interface LoadingManagerOptions {
  showSkeleton?: boolean;
  trackProgress?: boolean;
  minDuration?: number; // Minimum loading time to prevent flashing
  maxDuration?: number; // Maximum time before showing warning
}

export class LoadingManager {
  private startTime: number = 0;
  private currentStep: number = 0;
  private steps: LoadingStep[] = [];
  private options: LoadingManagerOptions;
  private callbacks: {
    onStepChange?: (step: LoadingStep, progress: number) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
    onWarning?: (message: string) => void;
  } = {};

  constructor(options: LoadingManagerOptions = {}) {
    this.options = {
      showSkeleton: true,
      trackProgress: true,
      minDuration: 500, // 500ms minimum to prevent flashing
      maxDuration: 10000, // 10s before showing warning
      ...options
    };
  }

  /**
   * Set loading steps for progress tracking
   */
  setSteps(steps: LoadingStep[]): LoadingManager {
    this.steps = steps;
    this.currentStep = 0;
    return this;
  }

  /**
   * Set callbacks for loading events
   */
  onStepChange(callback: (step: LoadingStep, progress: number) => void): LoadingManager {
    this.callbacks.onStepChange = callback;
    return this;
  }

  onComplete(callback: () => void): LoadingManager {
    this.callbacks.onComplete = callback;
    return this;
  }

  onError(callback: (error: Error) => void): LoadingManager {
    this.callbacks.onError = callback;
    return this;
  }

  onWarning(callback: (message: string) => void): LoadingManager {
    this.callbacks.onWarning = callback;
    return this;
  }

  /**
   * Start loading process
   */
  async start(): Promise<void> {
    this.startTime = Date.now();
    this.currentStep = 0;

    // Setup warning timer for long operations
    const warningTimer = setTimeout(() => {
      if (this.callbacks.onWarning) {
        this.callbacks.onWarning('La operación está tardando más de lo esperado...');
      }
    }, this.options.maxDuration);

    try {
      // Execute steps if provided
      if (this.steps.length > 0) {
        for (let i = 0; i < this.steps.length; i++) {
          this.currentStep = i;
          const step = this.steps[i];
          const progress = ((i + 1) / this.steps.length) * 100;

          if (this.callbacks.onStepChange) {
            this.callbacks.onStepChange(step, progress);
          }

          // Simulate step duration if provided
          if (step.duration) {
            await this.delay(step.duration);
          }
        }
      }

      clearTimeout(warningTimer);
    } catch (error) {
      clearTimeout(warningTimer);
      if (this.callbacks.onError && error instanceof Error) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * Complete loading process
   */
  async complete(): Promise<void> {
    const elapsed = Date.now() - this.startTime;
    
    // Ensure minimum duration to prevent flashing
    if (elapsed < this.options.minDuration!) {
      await this.delay(this.options.minDuration! - elapsed);
    }

    if (this.callbacks.onComplete) {
      this.callbacks.onComplete();
    }
  }

  /**
   * Execute an async operation with loading management
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    await this.start();
    
    try {
      const result = await operation();
      await this.complete();
      return result;
    } catch (error) {
      if (this.callbacks.onError && error instanceof Error) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * Get current progress percentage
   */
  getProgress(): number {
    if (this.steps.length === 0) return 0;
    return ((this.currentStep + 1) / this.steps.length) * 100;
  }

  /**
   * Get current step
   */
  getCurrentStep(): LoadingStep | null {
    return this.steps[this.currentStep] || null;
  }

  /**
   * Private utility to create delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create a loading manager for common scenarios
 */
export function createLoadingManager(options?: LoadingManagerOptions): LoadingManager {
  return new LoadingManager(options);
}

/**
 * Predefined loading steps for common operations
 */
export const LoadingSteps = {
  AUTH: [
    { id: 'keychain', message: 'Verificando Hive Keychain', duration: 500 },
    { id: 'account', message: 'Verificando cuenta en Hive', duration: 1000 },
    { id: 'signature', message: 'Esperando firma digital', duration: 2000 },
    { id: 'session', message: 'Creando sesión segura', duration: 500 }
  ],
  
  DELEGATIONS: [
    { id: 'fetch', message: 'Obteniendo delegaciones', duration: 1500 },
    { id: 'process', message: 'Procesando datos', duration: 800 },
    { id: 'calculate', message: 'Calculando estadísticas', duration: 600 },
    { id: 'render', message: 'Preparando visualización', duration: 400 }
  ],

  PAYMENTS: [
    { id: 'validate', message: 'Validando parámetros', duration: 300 },
    { id: 'calculate', message: 'Calculando distribución', duration: 1200 },
    { id: 'prepare', message: 'Preparando transacciones', duration: 800 },
    { id: 'broadcast', message: 'Enviando a la blockchain', duration: 2000 }
  ]
};

/**
 * DOM utilities for managing loading states
 */
export class LoadingDOM {
  private element: HTMLElement;

  constructor(element: HTMLElement | string) {
    this.element = typeof element === 'string' 
      ? document.getElementById(element)! 
      : element;
  }

  /**
   * Show skeleton loading state
   */
  showSkeleton(): void {
    this.element.innerHTML = this.createSkeletonHTML();
    this.element.classList.remove('hidden');
  }

  /**
   * Show step-by-step loading
   */
  showSteps(steps: LoadingStep[]): void {
    this.element.innerHTML = this.createStepsHTML(steps);
    this.element.classList.remove('hidden');
  }

  /**
   * Update current step
   */
  updateStep(stepIndex: number, progress: number): void {
    const stepElements = this.element.querySelectorAll('.loading-step');
    const progressBar = this.element.querySelector('.progress-bar') as HTMLElement;

    stepElements.forEach((el, index) => {
      if (index < stepIndex) {
        el.classList.add('completed');
        el.classList.remove('active');
      } else if (index === stepIndex) {
        el.classList.add('active');
        el.classList.remove('completed');
      } else {
        el.classList.remove('active', 'completed');
      }
    });

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }

  /**
   * Hide loading state
   */
  hide(): void {
    this.element.classList.add('hidden');
  }

  /**
   * Create skeleton HTML structure
   */
  private createSkeletonHTML(): string {
    return `
      <div class="animate-pulse space-y-4">
        <div class="h-4 bg-gray-600 rounded w-3/4"></div>
        <div class="h-4 bg-gray-600 rounded w-1/2"></div>
        <div class="h-4 bg-gray-600 rounded w-5/6"></div>
        <div class="h-4 bg-gray-600 rounded w-2/3"></div>
      </div>
    `;
  }

  /**
   * Create steps HTML structure
   */
  private createStepsHTML(steps: LoadingStep[]): string {
    return `
      <div class="loading-steps space-y-3">
        <div class="w-full bg-gray-700 rounded-full h-2 mb-4">
          <div class="progress-bar bg-sky-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
        </div>
        ${steps.map((step, index) => `
          <div class="loading-step flex items-center gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700" data-step="${step.id}">
            <div class="step-icon w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white">
              ${index + 1}
            </div>
            <div class="flex-1">
              <p class="text-sm text-gray-300">${step.message}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}
