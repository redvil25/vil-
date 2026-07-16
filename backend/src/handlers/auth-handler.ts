/**
 * Authentication Lambda handlers
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { AuthService } from '../services/auth-service';
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
  registerRequestSchema,
  loginRequestSchema,
  refreshTokenRequestSchema,
  confirmSignUpRequestSchema,
  forgotPasswordRequestSchema,
  confirmForgotPasswordRequestSchema,
  validateRequest,
} from '../validators/auth.validators';
import { HttpStatus } from '../types/api.types';
import { AuthenticationError } from '../utils/errors';
import { config } from '../utils/config';

// Use mock auth service in local mode, otherwise use real auth service
const authService = config.auth.mode === 'local' ? new MockAuthService() : new AuthService();

// Log which auth service is being used
if (config.auth.mode === 'local') {
  console.warn('[AUTH_HANDLER] AUTH_MODE=local - using MockAuthService (Cognito bypassed)');
} else {
  console.info('[AUTH_HANDLER] Using real AuthService with Cognito');
}

/**
 * Handle user registration
 * POST /auth/register
 */
export const registerHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse();
    }

    const sourceIp = event.requestContext?.identity?.sourceIp || 'unknown';

    // Parse request body
    const body = parseRequestBody(event.body);
    if (!body) {
      return validationErrorResponse('Request body is required', undefined, requestId);
    }

    // Validate request
    const validation = validateRequest(registerRequestSchema, body);
    if (!validation.success) {
      return validationErrorResponse('Validation failed', validation.errors, requestId);
    }

    console.info('[REGISTER] Registration attempt', {
      email: validation.data.email,
      sourceIp,
      userAgent: event.headers?.['User-Agent'] || event.headers?.['user-agent'] || 'unknown',
      requestId,
    });

    // Register user
    const result = await authService.register(validation.data);

    return successResponse(result, HttpStatus.CREATED, requestId);
  } catch (error) {
    return errorResponse(error as Error, requestId);
  }
};

/**
 * Handle user login
 * POST /auth/login
 */
export const loginHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse();
    }

    const sourceIp = event.requestContext?.identity?.sourceIp || 'unknown';

    // Parse request body
    const body = parseRequestBody(event.body);
    if (!body) {
      return validationErrorResponse('Request body is required', undefined, requestId);
    }

    // Validate request
    const validation = validateRequest(loginRequestSchema, body);
    if (!validation.success) {
      return validationErrorResponse('Validation failed', validation.errors, requestId);
    }

    console.info('[LOGIN] Login attempt', {
      email: validation.data.email,
      sourceIp,
      requestId,
    });

    // Login user
    const result = await authService.login(validation.data);

    return successResponse(result, HttpStatus.OK, requestId);
  } catch (error) {
    return errorResponse(error as Error, requestId);
  }
};

/**
 * Handle token refresh
 * POST /auth/refresh
 */
export const refreshTokenHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse();
    }

    // Parse request body
    const body = parseRequestBody(event.body);

    if (!body) {
      return validationErrorResponse('Request body is required', undefined, requestId);
    }

    // Validate request
    const validation = validateRequest(refreshTokenRequestSchema, body);

    if (!validation.success) {
      return validationErrorResponse('Validation failed', validation.errors, requestId);
    }

    const result = await authService.refreshToken(validation.data);

    return successResponse(result, HttpStatus.OK, requestId);
  } catch (error) {
    return errorResponse(error as Error, requestId);
  }
};

/**
 * Handle logout
 * POST /auth/logout
 * Invalidates Cognito session (all refresh tokens) for the authenticated user
 */
export const logoutHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse();
    }

    // Extract access token from Authorization header
    const authHeader = event.headers.Authorization || event.headers.authorization;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      // Sign out from Cognito (invalidates all refresh tokens)
      await authService.logout(token);
    }
    // If no token, just return success (client will clear local tokens)

    return successResponse({ message: 'Logout successful' }, HttpStatus.OK, requestId);
  } catch (error) {
    // Even if Cognito logout fails, return success so client can clear tokens
    console.warn('[LOGOUT] Error during logout, but returning success:', error);
    return successResponse({ message: 'Logout successful' }, HttpStatus.OK, requestId);
  }
};

