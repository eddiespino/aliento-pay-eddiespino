/**
 * TypeScript Best Practices Examples
 *
 * This file demonstrates the TypeScript coding standards enforced by our ESLint configuration.
 * Follow these patterns to write clean, maintainable, and type-safe code.
 */

// ✅ GOOD: Use interfaces for object shapes
interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(userData: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  update(id: string, updates: Partial<Pick<User, 'name' | 'email' | 'isActive'>>): Promise<User>;
}

// ✅ GOOD: Use type imports when importing only for types
import type { User as UserType, UserRepository } from './types';

// ✅ GOOD: Explicit function return types
export function formatUserName(user: User): string {
  return `${user.name} (${user.email})`;
}

// ✅ GOOD: Use readonly for properties that don't change
export const API_CONFIG = {
  baseUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
} as const;

// ✅ GOOD: Prefer const assertions over enums for simple constants
export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type PaymentStatusType = (typeof PaymentStatus)[keyof typeof PaymentStatus];

// ✅ GOOD: Use utility types to avoid duplication
interface CreateUserRequest extends Omit<User, 'id' | 'createdAt'> {
  password: string;
}

interface UpdateUserRequest extends Partial<Pick<User, 'name' | 'email' | 'isActive'>> {
  id: string;
}

// ✅ GOOD: Strict boolean expressions
export function isUserActive(user: User | null): boolean {
  return user?.isActive === true;
}

// ✅ GOOD: Nullish coalescing instead of ||
export function getUserDisplayName(user: User | null): string {
  return user?.name ?? 'Anonymous User';
}

// ✅ GOOD: Optional chaining
export function getUserCreatedYear(user: User | null): number | null {
  return user?.createdAt?.getFullYear() ?? null;
}

// ✅ GOOD: Array type with simple syntax
export function processUsers(users: User[]): string[] {
  return users
    .filter((user): user is User => user.isActive === true)
    .map((user): string => formatUserName(user));
}

// ✅ GOOD: Use for-of instead of traditional for loops
export function logActiveUsers(users: User[]): void {
  for (const user of users) {
    if (user.isActive === true) {
      console.log(formatUserName(user));
    }
  }
}

// ✅ GOOD: Use includes() instead of indexOf()
export function isValidStatus(status: string): boolean {
  const validStatuses = ['active', 'inactive', 'pending'] as const;
  return validStatuses.includes(status as (typeof validStatuses)[number]);
}

// ✅ GOOD: Use startsWith/endsWith for string checks
export function isEmailValid(email: string): boolean {
  return email.includes('@') && !email.startsWith('@') && !email.endsWith('@');
}

// ✅ GOOD: Class with proper naming and readonly properties
export class UserService {
  private readonly repository: UserRepository;
  private readonly logger: Logger;

  constructor(repository: UserRepository, logger: Logger) {
    this.repository = repository;
    this.logger = logger;
  }

  public async createUser(userData: CreateUserRequest): Promise<User> {
    this.logger.info('Creating new user', { email: userData.email });

    // ✅ GOOD: Destructuring with proper typing
    const { password, ...userProps } = userData;

    const user = await this.repository.create({
      ...userProps,
      isActive: true,
    });

    this.logger.info('User created successfully', { userId: user.id });
    return user;
  }

  public async getUserById(id: string): Promise<User | null> {
    if (id.trim() === '') {
      throw new Error('User ID cannot be empty');
    }

    return this.repository.findById(id);
  }
}

// ✅ GOOD: Factory pattern with dependency injection
export function createUserService(repository: UserRepository): UserService {
  const logger = createLogger('UserService');
  return new UserService(repository, logger);
}

// ✅ GOOD: Type-safe error handling
export class UserNotFoundError extends Error {
  public readonly code = 'USER_NOT_FOUND' as const;

  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
    this.name = 'UserNotFoundError';
  }
}

// ✅ GOOD: Discriminated unions for better type safety
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

export function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (response.success === true) {
    return response.data;
  }

  throw new Error(`API Error: ${response.error} (${response.code})`);
}

// ✅ GOOD: Generic constraints
export function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// ✅ GOOD: Barrel exports with proper organization
export type { User, UserRepository, CreateUserRequest, UpdateUserRequest };
export { UserService, UserNotFoundError, createUserService };

// 🔗 Related configuration files:
// - eslint.config.js: ESLint rules enforcing these patterns
// - tsconfig.json: TypeScript compiler options for strict checking
// - prettier.config.js: Code formatting rules

/**
 * ❌ ANTI-PATTERNS TO AVOID:
 *
 * 1. Using 'any' type:
 *    ❌ function processData(data: any): any
 *    ✅ function processData<T>(data: T): ProcessedData<T>
 *
 * 2. Non-null assertions without good reason:
 *    ❌ user.name!.toUpperCase()
 *    ✅ user.name?.toUpperCase() ?? ''
 *
 * 3. Implicit return types:
 *    ❌ function getUser() { return fetch('/user'); }
 *    ✅ function getUser(): Promise<Response> { return fetch('/user'); }
 *
 * 4. Using var or mutable let when const would work:
 *    ❌ let config = { apiUrl: 'https://api.com' };
 *    ✅ const config = { apiUrl: 'https://api.com' } as const;
 *
 * 5. Traditional for loops when for-of would work:
 *    ❌ for (let i = 0; i < users.length; i++)
 *    ✅ for (const user of users)
 */
