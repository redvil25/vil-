/**
 * Admin types for user management
 */

import { UserRole, AccountStatus } from './dynamodb.types';

/**
 * Options for listing users
 */
export interface ListUsersOptions {
  role?: UserRole;
  limit?: number;
  lastEvaluatedKey?: string;
}

/**
 * Summary of a user for admin list view
 */
export interface AdminUserSummary {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
  accountStatus: AccountStatus;
  cognitoStatus: string;
  emailVerified: boolean;
  createdAt: string;
  lastActiveAt?: string;
}

/**
 * Detailed user information for admin view
 * Extends summary with additional fields
 */
export interface AdminUserDetails extends AdminUserSummary {
  bio?: string;
  avatarUrl?: string;
  updatedAt: string;
  cognitoUserCreateDate: string;
  cognitoUserLastModifiedDate: string;
}

/**
 * Result of listing users for admin
 */
export interface AdminUserListResult {
  users: AdminUserSummary[];
  pagination: {
    limit: number;
    lastKey?: string;
    hasMore: boolean;
  };
}

/**
 * Action log entry for admin operations
 */
export interface AdminActionLog {
  action: 'enable' | 'disable' | 'reset_password';
  targetUserId: string;
  adminUserId: string;
  timestamp: string;
  details?: string;
}
