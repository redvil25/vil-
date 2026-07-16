/**
 * Authentication types and interfaces
 */

import { UserRole } from './dynamodb.types';

/**
 * Registration request input
 */
export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  role?: UserRole;
}

/**
 * Login request input
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Refresh token input
 */
export interface RefreshTokenInput {
  refreshToken: string;
}

/**
 * Authentication tokens response
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/**
 * User info without tokens
 */
export interface UserInfo {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt?: string;
}

/**
 * Registration response
 */
export interface RegisterResponse {
  user: UserInfo;
  tokens: AuthTokens;
  requiresEmailConfirmation?: boolean;
}

/**
 * Login response
 */
export interface LoginResponse {
  user: UserInfo;
  tokens: AuthTokens;
}

/**
 * Token refresh response
 */
export type RefreshTokenResponse = AuthTokens;

/**
 * JWT payload structure
 */
export interface JWTPayload {
  sub: string; // User ID
  email: string;
  username?: string;
  role?: UserRole;
  cognitoSub?: string;
  iat: number; // Issued at
  exp: number; // Expiration
  iss: string; // Issuer
  aud: string; // Audience
}

/**
 * Decoded and verified JWT token
 */
export interface DecodedToken {
  payload: JWTPayload;
  header: {
    alg: string;
    typ: string;
    kid?: string;
  };
}

/**
 * User authentication context
 */
export interface AuthContext {
  userId: string;
  email: string;
  username?: string;
  role: UserRole;
  cognitoSub?: string;
  isAuthenticated: boolean;
  lastActiveAt?: string;
}

/**
 * Cognito user attributes
 */
export interface CognitoUserAttributes {
  sub: string;
  email: string;
  email_verified?: boolean;
  'custom:userId'?: string;
  'custom:username'?: string;
  'custom:role'?: string;
}

/**
 * Cognito user details for admin operations
 */
export interface CognitoUserDetails {
  username: string;
  email: string;
  emailVerified: boolean;
  enabled: boolean;
  userStatus: string; // CONFIRMED, UNCONFIRMED, ARCHIVED, COMPROMISED, UNKNOWN, RESET_REQUIRED, FORCE_CHANGE_PASSWORD
  userCreateDate: string;
  userLastModifiedDate: string;
  sub: string;
  customUserId?: string;
  customUsername?: string;
  customRole?: string;
}

/**
 * Cognito user list response for admin operations
 */
export interface CognitoUserList {
  users: CognitoUserDetails[];
  paginationToken?: string;
}
