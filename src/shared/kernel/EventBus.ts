/**
 * 🚌 EVENT BUS SYSTEM
 *
 * Domain events system for communication between bounded contexts.
 * Follows the Observer pattern with type safety.
 */

export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredOn: Date;
  readonly eventVersion: number;
  readonly payload: Record<string, any>;
}

export interface EventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): void | Promise<void>;
  canHandle(event: DomainEvent): boolean;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
  subscribe<T extends DomainEvent>(handler: EventHandler<T>): void;
  unsubscribe<T extends DomainEvent>(handler: EventHandler<T>): void;
}

/**
 * In-memory event bus implementation
 */
export class InMemoryEventBus implements EventBus {
  private readonly handlers: EventHandler[] = [];

  async publish(event: DomainEvent): Promise<void> {
    const applicableHandlers = this.handlers.filter(handler => handler.canHandle(event));

    await Promise.all(applicableHandlers.map(handler => handler.handle(event)));
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)));
  }

  subscribe<T extends DomainEvent>(handler: EventHandler<T>): void {
    this.handlers.push(handler);
  }

  unsubscribe<T extends DomainEvent>(handler: EventHandler<T>): void {
    const index = this.handlers.indexOf(handler);
    if (index !== -1) {
      this.handlers.splice(index, 1);
    }
  }

  /**
   * Get number of registered handlers
   */
  getHandlerCount(): number {
    return this.handlers.length;
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clearHandlers(): void {
    this.handlers.length = 0;
  }
}

/**
 * Base domain event class
 */
export abstract class BaseDomainEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventVersion: number = 1;

  constructor(
    readonly eventType: string,
    readonly aggregateId: string,
    readonly aggregateType: string,
    readonly payload: Record<string, any>
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
  }
}

/**
 * Abstract event handler base class
 */
export abstract class BaseEventHandler<T extends DomainEvent = DomainEvent>
  implements EventHandler<T>
{
  abstract handle(event: T): void | Promise<void>;

  canHandle(event: DomainEvent): boolean {
    return this.getEventTypes().includes(event.eventType);
  }

  protected abstract getEventTypes(): string[];
}

/**
 * Typed event handler for specific event types
 */
export abstract class TypedEventHandler<T extends DomainEvent> extends BaseEventHandler<T> {
  constructor(private readonly eventType: string) {
    super();
  }

  protected getEventTypes(): string[] {
    return [this.eventType];
  }
}
