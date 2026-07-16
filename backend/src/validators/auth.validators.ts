/**
 * Zod validation schemas for authentication endpoints
 */

import { z } from 'zod';
import { UserRole } from '../types/dynamodb.types';

/**
 * Email validation
 */
const emailSchema = z.string().email('Invalid email address').toLowerCase().trim();

/**
 * Password validation
 * Cognito default: 8+ chars, mixed case, numbers
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(99, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Username validation
 */
const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
  .trim();

/**
 * User role validation
 */
const roleSchema = z.nativeEnum(UserRole).optional();

/**
 * Register request schema
 */
export const registerRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
  role: roleSchema,
});

/**
 * Login request schema
 */
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Refresh token request schema
 */
export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Confirm signup request schema
 */
export const confirmSignUpRequestSchema = z.object({
  email: emailSchema,
  confirmationCode: z
    .string()
    .min(6, 'Confirmation code must be at least 6 characters')
    .max(6, 'Confirmation code must be exactly 6 characters'),
});

/**
 * Forgot password request schema
 */
export const forgotPasswordRequestSchema = z.object({
  email: emailSchema,
});

/**
 * Confirm forgot password request schema
 */
export const confirmForgotPasswordRequestSchema = z.object({
  email: emailSchema,
  confirmationCode: z
    .string()
    .min(6, 'Confirmation code must be at least 6 characters')
    .max(6, 'Confirmation code must be exactly 6 characters'),
  newPassword: passwordSchema,
});

/**
 * Validate request body against schema
 */
export const validateRequest = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const zodError: z.ZodError = err;
      const errors: Record<string, string> = {};
      zodError.issues.forEach((issue) => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
      });
      return { success: false, errors };
    }
    return {
      success: false,
      errors: { _error: 'Validation failed' },
    };
  }
};
