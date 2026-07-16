/**
 * Admin validators for request validation
 */

import { z, ZodSchema } from 'zod';
import { UserRole } from '../types/dynamodb.types';

/**
 * Schema for listing users query parameters
 */
export const listUsersQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  lastEvaluatedKey: z.string().optional(),
});

/**
 * Schema for user ID path parameter
 */
export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;

/**
 * Generic request validation utility
 * Validates request data against a Zod schema
 */
export function validateRequest<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_root';
    errors[key] = issue.message;
  }

  return { success: false, errors };
}
