/**
 * Mock Authentication Service for Local Development
 *
 * This service bypasses AWS Cognito and provides mock authentication
 * for local development. It mimics the real auth service interface
 * but returns hardcoded test data.
 *
 * IMPORTANT: This should ONLY be used when AUTH_MODE=local
 */

/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { UserRole } from '../types/dynamodb.types';
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  RegisterResponse,
  LoginResponse,
  RefreshTokenResponse,
  AuthContext,
} from '../types/auth.types';
import { AuthenticationError, ConflictError, AuthErrorCodes } from '../utils/errors';
import { UserRepository } from '../repositories/user-repository';

/**
 * Mock user database (in-memory for local development)
 */
interface MockUser {
  userId: string;
  email: string;
  username: string;
  password: string; // In mock service, we store plaintext (never do this in production!)
  role: UserRole;
  createdAt: string;
}

// Predefined test users for local development
const MOCK_USERS: MockUser[] = [
  {
    userId: 'sandbox-user-001',
    email: 'user1@sandbox-test.com',
    username: 'test_user1',
    password: 'SandboxUser1!',
    role: UserRole.USER,
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'sandbox-user-002',
    email: 'user2@sandbox-test.com',
    username: 'test_user2',
    password: 'SandboxUser1!',
    role: UserRole.USER,
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'sandbox-admin-001',
    email: 'admin@sandbox-test.com',
    username: 'test_admin',
    password: 'SandboxAdmin1!',
    role: UserRole.ADMIN,
    createdAt: new Date().toISOString(),
  },
];

// In-memory user store (for users created during local development)
const dynamicMockUsers: MockUser[] = [];

/**
 * Mock Authentication Service
 */
export class MockAuthService {
  private readonly userRepository: UserRepository;

  constructor(userRepository?: UserRepository) {
    this.userRepository = userRepository || new UserRepository();
  }

  /**
   * Register a new user (mock)
   */
  async register(data: RegisterInput): Promise<RegisterResponse> {
    console.info('[MockAuthService] Mock register called', {
      email: data.email,
      username: data.username,
      role: data.role,
    });

    // Check if user already exists
    const allUsers = [...MOCK_USERS, ...dynamicMockUsers];
    const existingUser = allUsers.find((u) => u.email === data.email);

    if (existingUser) {
      throw new ConflictError('User already exists', AuthErrorCodes.EMAIL_ALREADY_EXISTS);
    }

    // Create new mock user
    const newUser: MockUser = {
      userId: `mock-user-${data.email.split('@')[0]}`,
      email: data.email,
      username: data.username,
      password: data.password,
      role: data.role || UserRole.USER,
      createdAt: new Date().toISOString(),
    };

    dynamicMockUsers.push(newUser);

    // Generate mock tokens
    const accessToken = this.generateMockToken(newUser);
    const refreshToken = this.generateMockRefreshToken(newUser);
    const idToken = this.generateMockToken(newUser);

    return {
      user: {
        userId: newUser.userId,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      tokens: {
        accessToken,
        refreshToken,
        idToken,
        expiresIn: 900, // 15 minutes
        tokenType: 'Bearer' as const,
      },
    };
  }

  /**
   * Login user (mock)
   */
  async login(data: LoginInput): Promise<LoginResponse> {
    console.info('[MockAuthService] Mock login called', { email: data.email });

    // Find user
    const allUsers = [...MOCK_USERS, ...dynamicMockUsers];
    const user = allUsers.find((u) => u.email === data.email);

    if (!user) {
      throw new AuthenticationError('Invalid credentials', AuthErrorCodes.INVALID_CREDENTIALS);
    }

    // Verify password (simple string comparison for mock)
    if (user.password !== data.password) {
      throw new AuthenticationError('Invalid credentials', AuthErrorCodes.INVALID_CREDENTIALS);
    }

    console.info('[MockAuthService] Login successful, checking DynamoDB for current role');

    // Query DynamoDB to get the current role (in case it was updated)
    // Falls back to in-memory role if DynamoDB is unavailable (pure local mode)
    let currentRole = user.role;
    try {
      const dbUser = await this.userRepository.getUserById(user.userId);
      if (dbUser) {
        currentRole = dbUser.Role;
        console.info('[MockAuthService] Got current role from DynamoDB:', currentRole);
      } else {
        console.warn(
          '[MockAuthService] User not found in DynamoDB, using in-memory role:',
          currentRole
        );
      }
    } catch {
      console.warn('[MockAuthService] DynamoDB unavailable, using in-memory role:', currentRole);
    }

    // Create user object with current role from DynamoDB
    const userWithCurrentRole = { ...user, role: currentRole };

    // Generate mock tokens with current role
    const accessToken = this.generateMockToken(userWithCurrentRole);
    const refreshToken = this.generateMockRefreshToken(userWithCurrentRole);
    const idToken = this.generateMockToken(userWithCurrentRole);

    return {
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        role: currentRole,
        createdAt: user.createdAt,
      },
      tokens: {
        accessToken,
        refreshToken,
        idToken,
        expiresIn: 900, // 15 minutes
        tokenType: 'Bearer' as const,
      },
    };
  }

