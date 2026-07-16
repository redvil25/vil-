/**
 * CORS (Cross-Origin Resource Sharing) utilities
 *
 * Security-focused CORS handling with origin validation
 */

import { logCorsViolation } from './logger';

/**
 * List of allowed origins for CORS requests
 * Configure via environment variable: ALLOWED_ORIGINS (comma-separated)
 */
const getAllowedOrigins = (): string[] => {
  const originsEnv = process.env.ALLOWED_ORIGINS || '';

  // Parse comma-separated list
  const origins = originsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  // Default to localhost for development if no origins configured
  if (origins.length === 0 && process.env.NODE_ENV !== 'production') {
    return ['http://localhost:3000', 'http://localhost:3001'];
  }

  return origins;
};

/**
 * Validate if an origin is allowed
 *
 * @param origin - The origin from the request header
 * @returns The origin if allowed, null otherwise
 */
export const validateOrigin = (origin: string | undefined): string | null => {
  if (!origin) {
    return null;
  }

  const allowedOrigins = getAllowedOrigins();

  // If no allowed origins configured and not in production, allow all (dev mode)
  if (allowedOrigins.length === 0 && process.env.NODE_ENV !== 'production') {
    return origin;
  }

  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  return null;
};

/**
 * Get CORS headers for a response
 *
 * @param origin - The origin from the request header
 * @returns CORS headers object
 */
export const getCorsHeaders = (origin: string | undefined): Record<string, string> => {
  const validatedOrigin = validateOrigin(origin);

  // Base CORS headers
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers':
      'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Max-Age': '86400', // 24 hours
  };

  // Only set origin if validated
  if (validatedOrigin) {
    headers['Access-Control-Allow-Origin'] = validatedOrigin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else if (origin) {
    // For invalid origins, don't set CORS headers (browser will block)
    // Log the attempt for security monitoring
    logCorsViolation(origin);
  }

  return headers;
};

/**
 * Get CORS headers for preflight OPTIONS request
 *
 * @param origin - The origin from the request header
 * @returns Complete CORS headers for OPTIONS response
 */
export const getPreflightHeaders = (origin: string | undefined): Record<string, string> => {
  return getCorsHeaders(origin);
};
