/**
 * Zod validation schemas for profile endpoints
 */

import { z } from 'zod';

/**
 * Username validation
 */
const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters long')
  .max(20, 'Username cannot exceed 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

/**
 * Bio validation
 */
const bioSchema = z.string().max(500, 'Bio cannot exceed 500 characters').trim().optional();

/**
 * Avatar URL validation
 */
const avatarUrlSchema = z
  .string()
  .url('Avatar URL must be a valid URL')
  .refine(
    (url) => {
      try {
        const parsedUrl = new URL(url);
        return ['http:', 'https:'].includes(parsedUrl.protocol);
      } catch {
        return false;
      }
    },
    { message: 'Avatar URL must use HTTP or HTTPS protocol' }
  )
  .optional()
  .or(z.literal('')); // Allow empty string to clear avatar

/**
 * User ID path parameter validation
 * Uses a general UUID pattern that accepts all UUID versions (v1-v7)
 * Zod's built-in .uuid() only validates v1-v5, but Cognito uses v7
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const userIdParamSchema = z.string().regex(UUID_PATTERN, 'Invalid user ID format');

/**
 * Update profile request schema
 */
export const updateProfileRequestSchema = z
  .object({
    username: usernameSchema.optional(),
    bio: bioSchema,
    avatarUrl: avatarUrlSchema,
  })
  .refine(
    (data) => data.username !== undefined || data.bio !== undefined || data.avatarUrl !== undefined,
    { message: 'At least one field must be provided for update' }
  );

/**
 * User ID path parameter schema
 */
export const userIdPathParamSchema = z.object({
  userId: userIdParamSchema,
});

/**
 * Validate request against schema
 */
export const validateRequest = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const validated: z.infer<T> = schema.parse(data);
    return { success: true, data: validated };
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const zodError: z.ZodError = err;
      const errors: Record<string, string> = {};
      zodError.issues.forEach((issue: z.ZodIssue) => {
        const path: string = issue.path.join('.');
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
