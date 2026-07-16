/**
 * Cognito service for user authentication and management
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand,
  AdminUpdateUserAttributesCommand,
  GlobalSignOutCommand,
  AuthFlowType,
  ListUsersCommand,
  AdminGetUserCommand,
  AdminEnableUserCommand,
  AdminDisableUserCommand,
  AdminResetUserPasswordCommand,
  AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import { getCognitoConfig } from '../utils/config';
import {
  AuthenticationError,
  ConflictError,
  ValidationError,
  AuthErrorCodes,
  InternalServerError,
} from '../utils/errors';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  AuthTokens,
  CognitoUserAttributes,
  CognitoUserDetails,
  CognitoUserList,
} from '../types/auth.types';

/**
 * Decoded JWT payload structure for ID and access tokens
 */
interface DecodedJwtPayload {
  sub: string;
  email?: string;
  email_verified?: boolean | string;
  token_use?: 'id' | 'access';
  'custom:userId'?: string;
  'custom:username'?: string;
  'custom:role'?: string;
  [key: string]: any;
}

/**
 * Cognito service for authentication operations
 */
export class CognitoService {
  private readonly client: CognitoIdentityProviderClient;
  private readonly userPoolId: string;
  private readonly clientId: string;

  constructor() {
    const config = getCognitoConfig();
    this.userPoolId = config.userPoolId;
    this.clientId = config.clientId;

    this.client = new CognitoIdentityProviderClient({
      region: config.region,
    });
  }

