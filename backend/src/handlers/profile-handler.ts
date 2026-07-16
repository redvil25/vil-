/**
 * Profile Lambda handlers
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { UserService } from '../services/user-service';
import { CognitoService } from '../services/cognito-service';
import { MockAuthService } from '../services/mock-auth-service';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  parseRequestBody,
  getRequestId,
  corsPreflightResponse,
} from '../utils/api-response';
import {
  updateProfileRequestSchema,
  userIdPathParamSchema,
  validateRequest,
} from '../validators/profile.validators';
import { HttpStatus } from '../types/api.types';
import { getUserContext } from '../utils/auth-context';
import { config } from '../utils/config';

// Use MockAuthService in local mode, otherwise use CognitoService
const cognitoService = config.auth.mode === 'local' ? new MockAuthService() : new CognitoService();
const userService = new UserService(undefined, cognitoService as CognitoService);

// Log which service is being used
if (config.auth.mode === 'local') {
  console.warn('[PROFILE_HANDLER] AUTH_MODE=local - using MockAuthService (Cognito bypassed)');
} else {
  console.info('[PROFILE_HANDLER] Using real CognitoService');
}

/**
 * Get current user profile
 * GET /me
 * Protected: All authenticated users
 *
 * Includes self-healing for Google OAuth users whose Cognito sub
 * doesn't match their DynamoDB UserId.
 */
export const getMeHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse();
    }

    // Get user context (includes email for OAuth recovery)
    const { userId, email, cognitoUsername } = await getUserContext(event);

    // Get private profile (with OAuth self-healing if needed)
    const profile = await userService.getPrivateProfile(userId, email, cognitoUsername);

    return successResponse(profile, HttpStatus.OK, requestId);
  } catch (error) {
    return errorResponse(error as Error, requestId);
  }
};

/**
 * Update current user profile
 * PUT /me
 * Protected: All authenticated users
 */
export const updateMeHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse();
    }

    // Get user context
    const { userId } = await getUserContext(event);

    // Parse request body
    const body = parseRequestBody(event.body);
    if (!body) {
      return validationErrorResponse('Request body is required', undefined, requestId);
    }

    // Validate request
    const validation = validateRequest(updateProfileRequestSchema, body);
    if (!validation.success) {
      return validationErrorResponse('Validation failed', validation.errors, requestId);
    }

    // Update profile
    await userService.updateUserProfile(userId, {
      username: validation.data.username,
      bio: validation.data.bio,
      avatarUrl: validation.data.avatarUrl,
    });

    // Get updated profile
    const profile = await userService.getPrivateProfile(userId);

    return successResponse(profile, HttpStatus.OK, requestId);
  } catch (error) {
    return errorResponse(error as Error, requestId);
  }
};

/**
 * Get public user profile
 * GET /users/{userId}
 * Public endpoint
 */
export const getUserProfileHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse();
    }

    // Validate path parameters
    const pathParams = event.pathParameters;
    if (!pathParams) {
      return validationErrorResponse('User ID is required', undefined, requestId);
    }

    const paramValidation = validateRequest(userIdPathParamSchema, pathParams);
    if (!paramValidation.success) {
      return validationErrorResponse('Invalid user ID', paramValidation.errors, requestId);
    }

    // Get public profile
    const profile = await userService.getPublicProfile(paramValidation.data.userId);

    return successResponse(profile, HttpStatus.OK, requestId);
  } catch (error) {
    return errorResponse(error as Error, requestId);
  }
};

/**
 * Main Lambda handler - routes requests to appropriate sub-handlers
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const path = event.path || event.resource || '';
  const method = event.httpMethod;

  // Route to appropriate handler based on path and method
  if (path.endsWith('/me') && method === 'GET') {
    return getMeHandler(event, context);
  } else if (path.endsWith('/me') && method === 'PUT') {
    return updateMeHandler(event, context);
  } else if (path.match(/\/users\/[^/]+$/) && method === 'GET') {
    return getUserProfileHandler(event, context);
  } else if (method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  // Route not found
  return errorResponse(new Error(`Route not found: ${method} ${path}`), getRequestId(event));
};
