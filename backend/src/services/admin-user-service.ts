/**
 * Admin User Service for user management operations
 */

import { UserRepository } from '../repositories/user-repository';
import { CognitoService } from './cognito-service';
import {
  UserProfileEntity,
  UserRole,
  AccountStatus,
  PaginationParams,
} from '../types/dynamodb.types';
import { CognitoUserDetails } from '../types/auth.types';
import {
  ListUsersOptions,
  AdminUserSummary,
  AdminUserDetails,
  AdminUserListResult,
} from '../types/admin.types';
import { NotFoundError, AuthorizationError, AuthErrorCodes } from '../utils/errors';

/**
 * Service for admin user management operations
 */
export class AdminUserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cognitoService: CognitoService
  ) {}

  /**
   * List users with optional role filter and pagination
   */
  async listUsers(options: ListUsersOptions = {}): Promise<AdminUserListResult> {
    const { role, limit = 20, lastEvaluatedKey } = options;

    // Parse lastEvaluatedKey if provided
    const pagination: PaginationParams = {
      limit,
      lastEvaluatedKey: lastEvaluatedKey
        ? (JSON.parse(lastEvaluatedKey) as Record<string, unknown>)
        : undefined,
    };

    // Get users from DynamoDB
    const result = role
      ? await this.userRepository.getUsersByRole(role, pagination)
      : await this.userRepository.getAllUsers(pagination);

    // Fetch Cognito status for all users to display accurate confirmation state
    const cognitoStatusMap = await this.buildCognitoStatusMap();

    // Map to admin user summaries
    const users = result.items.map((user) => this.mapToAdminUserSummary(user, cognitoStatusMap));

    return {
      users,
      pagination: {
        limit,
        lastKey: result.lastEvaluatedKey ? JSON.stringify(result.lastEvaluatedKey) : undefined,
        hasMore: !!result.lastEvaluatedKey,
      },
    };
  }

  /**
   * Get detailed user information including Cognito status
   */
  async getUserDetails(userId: string): Promise<AdminUserDetails> {
    // Get user from DynamoDB
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found', AuthErrorCodes.USER_NOT_FOUND);
    }

    // Get Cognito details using email as username
    let cognitoDetails: CognitoUserDetails | null = null;
    try {
      cognitoDetails = await this.cognitoService.adminGetUser(user.Email);
    } catch (error) {
      // Log but continue - user might exist in DynamoDB but not Cognito (edge case)
      console.warn(`[AdminUserService] Could not fetch Cognito details for user ${userId}:`, error);
    }

    // Build details
    const details: AdminUserDetails = {
      userId: user.UserId,
      email: user.Email,
      username: user.Username,
      role: user.Role,
      accountStatus: user.AccountStatus || AccountStatus.ACTIVE,
      cognitoStatus: cognitoDetails?.userStatus || 'UNKNOWN',
      emailVerified: cognitoDetails?.emailVerified || false,
      createdAt: user.CreatedAt,
      updatedAt: user.UpdatedAt,
      lastActiveAt: user.LastActiveAt,
      bio: user.Bio,
      avatarUrl: user.AvatarUrl,
      cognitoUserCreateDate: cognitoDetails?.userCreateDate || '',
      cognitoUserLastModifiedDate: cognitoDetails?.userLastModifiedDate || '',
    };

    return details;
  }

  /**
   * Enable a user account
   * Updates both Cognito and DynamoDB
   */
  async enableUser(userId: string, adminUserId: string): Promise<void> {
    // Prevent self-modification
    if (userId === adminUserId) {
      throw new AuthorizationError('Cannot modify your own account status');
    }

    // Get user to verify existence and get email
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found', AuthErrorCodes.USER_NOT_FOUND);
    }

    // Prevent modifying admin accounts
    if (user.Role === UserRole.ADMIN) {
      throw new AuthorizationError('Cannot modify admin account status');
    }

    // Enable in Cognito
    await this.cognitoService.adminEnableUser(user.Email);

    // Update DynamoDB status
    await this.userRepository.updateAccountStatus(userId, AccountStatus.ACTIVE);

    console.info(`[AdminUserService] User ${userId} enabled by admin ${adminUserId}`);
  }

  /**
   * Disable a user account
   * Updates both Cognito and DynamoDB
   */
  async disableUser(userId: string, adminUserId: string): Promise<void> {
    // Prevent self-modification
    if (userId === adminUserId) {
      throw new AuthorizationError('Cannot modify your own account status');
    }

    // Get user to verify existence and get email
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found', AuthErrorCodes.USER_NOT_FOUND);
    }

    // Prevent modifying admin accounts
    if (user.Role === UserRole.ADMIN) {
      throw new AuthorizationError('Cannot modify admin account status');
    }

    // Disable in Cognito
    await this.cognitoService.adminDisableUser(user.Email);

    // Update DynamoDB status
    await this.userRepository.updateAccountStatus(userId, AccountStatus.DISABLED);

    console.info(`[AdminUserService] User ${userId} disabled by admin ${adminUserId}`);
  }

  /**
   * Reset a user's password
   * Sends password reset email via Cognito
   */
  async resetUserPassword(userId: string): Promise<void> {
    // Get user to verify existence and get email
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found', AuthErrorCodes.USER_NOT_FOUND);
    }

    // Trigger password reset in Cognito
    await this.cognitoService.adminResetUserPassword(user.Email);

    console.info(`[AdminUserService] Password reset triggered for user ${userId}`);
  }

  /**
   * Build a map of email -> Cognito status by listing all Cognito users.
   * Used to show accurate confirmation/verified state in the user list.
   */
  private async buildCognitoStatusMap(): Promise<
    Map<string, { userStatus: string; emailVerified: boolean }>
  > {
    const statusMap = new Map<string, { userStatus: string; emailVerified: boolean }>();

    try {
      let paginationToken: string | undefined;
      do {
        const page = await this.cognitoService.adminListUsers(paginationToken);
        for (const cognitoUser of page.users) {
          statusMap.set(cognitoUser.email.toLowerCase(), {
            userStatus: cognitoUser.userStatus,
            emailVerified: cognitoUser.emailVerified,
          });
        }
        paginationToken = page.paginationToken;
      } while (paginationToken);
    } catch (error) {
      console.warn(
        '[AdminUserService] Could not fetch Cognito user list, falling back to defaults:',
        error
      );
    }

    return statusMap;
  }

  /**
   * Map a user profile entity to admin user summary
   */
  private mapToAdminUserSummary(
    user: UserProfileEntity,
    cognitoStatusMap: Map<string, { userStatus: string; emailVerified: boolean }>
  ): AdminUserSummary {
    const cognitoInfo = cognitoStatusMap.get(user.Email.toLowerCase());

    const summary: AdminUserSummary = {
      userId: user.UserId,
      email: user.Email,
      username: user.Username,
      role: user.Role,
      accountStatus: user.AccountStatus || AccountStatus.ACTIVE,
      cognitoStatus: cognitoInfo?.userStatus || 'UNKNOWN',
      emailVerified: cognitoInfo?.emailVerified ?? false,
      createdAt: user.CreatedAt,
      lastActiveAt: user.LastActiveAt,
    };

    return summary;
  }
}
