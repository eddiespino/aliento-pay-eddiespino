/**
 * 💸 PAYMENT ENTITY
 *
 * Core domain entity representing a payment.
 * Aggregate root with business rules and behavior.
 */

import { PaymentId } from '../value-objects/PaymentId';
import { PaymentAmount, Currency } from '../value-objects/PaymentAmount';
import { PaymentMemo } from '../value-objects/PaymentMemo';
import { PaymentRecipient } from '../value-objects/PaymentRecipient';
import { ValidUsername } from '../../../authentication/domain/value-objects/ValidUsername';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentType {
  SINGLE_TRANSFER = 'single_transfer',
  MULTIPLE_TRANSFERS = 'multiple_transfers',
  CURATION_REWARD = 'curation_reward',
  DELEGATION_REWARD = 'delegation_reward',
}

export class Payment {
  private status: PaymentStatus;
  private processedAt?: Date;
  private transactionId?: string;
  private errorMessage?: string;

  private constructor(
    private readonly id: PaymentId,
    private readonly from: ValidUsername,
    private readonly to: PaymentRecipient,
    private readonly amount: PaymentAmount,
    private readonly memo: PaymentMemo,
    private readonly type: PaymentType,
    private readonly createdAt: Date,
    status: PaymentStatus = PaymentStatus.PENDING
  ) {
    this.status = status;
  }

  static create(params: CreatePaymentParams): Payment {
    return new Payment(
      PaymentId.generate(),
      params.from,
      PaymentRecipient.create(params.to),
      PaymentAmount.create(params.amount, params.currency),
      params.memo ? PaymentMemo.create(params.memo) : PaymentMemo.empty(),
      params.type || PaymentType.SINGLE_TRANSFER,
      new Date()
    );
  }

  static createCurationReward(params: CreateCurationRewardParams): Payment {
    const memo = PaymentMemo.createCurationMemo(params.period, params.percentage);

    return new Payment(
      PaymentId.generate(),
      params.from,
      PaymentRecipient.create(params.to),
      PaymentAmount.createHive(params.amount),
      memo,
      PaymentType.CURATION_REWARD,
      new Date()
    );
  }

  static createDelegationReward(params: CreateDelegationRewardParams): Payment {
    const memo = PaymentMemo.createDelegationMemo(params.hpDelegated);

    return new Payment(
      PaymentId.generate(),
      params.from,
      PaymentRecipient.create(params.to),
      PaymentAmount.createHive(params.amount),
      memo,
      PaymentType.DELEGATION_REWARD,
      new Date()
    );
  }

  static reconstitute(params: ReconstitutePaymentParams): Payment {
    const payment = new Payment(
      PaymentId.create(params.id),
      ValidUsername.create(params.from),
      PaymentRecipient.create(params.to),
      PaymentAmount.create(params.amount, params.currency),
      PaymentMemo.create(params.memo),
      params.type,
      params.createdAt,
      params.status
    );

    if (params.processedAt) {
      payment.processedAt = params.processedAt;
    }
    if (params.transactionId) {
      payment.transactionId = params.transactionId;
    }
    if (params.errorMessage) {
      payment.errorMessage = params.errorMessage;
    }

    return payment;
  }

  // Getters
  getId(): PaymentId {
    return this.id;
  }

  getFrom(): ValidUsername {
    return this.from;
  }

  getTo(): PaymentRecipient {
    return this.to;
  }

  getAmount(): PaymentAmount {
    return this.amount;
  }

  getMemo(): PaymentMemo {
    return this.memo;
  }

  getType(): PaymentType {
    return this.type;
  }

  getStatus(): PaymentStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getProcessedAt(): Date | undefined {
    return this.processedAt;
  }

  getTransactionId(): string | undefined {
    return this.transactionId;
  }

  getErrorMessage(): string | undefined {
    return this.errorMessage;
  }

