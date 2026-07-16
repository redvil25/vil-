/**
 * User service for managing user profiles and roles
 */

import { UserRepository, UpdateUserInput } from '../repositories/user-repository';
import { CognitoService } from './cognito-service';
import { UserRole, UserProfileEntity } from '../types/dynamodb.types';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from '../utils/errors';

/**
 * Input for updating user profile
 */
export interface UpdateProfileInput {
  username?: string;
  bio?: string;
  avatarUrl?: string;
}

/**
 * Public profile response (for other users viewing a profile)
 */
export interface PublicProfile {
  userId: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
}

/**
 * Private profile response (for the user viewing their own profile)
 */
export interface PrivateProfile extends PublicProfile {
  email: string;
}

/**
 * User service
 */
export class UserService {
  private readonly userRepository: UserRepository;
  private readonly cognitoService: CognitoService;

  constructor(userRepository?: UserRepository, cognitoService?: CognitoService) {
    this.userRepository = userRepository || new UserRepository();
    this.cognitoService = cognitoService || new CognitoService();
  }

  /**
   * Validate username format
   */
  private validateUsername(username: string): void {
    if (!username || username.trim().length < 3) {
      throw new ValidationError('Username must be at least 3 characters long');
    }

    if (username.length > 20) {
      throw new ValidationError('Username cannot exceed 20 characters');
    }

    // Allow alphanumeric characters and underscores
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      throw new ValidationError('Username can only contain letters, numbers, and underscores');
    }
  }

  /**
   * Validate bio format
   */
  private validateBio(bio: string): void {
    if (bio.length > 500) {
      throw new ValidationError('Bio cannot exceed 500 characters');
    }
  }

  /**
   * Validate avatar URL format
   */
  private validateAvatarUrl(avatarUrl: string): void {
    try {
      const url = new URL(avatarUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new ValidationError('Avatar URL must use HTTP or HTTPS protocol');
      }
    } catch (error) {
      // Check if the error is due to protocol mismatch
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Invalid avatar URL format');
    }
  }

  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<UserProfileEntity> {
    const user = await this.userRepository.getUserById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Get user profile with OAuth self-healing
   *
   * For Google OAuth users, handles scenarios where the JWT userId (Cognito sub)
   * doesn't match the DynamoDB UserId. Falls back to email or CognitoSub lookup
   * and updates Cognito custom:userId for future requests.
   *
   * @param userId - The userId from the JWT token (may be Cognito sub for OAuth users)
   * @param email - Optional email for fallback lookup
   * @param cognitoUsername - Optional Cognito username for fallback lookup
   * @returns The user profile entity
   * @throws NotFoundError if user cannot be found by any method
   */
  async getUserProfileWithSelfHealing(
    userId: string,
    email?: string,
    cognitoUsername?: string
  ): Promise<UserProfileEntity> {
    // First, try the normal lookup by userId
    let user = await this.userRepository.getUserById(userId);

    // If not found and email provided, try email lookup for OAuth self-healing
    if (!user && email) {
      console.info(
        '[UserService] User not found by userId, attempting email lookup for OAuth recovery',
        { userId, email }
      );

      user = await this.userRepository.getUserByEmail(email);

      if (user) {
        console.info('[UserService] Found user by email, initiating self-healing', {
          dynamoUserId: user.UserId,
          jwtUserId: userId,
          cognitoUsername,
        });

        // Self-healing: Update Cognito custom:userId to match DynamoDB UserId
        const cognitoIdentifier = cognitoUsername || user.CognitoSub || user.Email;

        try {
          // Update Cognito custom:userId for self-healing
          // NOTE: Role is stored only in DynamoDB (single source of truth)
          await this.cognitoService.updateUserAttributes(cognitoIdentifier, [
            { Name: 'custom:userId', Value: user.UserId },
          ]);

          console.info('[UserService] Successfully updated Cognito custom:userId for OAuth user', {
            cognitoIdentifier,
            userId: user.UserId,
          });
        } catch (error) {
          // Log but don't fail - the user lookup succeeded
          console.error('[UserService] Failed to update Cognito attributes for self-healing', {
            error,
            cognitoIdentifier,
            userId: user.UserId,
          });
        }
      }
    }

    // If still not found and cognitoUsername provided, try CognitoSub lookup
    if (!user && cognitoUsername) {
      console.info(
        '[UserService] User not found by userId/email, attempting CognitoSub lookup for OAuth recovery',
        { userId, cognitoUsername }
      );

      user = await this.userRepository.getUserByCognitoSub(cognitoUsername);

      if (user) {
        console.info('[UserService] Found user by CognitoSub, initiating self-healing', {
          dynamoUserId: user.UserId,
          jwtUserId: userId,
          cognitoUsername,
        });

        // Self-healing: Update Cognito custom:userId to match DynamoDB UserId
        // NOTE: Role is stored only in DynamoDB (single source of truth)
        try {
          await this.cognitoService.updateUserAttributes(cognitoUsername, [
            { Name: 'custom:userId', Value: user.UserId },
          ]);

          console.info(
            '[UserService] Successfully updated Cognito custom:userId for CognitoSub user',
            { cognitoUsername, userId: user.UserId }
          );
        } catch (error) {
          // Log but don't fail - the user lookup succeeded
          console.error(
            '[UserService] Failed to update Cognito attributes for CognitoSub self-healing',
            { error, cognitoUsername, userId: user.UserId }
          );
        }
      }
    }

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Get user role
   */
  async getUserRole(userId: string): Promise<UserRole> {
    const user = await this.getUserProfile(userId);
    return user.Role;
  }

  /**
   * Get public user profile (for other users viewing a profile)
   */
  async getPublicProfile(userId: string): Promise<PublicProfile> {
    const user = await this.getUserProfile(userId);

    return {
      userId: user.UserId,
      username: user.Username,
      bio: user.Bio,
      avatarUrl: user.AvatarUrl,
      role: user.Role,
      createdAt: user.CreatedAt,
    };
  }

  /**
   * Get private user profile (for the user viewing their own profile)
   *
   * For Google OAuth users, handles two scenarios:
   * 1. Existing user with mismatched Cognito sub: Falls back to email lookup,
   *    then updates Cognito custom:userId for future requests (self-healing)
   * 2. New Google OAuth user (no DynamoDB record): Auto-creates a new user
   *    profile with USER role and syncs Cognito attributes
   */
  async getPrivateProfile(
    userId: string,
    email?: string,
    cognitoUsername?: string
  ): Promise<PrivateProfile> {
    let user: UserProfileEntity | null = null;

    // Try self-healing lookup first
    try {
      user = await this.getUserProfileWithSelfHealing(userId, email, cognitoUsername);
    } catch (error) {
      // If not found and email provided, this might be a new Google OAuth user
      if (error instanceof NotFoundError && email) {
        console.info('[UserService] Creating new user profile for Google OAuth user', {
          email,
          cognitoUsername,
        });

        // Generate username from email (part before @)
        const emailPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
        const username = emailPrefix.substring(0, 20); // Max 20 chars

        user = await this.userRepository.createUser({
          email,
          username,
          role: UserRole.USER,
          cognitoSub: cognitoUsername || userId,
        });

        // Update Cognito with the new DynamoDB userId
        // NOTE: Role is stored only in DynamoDB (single source of truth)
        const cognitoIdentifier = cognitoUsername || email;
        try {
          await this.cognitoService.updateUserAttributes(cognitoIdentifier, [
            { Name: 'custom:userId', Value: user.UserId },
          ]);

          console.info('[UserService] Successfully set Cognito attributes for new OAuth user', {
            cognitoIdentifier,
            userId: user.UserId,
          });
        } catch (attrError) {
          console.error('[UserService] Failed to update Cognito attributes for new OAuth user', {
            error: attrError,
            cognitoIdentifier,
            userId: user.UserId,
          });
        }
      } else {
        throw error;
      }
    }

    return {
      userId: user.UserId,
      username: user.Username,
      email: user.Email,
      bio: user.Bio,
      avatarUrl: user.AvatarUrl,
      role: user.Role,
      createdAt: user.CreatedAt,
    };
  }

  /**
   * Update user profile
   * Users can update their own username, bio, and avatar
   */
  async updateUserProfile(userId: string, updates: UpdateProfileInput): Promise<void> {
    // Verify user exists
    const user = await this.getUserProfile(userId);

    // Validate updates
    if (updates.username !== undefined) {
      this.validateUsername(updates.username);

      // Check if username is already taken (if changing username)
      if (updates.username !== user.Username) {
        const existingUser = await this.userRepository.usernameExists(updates.username);
        if (existingUser) {
          throw new ConflictError('Username is already taken');
        }
      }
    }

    if (updates.bio !== undefined) {
      this.validateBio(updates.bio);
    }

    if (updates.avatarUrl !== undefined && updates.avatarUrl !== '') {
      this.validateAvatarUrl(updates.avatarUrl);
    }

    // Build repository input
    const repositoryInput: UpdateUserInput = {};
    if (updates.username !== undefined) {
      repositoryInput.username = updates.username;
    }
    if (updates.bio !== undefined) {
      repositoryInput.bio = updates.bio;
    }
    if (updates.avatarUrl !== undefined) {
      repositoryInput.avatarUrl = updates.avatarUrl;
    }

    // Update user
    await this.userRepository.updateUser(userId, repositoryInput);

    // If username changed, update Cognito custom attributes
    if (updates.username !== undefined && updates.username !== user.Username) {
      if (user.Email) {
        await this.cognitoService.updateUserAttributes(user.Email, [
          { Name: 'custom:username', Value: updates.username },
        ]);
      }
    }
  }

  /**
   * Assign role to user (Admin only)
   * This updates both DynamoDB and Cognito
   */
  async assignUserRole(
    userId: string,
    newRole: UserRole,
    adminId: string,
    adminRole: UserRole
  ): Promise<void> {
    // Verify admin is actually an admin
    if (adminRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only admins can assign roles');
    }

    // Verify user exists
    const user = await this.getUserProfile(userId);

    // Validate role
    if (!Object.values(UserRole).includes(newRole)) {
      throw new ValidationError('Invalid role');
    }

    // Prevent admins from removing their own admin role
    if (userId === adminId && user.Role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
      throw new BadRequestError('Cannot remove your own admin role');
    }

    // Update DynamoDB (single source of truth for roles)
    await this.userRepository.updateUser(userId, { role: newRole });
    // NOTE: Role is no longer stored in Cognito - DynamoDB is the single source of truth
  }
}