  /**
   * Decode a JWT token without verifying the signature.
   * Used to detect token type (ID vs access) and extract claims.
   * Note: Signature verification is handled by API Gateway or should be done separately.
   */
  private decodeJwt(token: string): DecodedJwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('[CognitoService] Invalid JWT format - expected 3 parts');
        return null;
      }

      // Decode the payload (second part)
      const payload = parts[1];
      // Handle base64url encoding (replace - with +, _ with /)
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      // Pad with = if necessary
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const decoded = Buffer.from(padded, 'base64').toString('utf-8');
      return JSON.parse(decoded) as DecodedJwtPayload;
    } catch (error) {
      console.error('[CognitoService] Failed to decode JWT:', error);
      return null;
    }
  }

  /**
   * Check if a token is an ID token (vs access token)
   */
  private isIdToken(token: string): boolean {
    const payload = this.decodeJwt(token);
    return payload?.token_use === 'id';
  }

  /**
   * Register a new user with Cognito
   */
  async register(input: RegisterInput): Promise<{ cognitoSub: string; userConfirmed: boolean }> {
    try {
      // Step 1: Register user with only email attribute (custom attributes cannot be set during signup)
      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: input.email,
        Password: input.password,
        UserAttributes: [{ Name: 'email', Value: input.email }],
      });

      const response = await this.client.send(command);

      const cognitoSub = response.UserSub || '';
      const userConfirmed = response.UserConfirmed || false;

      // Step 2: Set custom attributes using admin command (required permissions)
      // These will be set after user is created in Cognito
      // Note: custom:username and custom:role will be set via updateUserAttributes after this returns

      return {
        cognitoSub,
        userConfirmed,
      };
    } catch (error: unknown) {
      // Log full error details for debugging
      console.error('[CognitoService] Registration error:', {
        errorName: (error as { name?: string }).name,
        errorCode: (error as { code?: string }).code,
        errorMessage: (error as { message?: string }).message,
        fullError: error,
      });
      this.handleCognitoError(error, 'Registration failed');
      /* istanbul ignore next */ throw error; // TypeScript requires this
    }
  }

  /**
   * Authenticate user and get tokens
   */
  async login(input: LoginInput): Promise<AuthTokens> {
    try {
      const command = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: input.email,
          PASSWORD: input.password,
        },
      });

      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        throw new AuthenticationError(
          'Authentication failed - no tokens returned',
          AuthErrorCodes.INVALID_CREDENTIALS
        );
      }

      return {
        accessToken: response.AuthenticationResult.AccessToken || '',
        refreshToken: response.AuthenticationResult.RefreshToken || '',
        idToken: response.AuthenticationResult.IdToken || '',
        expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
        tokenType: 'Bearer',
      };
    } catch (error: unknown) {
      this.handleCognitoError(error, 'Login failed');
      /* istanbul ignore next */ throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(input: RefreshTokenInput): Promise<AuthTokens> {
    try {
      const command = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        AuthParameters: {
          REFRESH_TOKEN: input.refreshToken,
        },
      });

      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        throw new AuthenticationError('Token refresh failed', AuthErrorCodes.INVALID_TOKEN);
      }

      return {
        accessToken: response.AuthenticationResult.AccessToken || '',
        refreshToken: input.refreshToken, // Refresh token doesn't change
        idToken: response.AuthenticationResult.IdToken || '',
        expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
        tokenType: 'Bearer',
      };
    } catch (error: unknown) {
      this.handleCognitoError(error, 'Token refresh failed');
      /* istanbul ignore next */ throw error;
    }
  }

  /**
   * Get user attributes from a token (supports both ID and access tokens).
   *
   * - ID tokens: Claims are decoded directly from the JWT (email, custom attributes are embedded)
   * - Access tokens: Uses Cognito GetUser API to fetch attributes
   *
   * This dual support allows the backend to work with:
   * - API Gateway authorizer (which uses ID tokens)
   * - Direct Cognito auth (which typically uses access tokens)
   */
  async getUserFromToken(token: string): Promise<CognitoUserAttributes> {
    // Check if this is an ID token - if so, decode claims directly
    if (this.isIdToken(token)) {
      const payload = this.decodeJwt(token);
      // istanbul ignore if - defensive code: isIdToken already validated decodeJwt succeeded
      if (!payload) {
        throw new AuthenticationError('Failed to decode ID token', AuthErrorCodes.INVALID_TOKEN);
      }

      console.info('[CognitoService] Extracting user attributes from ID token');

      const attributes: CognitoUserAttributes = {
        sub: payload.sub || '',
        email: payload.email || '',
      };

      // Handle email_verified which might be a string or boolean
      if (payload.email_verified !== undefined) {
        attributes.email_verified =
          payload.email_verified === true || payload.email_verified === 'true';
      }

      // Extract custom attributes from ID token claims
      if (payload['custom:userId']) attributes['custom:userId'] = payload['custom:userId'];
      if (payload['custom:username']) attributes['custom:username'] = payload['custom:username'];
      if (payload['custom:role']) attributes['custom:role'] = payload['custom:role'];

      return attributes;
    }

    // For access tokens, use Cognito GetUser API
    try {
      console.info('[CognitoService] Fetching user attributes via GetUser API (access token)');

      const command = new GetUserCommand({
        AccessToken: token,
      });

      const response = await this.client.send(command);

      const attributes: CognitoUserAttributes = {
        sub: '',
        email: '',
      };

      response.UserAttributes?.forEach((attr) => {
        if (attr.Name === 'sub') attributes.sub = attr.Value || '';
        if (attr.Name === 'email') attributes.email = attr.Value || '';
        if (attr.Name === 'email_verified') {
          attributes.email_verified = attr.Value === 'true';
        }
        if (attr.Name === 'custom:userId') attributes['custom:userId'] = attr.Value;
        if (attr.Name === 'custom:username') attributes['custom:username'] = attr.Value;
        if (attr.Name === 'custom:role') attributes['custom:role'] = attr.Value;
      });

      return attributes;
    } catch (error: unknown) {
      this.handleCognitoError(error, 'Failed to get user from token');
      /* istanbul ignore next */ throw error;
    }
  }

  /**
   * Confirm user signup with verification code
   */
  async confirmSignUp(email: string, confirmationCode: string): Promise<void> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
      });

      await this.client.send(command);
    } catch (error: unknown) {
      this.handleCognitoError(error, 'Confirmation failed');
    }
  }

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
      });

      await this.client.send(command);
    } catch (error: unknown) {
      this.handleCognitoError(error, 'Forgot password failed');
    }
  }

  /**
   * Confirm forgot password with code and new password
   */
  async confirmForgotPassword(
    email: string,
    confirmationCode: string,
    newPassword: string
  ): Promise<void> {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
      });

      await this.client.send(command);
    } catch (error: unknown) {
      this.handleCognitoError(error, 'Password reset failed');
    }
  }

  /**
   * Update user attributes (admin operation)
   */
  async updateUserAttributes(
    username: string,
    attributes: Array<{ Name: string; Value: string }>
  ): Promise<void> {
    try {
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        UserAttributes: attributes,
      });

      await this.client.send(command);
    } catch (error: unknown) {
      this.handleCognitoError(error, 'Failed to update user attributes');
    }
  }

  /**
   * Sign out user from all devices (invalidate all tokens)
   * Requires access token to identify the user session
   */
  async globalSignOut(accessToken: string): Promise<void> {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });

      await this.client.send(command);
    } catch (error: unknown) {
      // Log error but don't fail - client-side token clearing is still effective
      console.warn('[CognitoService] Global sign out failed:', error);
      // Don't throw - allow logout to complete even if Cognito sign out fails
    }
  }

  // ==================== Admin Operations ====================

  /**
   * Helper to extract attribute value from Cognito attribute list
   */
  private getAttributeValue(
    attributes: AttributeType[] | undefined,
    name: string
  ): string | undefined {
    return attributes?.find((attr) => attr.Name === name)?.Value;
  }

  /**
   * Helper to map Cognito user to CognitoUserDetails
   */
  private mapToCognitoUserDetails(
    user: {
      Username?: string;
      Attributes?: AttributeType[];
      Enabled?: boolean;
      UserStatus?: string;
      UserCreateDate?: Date;
      UserLastModifiedDate?: Date;
    },
    attributes?: AttributeType[]
  ): CognitoUserDetails {
    const attrs = attributes || user.Attributes;
    return {
      username: user.Username || '',
      email: this.getAttributeValue(attrs, 'email') || '',
      emailVerified: this.getAttributeValue(attrs, 'email_verified') === 'true',
      enabled: user.Enabled ?? true,
      userStatus: user.UserStatus || 'UNKNOWN',
      userCreateDate: user.UserCreateDate?.toISOString() || '',
      userLastModifiedDate: user.UserLastModifiedDate?.toISOString() || '',
      sub: this.getAttributeValue(attrs, 'sub') || '',
      customUserId: this.getAttributeValue(attrs, 'custom:userId'),
      customUsername: this.getAttributeValue(attrs, 'custom:username'),
      customRole: this.getAttributeValue(attrs, 'custom:role'),
    };
  }

  /**
   * List all users in the Cognito User Pool (admin operation)
   */
  async adminListUsers(paginationToken?: string, limit: number = 60): Promise<CognitoUserList> {
    try {
      const command = new ListUsersCommand({
        UserPoolId: this.userPoolId,
        Limit: Math.min(limit, 60), // Cognito max is 60
        PaginationToken: paginationToken,
      });

      const response = await this.client.send(command);

      const users: CognitoUserDetails[] =
        response.Users?.map((user) => this.mapToCognitoUserDetails(user)) || [];

      return {
        users,
        paginationToken: response.PaginationToken,
      };
    } catch (error: unknown) {
      this.handleCognitoError(error, 'Failed to list users');
      /* istanbul ignore next */ throw error;
    }
  }

  /**
   * Get a specific user from Cognito (admin operation)
   */
  async adminGetUser(username: string): Promise<CognitoUserDetails> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      const response = await this.client.send(command);

      return this.mapToCognitoUserDetails(
        {
          Username: response.Username,
          Enabled: response.Enabled,
          UserStatus: response.UserStatus,
          UserCreateDate: response.UserCreateDate,
          UserLastModifiedDate: response.UserLastModifiedDate,
        },
        response.UserAttributes
      );
    } catch (error: unknown) {
      this.handleCognitoError(error, 'Failed to get user');
      /* istanbul ignore next */ throw error;
    }
  }

  /**
   * Enable a user in Cognito (admin operation)
   */
  async adminEnableUser(username: string): Promise<void> {
    try {
      const command = new AdminEnableUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      await this.client.send(command);
      console.info(`[CognitoService] User enabled: ${username}`);
    } catch (error: unknown) {
      this.handleCognitoError(error, 'Failed to enable user');
    }
  }

  /**
   * Disable a user in Cognito (admin operation)
   */
  async adminDisableUser(username: string): Promise<void> {
    try {
      const command = new AdminDisableUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      await this.client.send(command);
      console.info(`[CognitoService] User disabled: ${username}`);
    } catch (error: unknown) {
      this.handleCognitoError(error, 'Failed to disable user');
    }
  }

  /**
   * Reset a user's password in Cognito (admin operation)
   * This sends a password reset email to the user
   */
  async adminResetUserPassword(username: string): Promise<void> {
    try {
      const command = new AdminResetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      await this.client.send(command);
      console.info(`[CognitoService] Password reset initiated for user: ${username}`);
    } catch (error: unknown) {
      this.handleCognitoError(error, 'Failed to reset user password');
    }
  }

  /**
   * Handle Cognito-specific errors and convert to application errors
   */
  private handleCognitoError(error: unknown, defaultMessage: string): never {
    const errorCode =
      (error as { name?: string; code?: string }).name ||
      (error as { name?: string; code?: string }).code;
    const errorMessage = (error as { message?: string }).message || defaultMessage;

    switch (errorCode) {
      case 'UsernameExistsException':
        throw new ConflictError(
          'An account with this email already exists',
          AuthErrorCodes.EMAIL_ALREADY_EXISTS
        );

      case 'InvalidPasswordException':
        throw new ValidationError(
          'Password does not meet requirements',
          undefined,
          AuthErrorCodes.PASSWORD_TOO_WEAK
        );

      case 'NotAuthorizedException':
        // Cognito returns "User is disabled" message when a disabled user tries to authenticate
        if (errorMessage.includes('User is disabled')) {
          throw new AuthenticationError(
            'Your account has been disabled',
            AuthErrorCodes.ACCOUNT_DISABLED
          );
        }
        throw new AuthenticationError(
          'Invalid email or password',
          AuthErrorCodes.INVALID_CREDENTIALS
        );

      case 'UserNotFoundException':
        // Use generic message to prevent user enumeration attacks
        console.error('[CognitoService] User not found in Cognito');
        throw new AuthenticationError(
          'Invalid email or password',
          AuthErrorCodes.INVALID_CREDENTIALS
        );

      case 'UserNotConfirmedException':
        throw new AuthenticationError('Email not verified', AuthErrorCodes.EMAIL_NOT_VERIFIED);

      case 'InvalidParameterException':
        throw new ValidationError(errorMessage);

      case 'TooManyRequestsException':
        throw new AuthenticationError(
          'Too many attempts, please try again later',
          AuthErrorCodes.TOO_MANY_ATTEMPTS
        );

      case 'ExpiredCodeException':
        throw new ValidationError('Verification code has expired');

      case 'CodeMismatchException':
        throw new ValidationError('Invalid verification code');

      case 'LimitExceededException':
        console.error('[CognitoService] Cognito daily email limit exceeded');
        throw new InternalServerError('Cognito Daily Email Limit Exceeded');

      default:
        // Enhanced logging for unhandled Cognito errors to help diagnose issues
        console.error('[CognitoService] UNHANDLED Cognito error:', {
          operation: defaultMessage,
          errorCode,
          errorMessage,
          errorName: (error as { name?: string }).name,
          errorType: (error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
        });
        throw new InternalServerError(defaultMessage);
    }
  }
}
