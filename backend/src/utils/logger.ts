/**
 * Structured logging utility for CloudWatch Logs
 * Provides consistent, JSON-formatted logging for better querying and alerting
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SECURITY = 'SECURITY',
}

export enum LogCategory {
  API = 'API',
  AUTH = 'AUTH',
  DATABASE = 'DATABASE',
  VALIDATION = 'VALIDATION',
  SECURITY = 'SECURITY',
  BUSINESS = 'BUSINESS',
}

interface LogContext {
  requestId?: string;
  userId?: string;
  resource?: string;
  action?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Base logging function - outputs structured JSON to CloudWatch
 */
const log = (
  level: LogLevel,
  category: LogCategory,
  message: string,
  context?: LogContext,
  error?: Error
): void => {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
  };

  if (context) {
    entry.context = context;
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  // Output as JSON for CloudWatch Logs Insights
  console.log(JSON.stringify(entry));
};

/**
 * Log info-level messages
 */
export const logInfo = (category: LogCategory, message: string, context?: LogContext): void => {
  log(LogLevel.INFO, category, message, context);
};

/**
 * Log warning-level messages
 */
export const logWarn = (category: LogCategory, message: string, context?: LogContext): void => {
  log(LogLevel.WARN, category, message, context);
};

/**
 * Log error-level messages
 */
export const logError = (
  category: LogCategory,
  message: string,
  context?: LogContext,
  error?: Error
): void => {
  log(LogLevel.ERROR, category, message, context, error);
};

/**
 * Log security-relevant events (authentication, authorization, suspicious activity)
 */
export const logSecurity = (message: string, context?: LogContext): void => {
  log(LogLevel.SECURITY, LogCategory.SECURITY, message, context);
};

/**
 * Log API request/response
 */
export const logApiRequest = (
  method: string,
  path: string,
  statusCode: number,
  context?: LogContext
): void => {
  logInfo(LogCategory.API, `${method} ${path} - ${statusCode}`, context);
};

/**
 * Log authentication events
 */
export const logAuth = (event: string, context?: LogContext): void => {
  logSecurity(`Authentication: ${event}`, context);
};

/**
 * Log authorization failures
 */
export const logAuthzFailure = (action: string, resource: string, context?: LogContext): void => {
  logSecurity(`Authorization denied: ${action} on ${resource}`, {
    ...context,
    action,
    resource,
  });
};

/**
 * Log validation failures (potential attack attempts)
 */
export const logValidationFailure = (field: string, value: unknown, context?: LogContext): void => {
  logWarn(LogCategory.VALIDATION, `Validation failed for ${field}`, {
    ...context,
    field,
    value: typeof value === 'string' ? value.substring(0, 100) : String(value),
  });
};

/**
 * Log rate limit events
 */
export const logRateLimit = (identifier: string, context?: LogContext): void => {
  logWarn(LogCategory.SECURITY, `Rate limit exceeded`, {
    ...context,
    identifier,
  });
};

/**
 * Log CORS violations
 */
export const logCorsViolation = (origin: string, context?: LogContext): void => {
  logSecurity(`CORS violation: Invalid origin ${origin}`, {
    ...context,
    origin,
  });
};

/**
 * Log analytics events with special prefix for CloudWatch Logs Insights filtering
 */
export const logAnalytics = (event: Record<string, unknown>): void => {
  // Use a special logType prefix for easy filtering in CloudWatch Logs Insights
  console.log(
    JSON.stringify({
      logType: 'ANALYTICS',
      ...event,
    })
  );
};

/**
 * Extract common context from API Gateway event
 */
export const extractRequestContext = (event: {
  requestContext?: {
    requestId?: string;
    identity?: {
      sourceIp?: string;
      userAgent?: string;
    };
    authorizer?: {
      claims?: {
        sub?: string;
        'cognito:username'?: string;
      };
    };
  };
  path?: string;
  httpMethod?: string;
}): LogContext => {
  const requestId = event.requestContext?.requestId;
  const userId =
    event.requestContext?.authorizer?.claims?.sub ||
    event.requestContext?.authorizer?.claims?.['cognito:username'];
  const ip = event.requestContext?.identity?.sourceIp;
  const userAgent = event.requestContext?.identity?.userAgent;
  const resource = event.path;
  const action = event.httpMethod;

  return {
    requestId,
    userId,
    ip,
    userAgent,
    resource,
    action,
  };
};