/**
 * Handle signup confirmation
 * POST /auth/confirm-signup
 */
export const confirmSignUpHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse();
    }

    // Parse request body
    const body = parseRequestBody(event.body);
    if (!body) {
      return validationErrorResponse('Request body is required', undefined, requestId);
    }

    // Validate request
    const validation = validateRequest(confirmSignUpRequestSchema, body);
    if (!validation.success) {
      return validationErrorResponse('Validation failed', validation.errors, requestId);
    }

    // Confirm signup
    await authService.confirmSignUp(validation.data.email, validation.data.confirmationCode);

    return successResponse({ message: 'Email confirmed successfully' }, HttpStatus.OK, requestId);
  } catch (error) {
    return errorResponse(error as Error, requestId);
  }
};

/**
 * Handle forgot password request
 * POST /auth/forgot-password
 */
export const forgotPasswordHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse();
    }

    // Parse request body
    const body = parseRequestBody(event.body);
    if (!body) {
      return validationErrorResponse('Request body is required', undefined, requestId);
    }

    // Validate request
    const validation = validateRequest(forgotPasswordRequestSchema, body);
    if (!validation.success) {
      return validationErrorResponse('Validation failed', validation.errors, requestId);
    }

    // Initiate forgot password
    await authService.forgotPassword(validation.data.email);

    return successResponse(
      { message: 'Password reset code sent to email' },
      HttpStatus.OK,
      requestId
    );
  } catch (error) {
    return errorResponse(error as Error, requestId);
  }
};

/**
 * Handle confirm forgot password
 * POST /auth/confirm-forgot-password
 */
export const confirmForgotPasswordHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = getRequestId(event);

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return corsPreflightResponse();
    }

    // Parse request body
    const body = parseRequestBody(event.body);
    if (!body) {
      return validationErrorResponse('Request body is required', undefined, requestId);
    }

    // Validate request
    const validation = validateRequest(confirmForgotPasswordRequestSchema, body);
    if (!validation.success) {
      return validationErrorResponse('Validation failed', validation.errors, requestId);
    }

    // Confirm password reset
    await authService.confirmForgotPassword(
      validation.data.email,
      validation.data.confirmationCode,
      validation.data.newPassword
    );

    return successResponse({ message: 'Password reset successfully' }, HttpStatus.OK, requestId);
  } catch (error) {
    return errorResponse(error as Error, requestId);
  }
};

/**
 * Get current user info from token
 * GET /auth/me
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

    // Extract token from Authorization header
    const authHeader = event.headers.Authorization || event.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('Authorization header is required', 'MISSING_AUTH_HEADER');
    }

    const token = authHeader.replace('Bearer ', '');

    const authContext = await authService.getAuthContext(token);

    return successResponse(authContext, HttpStatus.OK, requestId);
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
  if (path.endsWith('/login') && method === 'POST') {
    return loginHandler(event, context);
  } else if (path.endsWith('/register') && method === 'POST') {
    return registerHandler(event, context);
  } else if (path.endsWith('/refresh') && method === 'POST') {
    return refreshTokenHandler(event, context);
  } else if (path.endsWith('/logout') && method === 'POST') {
    return logoutHandler(event, context);
  } else if (path.endsWith('/confirm-signup') && method === 'POST') {
    return confirmSignUpHandler(event, context);
  } else if (path.endsWith('/forgot-password') && method === 'POST') {
    return forgotPasswordHandler(event, context);
  } else if (path.endsWith('/confirm-forgot-password') && method === 'POST') {
    return confirmForgotPasswordHandler(event, context);
  } else if (path.endsWith('/me') && method === 'GET') {
    return getMeHandler(event, context);
  } else if (method === 'OPTIONS') {
    return corsPreflightResponse();
  } else {
    return errorResponse(new Error(`Route not found: ${method} ${path}`), getRequestId(event));
  }
};
