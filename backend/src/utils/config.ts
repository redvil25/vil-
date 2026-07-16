/**
 * Configuration utilities for environment variables and AWS settings
 */

/**
 * Get environment variable or throw error if not set
 */
export const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
};

/**
 * Get optional environment variable
 */
export function getOptionalEnvVar(name: string): string | undefined;
export function getOptionalEnvVar(name: string, defaultValue: string): string;
export function getOptionalEnvVar(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

/**
 * Application configuration
 */
export const config = {
  // Environment
  env: getOptionalEnvVar('NODE_ENV', 'development'),
  isProduction: getOptionalEnvVar('NODE_ENV') === 'production',
  isDevelopment: getOptionalEnvVar('NODE_ENV') === 'development',
  isTest: getOptionalEnvVar('NODE_ENV') === 'test',

  // Auth mode: 'local' uses MockAuthService (no AWS needed), 'cognito' uses real Cognito
  auth: {
    mode: getOptionalEnvVar('AUTH_MODE', 'cognito') as 'local' | 'cognito',
  },

  // AWS Configuration
  aws: {
    region: getOptionalEnvVar('AWS_REGION', 'us-east-1'),
    accountId: getOptionalEnvVar('AWS_ACCOUNT_ID'),
  },

  // DynamoDB Configuration
  dynamodb: {
    tableName: getOptionalEnvVar('DYNAMODB_TABLE_NAME', 'sandbox-table'),
    endpoint: getOptionalEnvVar('DYNAMODB_ENDPOINT'), // For local development
  },

  // Cognito Configuration
  cognito: {
    userPoolId: getOptionalEnvVar('COGNITO_USER_POOL_ID', ''),
    clientId: getOptionalEnvVar('COGNITO_CLIENT_ID', ''),
    region: getOptionalEnvVar('COGNITO_REGION', getOptionalEnvVar('AWS_REGION', 'us-east-1')),
  },

  // JWT Configuration
  jwt: {
    accessTokenExpiry: 15 * 60, // 15 minutes in seconds
    refreshTokenExpiry: 7 * 24 * 60 * 60, // 7 days in seconds
    issuer: 'mindful-ai-sandbox',
    audience: 'sandbox-api',
  },

  // API Configuration
  api: {
    corsOrigins: getOptionalEnvVar('CORS_ORIGINS', '*').split(','),
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
  },

  // Logging
  logging: {
    level: getOptionalEnvVar('LOG_LEVEL', 'info'),
    prettyPrint: getOptionalEnvVar('LOG_PRETTY_PRINT', 'false') === 'true',
  },
};

/**
 * Validate required configuration
 */
export const validateConfig = (): void => {
  const requiredInProduction = ['COGNITO_USER_POOL_ID', 'COGNITO_CLIENT_ID', 'DYNAMODB_TABLE_NAME'];

  if (config.isProduction) {
    for (const varName of requiredInProduction) {
      if (!process.env[varName]) {
        throw new Error(`Required environment variable ${varName} is not set in production`);
      }
    }
  }
};

/**
 * Get Cognito configuration
 */
export const getCognitoConfig = (): {
  userPoolId: string;
  clientId: string;
  region: string;
} => ({
  userPoolId: config.cognito.userPoolId,
  clientId: config.cognito.clientId,
  region: config.cognito.region,
});

/**
 * Get DynamoDB configuration
 */
export const getDynamoDBConfig = (): {
  tableName: string;
  region: string;
  endpoint: string | undefined;
} => ({
  tableName: config.dynamodb.tableName,
  region: config.aws.region,
  endpoint: config.dynamodb.endpoint,
});