  /**
   * Refresh token (mock)
   */
  async refreshToken(data: RefreshTokenInput): Promise<RefreshTokenResponse> {
    console.info('[MockAuthService] Mock refresh token called');

    // Decode mock refresh token to get user info
    const userData = this.decodeMockToken(data.refreshToken);

    if (!userData) {
      throw new AuthenticationError('Invalid refresh token', AuthErrorCodes.INVALID_TOKEN);
    }

    // Find user
    const allUsers = [...MOCK_USERS, ...dynamicMockUsers];
    const user = allUsers.find((u) => u.userId === userData.userId);

    if (!user) {
      throw new AuthenticationError('User not found', AuthErrorCodes.INVALID_TOKEN);
    }

    // Generate new tokens
    const accessToken = this.generateMockToken(user);
    const refreshToken = this.generateMockRefreshToken(user);
    const idToken = this.generateMockToken(user);

    return {
      accessToken,
      refreshToken,
      idToken,
      expiresIn: 900, // 15 minutes
      tokenType: 'Bearer' as const,
    };
  }

  /**
   * Logout (mock - no-op)
   */
  async logout(_accessToken?: string): Promise<void> {
    console.info('[MockAuthService] Mock logout called');
  }

  /**
   * Confirm signup (mock - no-op)
   */
  async confirmSignUp(_email: string, _code: string): Promise<void> {
    console.info('[MockAuthService] Mock confirm signup called');
  }

  /**
   * Forgot password (mock - no-op)
   */
  async forgotPassword(_email: string): Promise<void> {
    console.info('[MockAuthService] Mock forgot password called');
  }

  /**
   * Confirm forgot password (mock - no-op)
   */
  async confirmForgotPassword(_email: string, _code: string, _newPassword: string): Promise<void> {
    console.info('[MockAuthService] Mock confirm forgot password called');
  }

  /**
   * Update user attributes (mock - no-op)
   * In local mode, role changes are handled in DynamoDB only
   */
  async updateUserAttributes(
    _username: string,
    _attributes: Array<{ Name: string; Value: string }>
  ): Promise<void> {
    console.info('[MockAuthService] Mock updateUserAttributes called (no-op in local mode)');
  }

  /**
   * Get auth context from token (mock)
   */
  async getAuthContext(token: string): Promise<AuthContext> {
    console.info('[MockAuthService] Mock getAuthContext called');

    // Decode mock token
    const userData = this.decodeMockToken(token);

    if (!userData) {
      throw new AuthenticationError('Invalid token', AuthErrorCodes.INVALID_TOKEN);
    }

    return {
      userId: userData.userId,
      email: userData.email,
      username: userData.username,
      role: userData.role,
      isAuthenticated: true,
    };
  }

  /**
   * Generate mock JWT token (not cryptographically secure - for local dev only)
   */
  private generateMockToken(user: MockUser): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(
      JSON.stringify({
        sub: user.userId,
        email: user.email,
        username: user.username,
        'custom:role': user.role,
        userId: user.userId,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        iat: Math.floor(Date.now() / 1000),
        iss: 'mock-auth-service',
      })
    ).toString('base64');
    const signature = 'mock-signature';

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Generate mock refresh token
   */
  private generateMockRefreshToken(user: MockUser): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(
      JSON.stringify({
        sub: user.userId,
        email: user.email,
        username: user.username,
        userId: user.userId,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // 7 days
        iat: Math.floor(Date.now() / 1000),
        iss: 'mock-auth-service',
        type: 'refresh',
      })
    ).toString('base64');
    const signature = 'mock-refresh-signature';

    return `${header}.${payload}.${signature}`;
  }

  /**
   * Decode mock JWT token (not secure - just for local dev)
   */
  private decodeMockToken(
    token: string
  ): { userId: string; email: string; username: string; role: UserRole } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        console.warn('[MockAuthService] Token expired');
        return null;
      }

      return {
        userId: payload.userId || payload.sub,
        email: payload.email,
        username: payload.username,
        role: payload.role || payload['custom:role'],
      };
    } catch (error) {
      console.error('[MockAuthService] Failed to decode token', error);
      return null;
    }
  }
}
