/**
 * User repository for managing user profiles
 */

import { BaseRepository, RepositoryConfig } from './base-repository';
import {
  UserProfileEntity,
  UserRole,
  AccountStatus,
  QueryResult,
  PaginationParams,
} from '../types/dynamodb.types';
import { userPK, profileSK, getCurrentTimestamp } from '../utils/dynamodb-keys';
import { v4 as uuidv4 } from 'uuid';

/**
 * Input for creating a new user
 */
export interface CreateUserInput {
  email: string;
  username: string;
  role?: UserRole;
  cognitoSub?: string;
}

/**
 * Input for updating a user
 */
export interface UpdateUserInput {
  username?: string;
  role?: UserRole;
  bio?: string;
  avatarUrl?: string;
}

/**
 * User repository for user profile operations
 */
export class UserRepository extends BaseRepository {
  constructor(config?: Partial<RepositoryConfig>) {
    super({
      tableName: config?.tableName || process.env.DYNAMODB_TABLE_NAME || 'sandbox-table',
      region: config?.region,
      endpoint: config?.endpoint,
    });
  }

  /**
   * Create a new user profile
   */
  async createUser(input: CreateUserInput): Promise<UserProfileEntity> {
    const userId = uuidv4();
    const now = getCurrentTimestamp();

    const userProfile: UserProfileEntity = {
      PK: userPK(userId),
      SK: profileSK(),
      EntityType: 'UserProfile',
      UserId: userId,
      Email: input.email.toLowerCase(),
      Username: input.username,
      Role: input.role || UserRole.USER,
      CognitoSub: input.cognitoSub,
      CreatedAt: now,
      UpdatedAt: now,
    };

    await this.putItem(userProfile);
    return userProfile;
  }

  /**
   * Get user profile by user ID
   */
  async getUserById(userId: string): Promise<UserProfileEntity | null> {
    return this.getItem<UserProfileEntity>(userPK(userId), profileSK());
  }

  /**
   * Get user profile by Cognito sub (UUID)
   */
  async getUserByCognitoSub(cognitoSub: string): Promise<UserProfileEntity | null> {
    // Query GSI with CognitoSub as the key
    // Note: This assumes a GSI exists with CognitoSub as the partition key
    const result = await this.query<UserProfileEntity>({
      IndexName: 'CognitoSubIndex',
      KeyConditionExpression: 'CognitoSub = :cognitoSub',
      ExpressionAttributeValues: {
        ':cognitoSub': cognitoSub,
      },
      Limit: 1,
    });

    return result.items[0] || null;
  }

  /**
   * Get user profile by email
   */
  async getUserByEmail(email: string): Promise<UserProfileEntity | null> {
    // Query GSI with Email as the key
    // Note: This assumes a GSI exists with Email as the partition key
    const result = await this.query<UserProfileEntity>({
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'Email = :email',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase(),
      },
      Limit: 1,
    });