  // Business behavior
  startProcessing(): void {
    if (this.status !== PaymentStatus.PENDING) {
      throw new InvalidPaymentStatusTransitionError(this.status, PaymentStatus.PROCESSING);
    }

    this.status = PaymentStatus.PROCESSING;
  }

  markAsCompleted(transactionId: string): void {
    if (this.status !== PaymentStatus.PROCESSING) {
      throw new InvalidPaymentStatusTransitionError(this.status, PaymentStatus.COMPLETED);
    }

    this.status = PaymentStatus.COMPLETED;
    this.transactionId = transactionId;
    this.processedAt = new Date();
    this.errorMessage = undefined;
  }

  markAsFailed(errorMessage: string): void {
    if (this.status === PaymentStatus.COMPLETED) {
      throw new InvalidPaymentStatusTransitionError(this.status, PaymentStatus.FAILED);
    }

    this.status = PaymentStatus.FAILED;
    this.errorMessage = errorMessage;
    this.processedAt = new Date();
  }

  cancel(): void {
    if (this.status === PaymentStatus.COMPLETED || this.status === PaymentStatus.PROCESSING) {
      throw new InvalidPaymentStatusTransitionError(this.status, PaymentStatus.CANCELLED);
    }

    this.status = PaymentStatus.CANCELLED;
    this.processedAt = new Date();
  }

  retry(): void {
    if (this.status !== PaymentStatus.FAILED) {
      throw new InvalidPaymentStatusTransitionError(this.status, PaymentStatus.PENDING);
    }

    this.status = PaymentStatus.PENDING;
    this.errorMessage = undefined;
    this.processedAt = undefined;
    this.transactionId = undefined;
  }

  // Query methods
  isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  isProcessing(): boolean {
    return this.status === PaymentStatus.PROCESSING;
  }

  isCompleted(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  isCancelled(): boolean {
    return this.status === PaymentStatus.CANCELLED;
  }

  isFinalized(): boolean {
    return this.isCompleted() || this.isFailed() || this.isCancelled();
  }

  equals(other: Payment): boolean {
    return this.id.equals(other.id);
  }

  toString(): string {
    return `Payment(${this.id.getValue()}, ${this.amount.format()}, ${this.to.getValue()}, ${this.status})`;
  }

  toJSON(): PaymentSnapshot {
    return {
      id: this.id.getValue(),
      from: this.from.getValue(),
      to: this.to.getValue(),
      amount: this.amount.getAmount(),
      currency: this.amount.getCurrency(),
      memo: this.memo.getValue(),
      type: this.type,
      status: this.status,
      createdAt: this.createdAt.toISOString(),
      processedAt: this.processedAt?.toISOString(),
      transactionId: this.transactionId,
      errorMessage: this.errorMessage,
    };
  }
}

// Domain interfaces
export interface CreatePaymentParams {
  from: ValidUsername;
  to: string;
  amount: number;
  currency: Currency;
  memo?: string;
  type?: PaymentType;
}

export interface CreateCurationRewardParams {
  from: ValidUsername;
  to: string;
  amount: number;
  period: string;
  percentage: number;
}

export interface CreateDelegationRewardParams {
  from: ValidUsername;
  to: string;
  amount: number;
  hpDelegated: number;
}

export interface ReconstitutePaymentParams {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: Currency;
  memo: string;
  type: PaymentType;
  status: PaymentStatus;
  createdAt: Date;
  processedAt?: Date;
  transactionId?: string;
  errorMessage?: string;
}

export interface PaymentSnapshot {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: Currency;
  memo: string;
  type: PaymentType;
  status: PaymentStatus;
  createdAt: string;
  processedAt?: string;
  transactionId?: string;
  errorMessage?: string;
}

// Domain Exceptions
export class InvalidPaymentStatusTransitionError extends Error {
  constructor(from: PaymentStatus, to: PaymentStatus) {
    super(`Invalid payment status transition from ${from} to ${to}`);
    this.name = 'InvalidPaymentStatusTransitionError';
  }
}
