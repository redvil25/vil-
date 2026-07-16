/**
 * DynamoDB entity types for single-table design
 */

/**
 * Base entity type that all DynamoDB items must implement
 */
export interface DynamoDBEntity {
  PK: string;
  SK: string;
  EntityType: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

/**
 * User roles in the system
 */
export enum UserRole {
  USER = 'User',
  ADMIN = 'Admin',
}

/**
 * Account status for user management
 */
export enum AccountStatus {
  ACTIVE = 'Active',
  DISABLED = 'Disabled',
}

/**
 * User profile entity
 * PK: USER#{userId}
 * SK: PROFILE
 */
export interface UserProfileEntity extends DynamoDBEntity {
  PK: `USER#${string}`;
  SK: 'PROFILE';
  EntityType: 'UserProfile';
  UserId: string;
  Email: string;
  Username: string;
  Role: UserRole;
  AccountStatus?: AccountStatus; // Default: Active (undefined means Active for backward compatibility)
  Bio?: string; // Optional bio (0-500 chars)
  AvatarUrl?: string; // Optional avatar URL
  CreatedAt: string;
  UpdatedAt: string;
  CognitoSub?: string; // Cognito user sub (UUID)
  LastActiveAt?: string; // Last activity timestamp (updated on token refresh)
}

/**
 * Query result with pagination
 */
export interface QueryResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, any>;
  count: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit?: number;
  lastEvaluatedKey?: Record<string, any>;
}

// Add your own entity types below