    return result.items[0] || null;
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, input: UpdateUserInput): Promise<void> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Build dynamic update expression
    if (input.username !== undefined) {
      updateExpressions.push('#username = :username');
      expressionAttributeNames['#username'] = 'Username';
      expressionAttributeValues[':username'] = input.username;
    }

    if (input.role !== undefined) {
      updateExpressions.push('#role = :role');
      expressionAttributeNames['#role'] = 'Role';
      expressionAttributeValues[':role'] = input.role;
    }

    if (input.bio !== undefined) {
      updateExpressions.push('#bio = :bio');
      expressionAttributeNames['#bio'] = 'Bio';
      expressionAttributeValues[':bio'] = input.bio;
    }

    if (input.avatarUrl !== undefined) {
      updateExpressions.push('#avatarUrl = :avatarUrl');
      expressionAttributeNames['#avatarUrl'] = 'AvatarUrl';
      expressionAttributeValues[':avatarUrl'] = input.avatarUrl;
    }

    // Always update UpdatedAt
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'UpdatedAt';
    expressionAttributeValues[':updatedAt'] = getCurrentTimestamp();

    if (updateExpressions.length === 1) {
      // Only UpdatedAt, nothing to update
      return;
    }

    const updateExpression = `SET ${updateExpressions.join(', ')}`;

    await this.updateItem(
      userPK(userId),
      profileSK(),
      updateExpression,
      expressionAttributeNames,
      expressionAttributeValues,
      'attribute_exists(PK)' // Ensure user exists
    );
  }

  /**
   * Update user's last active timestamp
   * Called during token refresh to track user activity
   */
  async updateLastActive(userId: string): Promise<void> {
    const now = getCurrentTimestamp();

    await this.updateItem(
      userPK(userId),
      profileSK(),
      'SET #lastActiveAt = :lastActiveAt',
      { '#lastActiveAt': 'LastActiveAt' },
      { ':lastActiveAt': now },
      'attribute_exists(PK)' // Only update if user exists
    );
  }

  /**
   * Delete user profile
   */
  async deleteUser(userId: string): Promise<void> {
    await this.deleteItem(userPK(userId), profileSK());
  }

  /**
   * Check if user exists by user ID
   */
  async userExists(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user !== null;
  }

  /**
   * Check if email is already registered
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    return user !== null;
  }

  /**
   * Check if username is already taken
   */
  async usernameExists(username: string): Promise<boolean> {
    // Query GSI with Username as the key
    // Note: This assumes a GSI exists with Username as the partition key
    const result = await this.query<UserProfileEntity>({
      IndexName: 'UsernameIndex',
      KeyConditionExpression: 'Username = :username',
      ExpressionAttributeValues: {
        ':username': username,
      },
      Limit: 1,
    });

    return result.items.length > 0;
  }

  /**
   * Get all users with pagination (admin operation)
   * WARNING: Uses Scan - acceptable for admin operations with low frequency
   * NOTE: Uses scanUntilLimit to ensure we get the requested number of matching items,
   * since regular scan with FilterExpression may return fewer items than Limit.
   */
  async getAllUsers(pagination?: PaginationParams): Promise<QueryResult<UserProfileEntity>> {
    return this.scanUntilLimit<UserProfileEntity>(
      {
        FilterExpression: 'SK = :profileSK',
        ExpressionAttributeValues: {
          ':profileSK': 'PROFILE',
        },
      },
      pagination
    );
  }

  /**
   * Get users filtered by role with pagination (admin operation)
   * WARNING: Uses Scan with filter - acceptable for admin operations with low frequency
   * NOTE: Uses scanUntilLimit to ensure we get the requested number of matching items,
   * since regular scan with FilterExpression may return fewer items than Limit.
   */
  async getUsersByRole(
    role: UserRole,
    pagination?: PaginationParams
  ): Promise<QueryResult<UserProfileEntity>> {
    return this.scanUntilLimit<UserProfileEntity>(
      {
        FilterExpression: 'SK = :profileSK AND #role = :role',
        ExpressionAttributeNames: {
          '#role': 'Role',
        },
        ExpressionAttributeValues: {
          ':profileSK': 'PROFILE',
          ':role': role,
        },
      },
      pagination
    );
  }

  /**
   * Update user account status
   */
  async updateAccountStatus(userId: string, status: AccountStatus): Promise<void> {
    const now = getCurrentTimestamp();

    await this.updateItem(
      userPK(userId),
      profileSK(),
      'SET #accountStatus = :accountStatus, #updatedAt = :updatedAt',
      {
        '#accountStatus': 'AccountStatus',
        '#updatedAt': 'UpdatedAt',
      },
      {
        ':accountStatus': status,
        ':updatedAt': now,
      },
      'attribute_exists(PK)' // Ensure user exists
    );
  }

  /**
   * Get multiple user profiles by user IDs (batch operation)
   * Returns a map of userId -> UserProfileEntity for efficient lookups
   */
  async getUsersByIds(userIds: string[]): Promise<Map<string, UserProfileEntity>> {
    if (userIds.length === 0) {
      return new Map();
    }

    // Remove duplicates
    const uniqueIds = [...new Set(userIds)];

    const keys = uniqueIds.map((userId) => ({
      PK: userPK(userId),
      SK: profileSK(),
    }));

    const users = await this.batchGetItems<UserProfileEntity>(keys);

    // Create a map for efficient lookups
    const userMap = new Map<string, UserProfileEntity>();
    for (const user of users) {
      userMap.set(user.UserId, user);
    }

    return userMap;
  }
}
