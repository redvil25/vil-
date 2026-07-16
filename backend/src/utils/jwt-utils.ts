/**
 * JWT utilities for token generation and validation
 */

import jwt from 'jsonwebtoken';
import { JWTPayload, DecodedToken } from '../types/auth.types';
import { AuthenticationError, AuthErrorCodes } from './errors';
import { config } from './config';

/**
 * Verify and decode a JWT token
 * Note: In production, this should verify against Cognito's public keys
 */
export const verifyToken = (token: string, secret: string): DecodedToken => {
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as JWTPayload;

    const decodedFull = jwt.decode(token, { complete: true });
    const header = decodedFull?.header || { alg: 'HS256', typ: 'JWT' };

    return {
      payload: decoded,
      header: {
        alg: header.alg,
        typ: header.typ || 'JWT',
        kid: header.kid,
      },
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token has expired', AuthErrorCodes.TOKEN_EXPIRED);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token', AuthErrorCodes.INVALID_TOKEN);
    }
    throw new AuthenticationError('Token verification failed', AuthErrorCodes.INVALID_TOKEN);
  }
};

/**
 * Decode a JWT token without verification (for testing/development)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};

/**
 * Generate a JWT access token
 * Note: In production, tokens come from Cognito. This is for testing/development.
 */
export const generateAccessToken = (
  payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>,
  secret: string
): string => {
  return jwt.sign(payload, secret, {
    expiresIn: config.jwt.accessTokenExpiry,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
};

/**
 * Generate a JWT refresh token
 */
export const generateRefreshToken = (
  payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>,
  secret: string
): string => {
  return jwt.sign(payload, secret, {
    expiresIn: config.jwt.refreshTokenExpiry,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Get token expiration time in seconds
 */
export const getTokenExpirationTime = (token: string): number | null => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }

  return decoded.exp;
};

/**
 * Get time until token expires (in seconds)
 */
export const getTimeUntilExpiration = (token: string): number | null => {
  const expirationTime = getTokenExpirationTime(token);
  if (!expirationTime) {
    return null;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeRemaining = expirationTime - currentTime;

  return timeRemaining > 0 ? timeRemaining : 0;
};
