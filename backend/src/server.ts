/**
 * Local development server
 *
 * This server wraps Lambda handlers in Express for local development.
 * In production, handlers are invoked via API Gateway.
 */

// Load environment variables from .env file (if exists)
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local if AUTH_MODE=local, otherwise load .env
const authMode = process.env.AUTH_MODE || 'cognito';
const envFile = authMode === 'local' ? '.env.local' : '.env';
const envPath = path.resolve(__dirname, '..', envFile);
dotenv.config({ path: envPath });

console.log(`[server] Loading environment from: ${envFile}`);
console.log(`[server] AUTH_MODE: ${process.env.AUTH_MODE || 'cognito'}`);

import express, { Request, Response } from 'express';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import cors from 'cors';

// Import handlers
import { handler as authHandler } from './handlers/auth-handler';
import { handler as adminHandler } from './handlers/admin-handler';
import { getMeHandler, updateMeHandler, getUserProfileHandler } from './handlers/profile-handler';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Convert Express request to API Gateway event format
 */
function convertToApiGatewayEvent(req: Request, basePath: string = ''): APIGatewayProxyEvent {
  return {
    httpMethod: req.method,
    path: basePath + req.path,
    resource: basePath + req.path,
    headers: req.headers as { [name: string]: string },
    multiValueHeaders: {},
    queryStringParameters: req.query as { [name: string]: string },
    multiValueQueryStringParameters: null,
    pathParameters: req.params,
    stageVariables: null,
    requestContext: {
      accountId: 'local',
      apiId: 'local',
      protocol: 'HTTP/1.1',
      httpMethod: req.method,
      path: basePath + req.path,
      stage: 'local',
      requestId: Math.random().toString(36).substring(7),
      requestTimeEpoch: Date.now(),
      resourceId: 'local',
      resourcePath: basePath + req.path,
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: req.ip || '127.0.0.1',
        user: null,
        userAgent: req.get('user-agent') || null,
        userArn: null,
      },
      authorizer: null,
    },
    body: req.body ? JSON.stringify(req.body) : null,
    isBase64Encoded: false,
  };
}

/**
 * Mock Lambda context
 */
const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'local',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'local',
  memoryLimitInMB: '512',
  awsRequestId: 'local',
  logGroupName: 'local',
  logStreamName: 'local',
  getRemainingTimeInMillis: () => 300000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

/**
 * Wrap Lambda handler for Express
 */
function wrapHandler(
  handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>,
  basePath: string = ''
) {
  return async (req: Request, res: Response) => {
    try {
      const event = convertToApiGatewayEvent(req, basePath);
      const result = await handler(event, mockContext);

      // Set headers
      if (result.headers) {
        Object.entries(result.headers).forEach(([key, value]) => {
          res.setHeader(key, value as string);
        });
      }

      // Set status and send body
      res.status(result.statusCode);

      if (result.body) {
        const body = typeof result.body === 'string' ? result.body : JSON.stringify(result.body);
        res.send(body);
      } else {
        res.end();
      }
    } catch (error) {
      console.error('Handler error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sandbox-backend',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Auth routes
// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.all('/auth/*', wrapHandler(authHandler, '/auth'));

// Profile routes
// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.get('/me', wrapHandler(getMeHandler, ''));
// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.put('/me', wrapHandler(updateMeHandler, ''));

// Public user profile
// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.get('/users/:userId', wrapHandler(getUserProfileHandler, ''));

// Admin routes (catch-all)
// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.all('/admin/*', wrapHandler(adminHandler, ''));

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
+------------------------------------------------------+
|  Sandbox Backend Development Server                   |
|  http://localhost:${PORT}                              |
|                                                       |
|  Health Check: http://localhost:${PORT}/health         |
+------------------------------------------------------+
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
