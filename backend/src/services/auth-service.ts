/**
 * Authentication service orchestrating Cognito and user repository operations
 */

import { CognitoService } from './cognito-service';
import { UserRepository } from '../repositories/user-repository';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  RegisterResponse,
  LoginResponse,
  RefreshTokenResponse,
  AuthContext,
} from '../types/auth.types';
import { UserRole, AccountStatus } from '../types/dynamodb.types';
import { ConflictError, AuthErrorCodes, NotFoundError, AuthenticationError } from '../utils/errors';

/**
 * Authentication service
 */
export class AuthService {
  private readonly cognitoService: CognitoService;
  private readonly userRepository: UserRepository;

  constructor(userRepository?: UserRepository, cognitoService?: CognitoService) {
    this.userRepository = userRepository || new UserRepository();
    this.cognitoService = cognitoService || new CognitoService();
  }

  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<RegisterResponse> {
    const registrationId = `reg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    console.info('[AuthService] Starting registration', {
      registrationId,
      email: input.email,
      username: input.username,
      role: input.role,
    });

    try {
      // Step 1: Check if email already exists in DynamoDB
      console.info('[AuthService] Step 1: Checking email existence', { registrationId });
      const existingEmail = await this.userRepository.emailExists(input.email);
      if (existingEmail) {
        console.info('[AuthService] Registration failed: Email already exists', { registrationId });
        throw new ConflictError(
          'An account with this email already exists',
          AuthErrorCodes.EMAIL_ALREADY_EXISTS
        );
      }

      // Step 2: Check if username already exists
      console.info('[AuthService] Step 2: Checking username existence', { registrationId });
      const existingUsername = await this.userRepository.usernameExists(input.username);
      if (existingUsername) {
        console.info('[AuthService] Registration failed: Username already exists', {
          registrationId,
        });
        throw new ConflictError(
          'This username is already taken',
          AuthErrorCodes.USERNAME_ALREADY_EXISTS
        );
      }

      // Step 3: Register with Cognito
      console.info('[AuthService] Step 3: Registering with Cognito', { registrationId });
      const { cognitoSub, userConfirmed } = await this.cognitoService.register(input);
      console.info('[AuthService] Step 3 complete: Cognito registration successful', {
        registrationId,
        cognitoSub,
        userConfirmed,
      });

      // Step 4: Create user profile in DynamoDB
      console.info('[AuthService] Step 4: Creating DynamoDB user profile', { registrationId });
      const userProfile = await this.userRepository.createUser({
        email: input.email,
        username: input.username,
        role: input.role || UserRole.USER,
        cognitoSub,
      });
      console.info('[AuthService] Step 4 complete: DynamoDB profile created', {
        registrationId,
        userId: userProfile.UserId,
      });

      // Step 5: Update Cognito custom attributes with our user ID and username
      // NOTE: These cannot be set during SignUp, must be set via AdminUpdateUserAttributes
      // NOTE: Role is stored only in DynamoDB (single source of truth)
      console.info('[AuthService] Step 5: Updating Cognito custom attributes', { registrationId });
      await this.cognitoService.updateUserAttributes(input.email, [
        { Name: 'custom:userId', Value: userProfile.UserId },
        { Name: 'custom:username', Value: input.username },
      ]);
      console.info('[AuthService] Step 5 complete: Cognito attributes updated', { registrationId });

      // Step 6: Auto-login if user is already confirmed (e.g., admin-created accounts)
      // For normal signups, user must confirm email first before logging in
      let tokens = undefined;
      if (userConfirmed) {
        console.info('[AuthService] Step 6: Auto-login (user pre-confirmed)', { registrationId });
        tokens = await this.cognitoService.login({
          email: input.email,
          password: input.password,
        });
        console.info('[AuthService] Step 6 complete: Auto-login successful', { registrationId });
      }

      console.info('[AuthService] Registration complete', {
        registrationId,
        userId: userProfile.UserId,
        requiresEmailConfirmation: !userConfirmed,
      });

      return {
        user: {
          userId: userProfile.UserId,
          email: userProfile.Email,
          username: userProfile.Username,
          role: userProfile.Role,
          createdAt: userProfile.CreatedAt,
        },
        tokens: tokens || {
          accessToken: '',
          refreshToken: '',
          idToken: '',
          expiresIn: 0,
          tokenType: 'Bearer',
        },
        requiresEmailConfirmation: !userConfirmed,
      };
    } catch (error) {
      // Log the error with full context for debugging
      console.error('[AuthService] Registration failed with error', {
        registrationId,
        errorName: (error as Error).name,
        errorMessage: (error as Error).message,
        errorStack: (error as Error).stack,
        fullError: error,
      });
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<LoginResponse> {
    try {
      // Authenticate with Cognito
      const tokens = await this.cognitoService.login(input);

      // Get user info from Cognito
      const cognitoUser = await this.cognitoService.getUserFromToken(tokens.accessToken);

      // Get user profile from DynamoDB
      let userProfile = await this.userRepository.getUserByCognitoSub(cognitoUser.sub);

      // If no profile found by Cognito sub, try by email
      if (!userProfile) {
        userProfile = await this.userRepository.getUserByEmail(input.email);
      }

      if (!userProfile) {
        // Log the actual error for debugging
        console.error('[AuthService] Login failed: User profile not found in DynamoDB', {
          cognitoSub: cognitoUser.sub,
          email: input.email,
        });

        // Throw generic error to user (security: don't reveal system details)
        throw new AuthenticationError(
          'Invalid email or password',
          AuthErrorCodes.INVALID_CREDENTIALS
        );
      }

      return {
        user: {
          userId: userProfile.UserId,
          email: userProfile.Email,
          username: userProfile.Username,
          role: userProfile.Role,
          createdAt: userProfile.CreatedAt,
        },
        tokens,
      };
    } catch (error) {
      // If it's already an AuthenticationError, pass it through
      if (error instanceof AuthenticationError) {
        throw error;
      }

      // Log unexpected errors for debugging
      console.error('[AuthService] Login failed with unexpected error:', error);

      // Return generic error to user
      throw new AuthenticationError(
        'Invalid email or password',
        AuthErrorCodes.INVALID_CREDENTIALS
      );
    }
  }

  /**
   * Refresh authentication tokens and update user activity
   */
  async refreshToken(input: RefreshTokenInput): Promise<RefreshTokenResponse> {
    const tokens = await this.cognitoService.refreshToken(input);

    // Update user's last active timestamp before returning response
    try {
      await this.updateUserActivity(tokens.idToken);
    } catch (error) {
      console.warn('[AuthService] Failed to update user activity:', error);
    }

    return tokens;
  }

  /**
   * Extract userId from ID token and update LastActiveAt
   */
  private async updateUserActivity(idToken: string): Promise<void> {
    const payload = this.decodeJwtPayload(idToken);
    const userId = payload?.['custom:userId'];

    if (typeof userId !== 'string' || !userId) {
      console.warn('[AuthService] No userId in ID token, skipping activity update');
      return;
    }

    await this.userRepository.updateLastActive(userId);
    console.info('[AuthService] Updated LastActiveAt for user', { userId });
  }

  /**
   * Decode JWT payload without signature verification
   */
  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const decoded = Buffer.from(padded, 'base64').toString('utf-8');
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  /**
   * Get authentication context from access token
   */
  async getAuthContext(accessToken: string): Promise<AuthContext> {
    // Get user from Cognito
    const cognitoUser = await this.cognitoService.getUserFromToken(accessToken);

    // Get user profile from DynamoDB
    let userProfile = await this.userRepository.getUserByCognitoSub(cognitoUser.sub);

    if (!userProfile) {
      userProfile = await this.userRepository.getUserByEmail(cognitoUser.email);
    }

    if (!userProfile) {
      throw new NotFoundError('User profile not found', AuthErrorCodes.USER_NOT_FOUND);
    }

    // Block disabled users from accessing the API
    if (userProfile.AccountStatus === AccountStatus.DISABLED) {
      throw new AuthenticationError(
        'Your account has been disabled',
        AuthErrorCodes.ACCOUNT_DISABLED
      );
    }

    return {
      userId: userProfile.UserId,
      email: userProfile.Email,
      username: userProfile.Username,
      role: userProfile.Role,
      cognitoSub: userProfile.CognitoSub,
      isAuthenticated: true,
      lastActiveAt: userProfile.LastActiveAt,
    };
  }

  /**
   * Logout user and invalidate Cognito session
   * Calls Cognito GlobalSignOut to invalidate all refresh tokens for this user
   */
  async logout(accessToken: string): Promise<void> {
    // Sign out from Cognito (invalidates all refresh tokens)
    await this.cognitoService.globalSignOut(accessToken);

    // Note: Client must also clear tokens from localStorage/memory
    // This is done on the frontend side
  }

  /**
   * Confirm user signup
   */
  async confirmSignUp(email: string, confirmationCode: string): Promise<void> {
    await this.cognitoService.confirmSignUp(email, confirmationCode);
  }

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(email: string): Promise<void> {
    await this.cognitoService.forgotPassword(email);
  }

  /**
   * Confirm forgot password
   */
  async confirmForgotPassword(
    email: string,
    confirmationCode: string,
    newPassword: string
  ): Promise<void> {
    await this.cognitoService.confirmForgotPassword(email, confirmationCode, newPassword);
  }
}
