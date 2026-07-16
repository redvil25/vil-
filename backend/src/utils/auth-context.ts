/**
 * Utility for extracting authenticated user context from API Gateway events
 * Supports both Cognito Authorizer and manual JWT validation
 *
 * IMPORTANT: User roles are read from DynamoDB, NOT from JWT claims.
 * DynamoDB is the single source of truth for user roles.
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { UserRole, AccountStatus } from '../types/dynamodb.types';
import { AuthenticationError, AuthErrorCodes } from './errors';

/**
 * User context extracted from JWT token
 */
export interface UserContext {
  userId: string;
  role: UserRole;
  email?: string;
  cognitoUsername?: string;
}

/**
 * Extract user context from API Gateway authorizer or Authorization header
 * Supports both Cognito Authorizer (when use_cognito_auth=true) and manual JWT validation
 *
 * Note: User ID is extracted from JWT claims, but role is always read from DynamoDB.
 * This ensures role changes take effect immediately without requiring token refresh.
 */
export const getUserContext = async (event: APIGatewayProxyEvent): Promise<UserContext> => {
  const authorizer = event.requestContext.authorizer;

  // If Cognito authorizer is enabled, use claims from authorizer context
  if (authorizer && authorizer.claims) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userId =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      authorizer.claims['custom:userId'] ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      authorizer.claims.sub ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      authorizer.claims['cognito:username'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const email = authorizer.claims.email as string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const cognitoUsername = authorizer.claims['cognito:username'] as string | undefined;

    if (!userId) {
      throw new AuthenticationError('User ID not found in token');
    }

    // Read role and account status from DynamoDB (single source of truth)
    // Use self-healing lookup for OAuth users whose Cognito sub doesn't match DynamoDB UserId
    const { UserService } = await import('../services/user-service');
    const userService = new UserService();
    const userProfile = await userService.getUserProfileWithSelfHealing(
      userId as string,
      email,
      cognitoUsername
    );

    // Block disabled users from accessing the API
    if (userProfile.AccountStatus === AccountStatus.DISABLED) {
      throw new AuthenticationError(
        'Your account has been disabled',
        AuthErrorCodes.ACCOUNT_DISABLED
      );
    }

    const role = userProfile.Role;

    // Use DynamoDB UserId (may differ from JWT userId for OAuth users after self-healing)
    return { userId: userProfile.UserId, role, email, cognitoUsername };
  }

  // Otherwise, manually extract and validate JWT from Authorization header
  const authHeader = event.headers.Authorization || event.headers.authorization;
  if (!authHeader) {
    throw new AuthenticationError('Authorization header is required', 'MISSING_AUTH_HEADER');
  }

  const token = authHeader.replace('Bearer ', '');

  // Use AuthService (or MockAuthService in local mode) to get auth context from token
  const { config } = await import('./config');
  let authContext;

  if (config.auth.mode === 'local') {
    const { MockAuthService } = await import('../services/mock-auth-service');
    const mockAuthService = new MockAuthService();
    authContext = await mockAuthService.getAuthContext(token);
  } else {
    const { AuthService } = await import('../services/auth-service');
    const authService = new AuthService();
    authContext = await authService.getAuthContext(token);
  }

  return {
    userId: authContext.userId,
    role: authContext.role,
    email: authContext.email,
  };
};

/**
 * Extract user context optionally - returns null if not authenticated
 * Useful for endpoints that work with both authenticated and anonymous users
 */
export const getUserContextOptional = async (
  event: APIGatewayProxyEvent
): Promise<UserContext | null> => {
  try {
    return await getUserContext(event);
  } catch {
    return null;
  }
};
