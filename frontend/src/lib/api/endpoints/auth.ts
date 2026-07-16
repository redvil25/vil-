import apiClient, { tokenManager } from "../client";
import type {
  APIResponse,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  ConfirmSignUpRequest,
  ForgotPasswordRequest,
  ConfirmForgotPasswordRequest,
  AuthUser,
} from "@/types/api.types";

/**
 * Register a new user account
 * Note: In Cognito mode (staging/prod), tokens should NOT be stored until email is confirmed
 * In dev mode (mock auth), tokens are stored immediately since user is authenticated
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<APIResponse<AuthResponse>>(
    "/auth/register",
    data,
  );
  const authData = response.data.data;

  // Only store tokens if user doesn't require email confirmation
  // In Cognito mode, requiresEmailConfirmation will be true and tokens will be empty
  // In dev mode (mock auth), requiresEmailConfirmation will be false/undefined and tokens are valid
  if (!authData.requiresEmailConfirmation && authData.tokens.accessToken) {
    tokenManager.setAccessToken(authData.tokens.accessToken);
    // Store ID token for API Gateway Cognito authorizer (required for protected routes)
    if (authData.tokens.idToken) {
      tokenManager.setIdToken(authData.tokens.idToken);
    }
    tokenManager.setRefreshToken(authData.tokens.refreshToken);
  }

  return authData;
}

/**
 * Login with email and password
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<APIResponse<AuthResponse>>(
    "/auth/login",
    data,
  );
  const authData = response.data.data;

  // Store tokens
  tokenManager.setAccessToken(authData.tokens.accessToken);
  // Store ID token for API Gateway Cognito authorizer (required for protected routes)
  if (authData.tokens.idToken) {
    tokenManager.setIdToken(authData.tokens.idToken);
  }
  tokenManager.setRefreshToken(authData.tokens.refreshToken);

  return authData;
}

/**
 * Refresh access token
 * Note: Cognito refresh also returns a new ID token
 */
export async function refreshToken(
  data: RefreshTokenRequest,
): Promise<{ accessToken: string; idToken?: string }> {
  const response = await apiClient.post<
    APIResponse<{ accessToken: string; idToken?: string }>
  >("/auth/refresh", data);
  const tokens = response.data.data;

  // Update access token
  tokenManager.setAccessToken(tokens.accessToken);
  // Update ID token for API Gateway Cognito authorizer
  if (tokens.idToken) {
    tokenManager.setIdToken(tokens.idToken);
  }

  return tokens;
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  console.log("[auth] logout - Starting logout process");
  try {
    // Call backend logout endpoint (triggers Cognito GlobalSignOut in staging/prod)
    await apiClient.post("/auth/logout");
    console.log("[auth] logout - Backend logout successful");
  } catch (error) {
    // Log error but don't throw - we still want to clear local tokens
    console.error(
      "[auth] logout - Backend logout failed (will still clear local tokens):",
      error,
    );
  } finally {
    // Always clear tokens, even if API call fails
    console.log("[auth] logout - Clearing local tokens");
    tokenManager.clearTokens();
    console.log("[auth] logout - Logout complete");
  }
}

/**
 * Confirm email verification code
 */
export async function confirmSignUp(
  data: ConfirmSignUpRequest,
): Promise<{ message: string }> {
  const response = await apiClient.post<APIResponse<{ message: string }>>(
    "/auth/confirm-signup",
    data,
  );
  return response.data.data;
}

/**
 * Initiate forgot password flow
 */
export async function forgotPassword(
  data: ForgotPasswordRequest,
): Promise<{ message: string }> {
  const response = await apiClient.post<APIResponse<{ message: string }>>(
    "/auth/forgot-password",
    data,
  );
  return response.data.data;
}

/**
 * Confirm forgot password with code
 */
export async function confirmForgotPassword(
  data: ConfirmForgotPasswordRequest,
): Promise<{ message: string }> {
  const response = await apiClient.post<APIResponse<{ message: string }>>(
    "/auth/confirm-forgot-password",
    data,
  );
  return response.data.data;
}

/**
 * Get current authenticated user
 */
export async function getMe(): Promise<AuthUser> {
  const response = await apiClient.get<APIResponse<AuthUser>>("/me");
  return response.data.data;
}

// Export as object for convenience
export const authAPI = {
  register,
  login,
  refreshToken,
  logout,
  confirmSignUp,
  forgotPassword,
  confirmForgotPassword,
  getMe,
};
