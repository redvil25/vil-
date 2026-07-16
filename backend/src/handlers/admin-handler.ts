import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { AdminUserService } from '../services/admin-user-service';
import { UserRepository } from '../repositories/user-repository';
import { CognitoService } from '../services/cognito-service';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  getRequestId,
  corsPreflightResponse,
} from '../utils/api-response';
import { listUsersQuerySchema, userIdParamSchema } from '../validators/admin.validators';
import { validateRequest } from '../validators/admin.validators';
import { HttpStatus } from '../types/api.types';
import { getUserContext } from '../utils/auth-context';

// Initialize admin user service
const userRepository = new UserRepository();
const cognitoService = new CognitoService();
const adminUserService = new AdminUserService(userRepository, cognitoService);

// ==================== User Management Handlers ====================

/**
 * List all users with optional role filter
 * GET /admin/users
 */
export const listUsersHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);

  try {
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse();
    }

    // Parse and validate query parameters
    const queryParams = {
      role: event.queryStringParameters?.role,
      limit: event.queryStringParameters?.limit,
      lastEvaluatedKey: event.queryStringParameters?.lastEvaluatedKey,
    };

    const validation = validateRequest(listUsersQuerySchema, queryParams);
    if (!validation.success) {
      const errors = 'errors' in validation ? validation.errors : {};
      return validationErrorResponse('Validation failed', errors, requestId);
    }

    const result = await adminUserService.listUsers({
      role: validation.data.role,
      limit: validation.data.limit,
      lastEvaluatedKey: validation.data.lastEvaluatedKey,
    });

    return successResponse(result, HttpStatus.OK, requestId);
  } catch (error) {
    return errorResponse(error as Error, requestId);
  }
};

/**
 * Get user details by ID
 * GET /admin/users/{userId}
 */
export const getUserDetailsHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);

  try {
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse();
    }

    const path = event.path || event.resource || '';
    const pathMatch = path.match(/\/admin\/users\/([^/]+)$/i);
    if (!pathMatch || !pathMatch[1]) {
      return validationErrorResponse('User ID is required', undefined, requestId);
    }

    const userId = pathMatch[1];

    // Validate user ID format
    const validation = validateRequest(userIdParamSchema, { userId });
    if (!validation.success) {
      const errors = 'errors' in validation ? validation.errors : {};
      return validationErrorResponse('Invalid user ID', errors, requestId);
    }

    const userDetails = await adminUserService.getUserDetails(userId);

    return successResponse(userDetails, HttpStatus.OK, requestId);
  } catch (error) {
    return errorResponse(error as Error, requestId);
  }
};

/**
 * Enable a user
 * POST /admin/users/{userId}/enable
 */
export const enableUserHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);

  try {
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse();
    }

    const { userId: adminUserId } = await getUserContext(event);

    const path = event.path || event.resource || '';
    const pathMatch = path.match(/\/admin\/users\/([^/]+)\/enable$/i);
    if (!pathMatch || !pathMatch[1]) {
      return validationErrorResponse('User ID is required', undefined, requestId);
    }

    const userId = pathMatch[1];

    // Validate user ID format
    const validation = validateRequest(userIdParamSchema, { userId });
    if (!validation.success) {
      const errors = 'errors' in validation ? validation.errors : {};
      return validationErrorResponse('Invalid user ID', errors, requestId);
    }

    await adminUserService.enableUser(userId, adminUserId);

    return successResponse({ message: 'User enabled successfully' }, HttpStatus.OK, requestId);
  } catch (error) {
    return errorResponse(error as Error, requestId);
  }
};

/**
 * Disable a user
 * POST /admin/users/{userId}/disable
 */
export const disableUserHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);

  try {
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse();
    }

    const { userId: adminUserId } = await getUserContext(event);

    const path = event.path || event.resource || '';
    const pathMatch = path.match(/\/admin\/users\/([^/]+)\/disable$/i);
    if (!pathMatch || !pathMatch[1]) {
      return validationErrorResponse('User ID is required', undefined, requestId);
    }

    const userId = pathMatch[1];

    // Validate user ID format
    const validation = validateRequest(userIdParamSchema, { userId });
    if (!validation.success) {
      const errors = 'errors' in validation ? validation.errors : {};
      return validationErrorResponse('Invalid user ID', errors, requestId);
    }

    await adminUserService.disableUser(userId, adminUserId);

    return successResponse({ message: 'User disabled successfully' }, HttpStatus.OK, requestId);
  } catch (error) {
    return errorResponse(error as Error, requestId);
  }
};

/**
 * Reset a user's password
 * POST /admin/users/{userId}/reset-password
 */
export const resetUserPasswordHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);

  try {
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse();
    }

    const path = event.path || event.resource || '';
    const pathMatch = path.match(/\/admin\/users\/([^/]+)\/reset-password$/i);
    if (!pathMatch || !pathMatch[1]) {
      return validationErrorResponse('User ID is required', undefined, requestId);
    }

    const userId = pathMatch[1];

    // Validate user ID format
    const validation = validateRequest(userIdParamSchema, { userId });
    if (!validation.success) {
      const errors = 'errors' in validation ? validation.errors : {};
      return validationErrorResponse('Invalid user ID', errors, requestId);
    }

    await adminUserService.resetUserPassword(userId);

    return successResponse(
      { message: 'Password reset email sent successfully' },
      HttpStatus.OK,
      requestId
    );
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
  if (method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  // User Management Routes
  else if (path.match(/\/admin\/users\/[^/]+\/enable$/i) && method === 'POST') {
    return enableUserHandler(event, context);
  } else if (path.match(/\/admin\/users\/[^/]+\/disable$/i) && method === 'POST') {
    return disableUserHandler(event, context);
  } else if (path.match(/\/admin\/users\/[^/]+\/reset-password$/i) && method === 'POST') {
    return resetUserPasswordHandler(event, context);
  } else if (path.match(/\/admin\/users\/[^/]+$/i) && method === 'GET') {
    return getUserDetailsHandler(event, context);
  } else if (path.match(/\/admin\/users$/i) && method === 'GET') {
    return listUsersHandler(event, context);
  } else {
    return errorResponse(new Error(`Route not found: ${method} ${path}`), getRequestId(event));
  }
};
