/**
 * Custom error classes for application-specific errors
 */

/**
 * Base application error
 */
export class ApplicationError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication failed', code?: string) {
    super(message, 401, code);
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Access denied', code?: string) {
    super(message, 403, code);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends ApplicationError {
  constructor(message: string = 'Resource not found', code?: string) {
    super(message, 404, code);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends ApplicationError {
  public validationErrors?: Record<string, string>;

  constructor(
    message: string = 'Validation failed',
    codeOrValidationErrors?: string | Record<string, string>,
    code?: string
  ) {
    // Handle both calling patterns:
    // new ValidationError(message, code)
    // new ValidationError(message, validationErrors, code)
    if (typeof codeOrValidationErrors === 'string') {
      super(message, 400, codeOrValidationErrors);
      this.validationErrors = undefined;
    } else {
      super(message, 400, code);
      this.validationErrors = codeOrValidationErrors;
    }
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends ApplicationError {
  constructor(message: string = 'Resource conflict', code?: string) {
    super(message, 409, code);
  }
}

/**
 * Internal server error (500)
 */
export class InternalServerError extends ApplicationError {
  constructor(message: string = 'Internal server error', code?: string) {
    super(message, 500, code);
  }
}

/**
 * Service unavailable error (503)
 */
export class ServiceUnavailableError extends ApplicationError {
  constructor(message: string = 'Service temporarily unavailable', code?: string) {
    super(message, 503, code);
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Forbidden', code?: string) {
    super(message, 403, code);
  }
}

/**
 * Bad request error (400)
 */
export class BadRequestError extends ApplicationError {
  constructor(message: string = 'Bad request', code?: string) {
    super(message, 400, code);
  }
}

/**
 * Too many requests error (429) - for rate limiting
 */
export class TooManyRequestsError extends ApplicationError {
  constructor(message: string = 'Too many requests', code?: string) {
    super(message, 429, code);
  }
}

/**
 * Error codes for specific authentication errors
 */
export const AuthErrorCodes = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS: 'USERNAME_ALREADY_EXISTS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
} as const;

/**
 * Error codes for story-related errors
 */
export const StoryErrorCodes = {
  STORY_NOT_FOUND: 'STORY_NOT_FOUND',
  AUTHOR_NOT_FOUND: 'AUTHOR_NOT_FOUND',
  INVALID_TITLE: 'INVALID_TITLE',
  INVALID_DESCRIPTION: 'INVALID_DESCRIPTION',
  INVALID_GENRE: 'INVALID_GENRE',
  INVALID_TAGS: 'INVALID_TAGS',
  INVALID_STORY_STATUS: 'INVALID_STORY_STATUS',
  INVALID_INPUT: 'INVALID_INPUT',
  CANNOT_DELETE_PUBLISHED: 'CANNOT_DELETE_PUBLISHED',
  CANNOT_PUBLISH_NO_EPISODES: 'CANNOT_PUBLISH_NO_EPISODES',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  ALREADY_LIKED: 'ALREADY_LIKED',
  NOT_LIKED: 'NOT_LIKED',
} as const;

/**
 * Error codes for data errors (legacy - kept for backwards compatibility)
 */
export const DataErrorCodes = {
  STORY_NOT_FOUND: 'STORY_NOT_FOUND',
  EPISODE_NOT_FOUND: 'EPISODE_NOT_FOUND',
  INVALID_STORY_STATUS: 'INVALID_STORY_STATUS',
  CANNOT_DELETE_PUBLISHED_STORY: 'CANNOT_DELETE_PUBLISHED_STORY',
} as const;

/**
 * Error codes for comment-related errors
 */
export const CommentErrorCodes = {
  COMMENT_NOT_FOUND: 'COMMENT_NOT_FOUND',
  STORY_NOT_FOUND: 'STORY_NOT_FOUND',
  EPISODE_NOT_FOUND: 'EPISODE_NOT_FOUND',
  INVALID_CONTENT: 'INVALID_CONTENT',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  COMMENT_ALREADY_MODERATED: 'COMMENT_ALREADY_MODERATED',
  CANNOT_MODERATE_OWN_COMMENT: 'CANNOT_MODERATE_OWN_COMMENT',
} as const;

/**
 * Error codes for blog-related errors
 */
export const BlogErrorCodes = {
  INVALID_BLOG_NAME: 'INVALID_BLOG_NAME',
  ALREADY_LIKED: 'ALREADY_LIKED',
  NOT_LIKED: 'NOT_LIKED',
  ALREADY_NOTIFIED: 'ALREADY_NOTIFIED',
} as const;

/**
 * Error codes for moderation-related errors
 */
export const ModerationErrorCodes = {
  FLAG_NOT_FOUND: 'FLAG_NOT_FOUND',
  CONTENT_NOT_FOUND: 'CONTENT_NOT_FOUND',
  DUPLICATE_FLAG: 'DUPLICATE_FLAG',
  FLAG_ALREADY_REVIEWED: 'FLAG_ALREADY_REVIEWED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_ACTION: 'INVALID_ACTION',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
} as const;
