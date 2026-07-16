/**
 * Utilities for creating standardized API Gateway responses
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { Response } from 'express';
import { APIResponse, HttpStatus, CORS_HEADERS } from '../types/api.types';
import { ApplicationError } from './errors';
import { logError, LogCategory } from './logger';

/**
 * Cache configuration options
 */
export interface CacheOptions {
  /** Cache duration in seconds */
  maxAge?: number;
  /** Whether to allow caching on CDN/shared caches */
  public?: boolean;
  /** Whether response can be cached */
  cacheable?: boolean;
}

/**
 * Create cache headers based on options
 */
const getCacheHeaders = (options?: CacheOptions): Record<string, string> => {
  if (!options || !options.cacheable) {
    // No cache by default
    return {
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
    };
  }

  const maxAge = options.maxAge || 0;
  const visibility = options.public ? 'public' : 'private';

  return {
    'Cache-Control': `${visibility}, max-age=${maxAge}`,
  };
};

/**
 * Create a successful API response
 */
export const successResponse = <T>(
  data: T,
  statusCode: number = HttpStatus.OK,
  requestId?: string,
  cacheOptions?: CacheOptions
): APIGatewayProxyResult => {
  const response: APIResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  const cacheHeaders = getCacheHeaders(cacheOptions);

  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      ...cacheHeaders,
    },
    body: JSON.stringify(response),
  };
};

/**
 * Create an error API response
 */
export const errorResponse = (
  error: Error | ApplicationError,
  requestId?: string
): APIGatewayProxyResult => {
  const isApplicationError = error instanceof ApplicationError;
  const statusCode = isApplicationError ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
  const code = isApplicationError ? error.code : 'INTERNAL_ERROR';

  const response: APIResponse = {
    success: false,
    error: {
      message: error.message || 'An unexpected error occurred',
      code,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  // Log ALL errors with appropriate level based on status code
  if (isApplicationError) {
    // ApplicationErrors (4xx, 5xx) - log based on severity
    if (statusCode >= 500) {
      // 5xx errors - these are server errors
      logError(LogCategory.API, `Server error: ${error.message}`, { requestId, code }, error);
    } else if (statusCode === 401 || statusCode === 403) {
      // Authentication/Authorization failures - security concern
      logError(
        LogCategory.SECURITY,
        `Auth error: ${error.message}`,
        { requestId, code, statusCode },
        error
      );
    } else {
      // Other 4xx errors (validation, not found, etc.)
      logError(
        LogCategory.API,
        `Client error: ${error.message}`,
        { requestId, code, statusCode },
        error
      );
    }
  } else {
    // Unexpected errors (non-ApplicationError)
    logError(LogCategory.API, 'Unexpected error', { requestId }, error);
  }

  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(response),
  };
};

/**
 * Create a validation error response
 */
export const validationErrorResponse = (
  message: string,
  validationErrors?: Record<string, string>,
  requestId?: string
): APIGatewayProxyResult => {
  const response: APIResponse = {
    success: false,
    error: {
      message,
      code: 'VALIDATION_ERROR',
      details: validationErrors,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  // Log validation errors
  logError(
    LogCategory.VALIDATION,
    `Validation error: ${message}`,
    { requestId, statusCode: HttpStatus.BAD_REQUEST, validationErrors },
    new Error(message)
  );

  return {
    statusCode: HttpStatus.BAD_REQUEST,
    headers: CORS_HEADERS,
    body: JSON.stringify(response),
  };
};

/**
 * Parse and validate request body
 */
export const parseRequestBody = <T>(body: string | null): T | null => {
  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
};

/**
 * Extract request ID from API Gateway event
 */
export const getRequestId = (event: { requestContext?: { requestId?: string } }): string => {
  return event.requestContext?.requestId || 'unknown';
};

/**
 * Create CORS preflight response
 */
export const corsPreflightResponse = (): APIGatewayProxyResult => {
  return {
    statusCode: HttpStatus.OK,
    headers: CORS_HEADERS,
    body: '',
  };
};

/**
 * Send success response for Express handlers
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = HttpStatus.OK
): void => {
  res.status(statusCode).json({
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Send error response for Express handlers
 */
export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  details?: Record<string, unknown>
): void => {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...details,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
};
