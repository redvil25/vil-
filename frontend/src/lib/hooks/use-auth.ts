"use client";

import { useState, useCallback, useEffect } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  refreshToken as apiRefreshToken,
  getMe,
  confirmSignUp as apiConfirmSignUp,
  forgotPassword as apiForgotPassword,
  confirmForgotPassword as apiConfirmForgotPassword,
} from "@/lib/api/endpoints/auth";
import { tokenManager, getErrorMessage } from "@/lib/api/client";
import type {
  AuthUser,
  LoginRequest,
  RegisterRequest,
  ConfirmSignUpRequest,
  ForgotPasswordRequest,
  ConfirmForgotPasswordRequest,
} from "@/types/api.types";

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  login: (credentials: LoginRequest) => Promise<AuthUser>;
  register: (
    data: RegisterRequest,
  ) => Promise<{ requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  confirmSignUp: (data: ConfirmSignUpRequest) => Promise<void>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<void>;
  confirmForgotPassword: (data: ConfirmForgotPasswordRequest) => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

/**
 * Custom hook for authentication operations
 *
 * Manages authentication state and provides methods for:
 * - Login/logout
 * - User registration
 * - Token refresh
 * - Password reset
 * - Email confirmation
 *
 * @example
 * ```tsx
 * const { user, login, logout, isLoading } = useAuth();
 *
 * const handleLogin = async (email: string, password: string) => {
 *   await login({ email, password });
 * };
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Check if user is authenticated and load user data
   */
  const checkAuth = useCallback(async () => {
    // Always use token-based authentication (backend handles mock vs real Cognito)
    const accessToken = tokenManager.getAccessToken();
    const refreshTokenValue = tokenManager.getRefreshToken();

    console.log("[useAuth] checkAuth - Initial state:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshTokenValue,
      accessTokenExpired: accessToken
        ? tokenManager.isTokenExpired(accessToken)
        : null,
    });

    // No tokens at all - user is not authenticated
    if (!accessToken && !refreshTokenValue) {
      console.log(
        "[useAuth] checkAuth - No tokens found, setting unauthenticated",
      );
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Check if access token is expired (if it exists)
    const accessTokenExpired = accessToken
      ? tokenManager.isTokenExpired(accessToken)
      : true;

    // If we have a refresh token but no access token OR access token is expired, refresh first
    if ((!accessToken || accessTokenExpired) && refreshTokenValue) {
      console.log(
        "[useAuth] checkAuth - Access token missing or expired, refreshing...",
        {
          hasAccessToken: !!accessToken,
          accessTokenExpired,
        },
      );
      try {
        const { accessToken: newAccessToken } = await apiRefreshToken({
          refreshToken: refreshTokenValue,
        });
        // Verify the new access token was set
        if (!newAccessToken) {
          throw new Error("Token refresh did not return an access token");
        }
        console.log("[useAuth] checkAuth - Token refreshed successfully");
        // After refresh, get user data with the new token
        const user = await getMe();
        console.log("[useAuth] checkAuth - User data loaded after refresh:", {
          userId: user.userId,
          role: user.role,
        });
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (refreshError) {
        // Refresh failed, clear tokens and set unauthenticated
        console.error(
          "[useAuth] checkAuth - Token refresh failed:",
          refreshError,
        );
        tokenManager.clearTokens();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
      return;
    }

    // Access token exists and is valid, try to get user data
    try {
      console.log(
        "[useAuth] checkAuth - Getting user data with valid access token",
      );
      const user = await getMe();
      console.log("[useAuth] checkAuth - User data loaded:", {
        userId: user.userId,
        role: user.role,
      });
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("[useAuth] checkAuth - getMe failed:", {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
      });
      // If getMe fails and we have a refresh token, try refreshing
      if (refreshTokenValue) {
        try {
          console.log(
            "[useAuth] checkAuth - Attempting token refresh after getMe failure",
          );
          await apiRefreshToken({ refreshToken: refreshTokenValue });
          // Retry getting user after refresh
          const user = await getMe();
          console.log("[useAuth] checkAuth - User data loaded after retry:", {
            userId: user.userId,
            role: user.role,
          });
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (refreshError) {
          // Refresh failed, clear tokens and set unauthenticated
          console.error(
            "[useAuth] checkAuth - Token refresh failed on retry:",
            refreshError,
          );
          tokenManager.clearTokens();
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } else {
        // No refresh token, clear everything
        console.log(
          "[useAuth] checkAuth - No refresh token available, clearing tokens",
        );
        tokenManager.clearTokens();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    }
  }, []);

  /**
   * Login with email and password
   * Returns the authenticated user object for immediate use (e.g., for redirects)
   */
  const login = useCallback(
    async (credentials: LoginRequest): Promise<AuthUser> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Always call the backend API (which uses MockAuthService in E2E dev mode)
        const response = await apiLogin(credentials);

        setState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return response.user;
      } catch (error) {
        console.error("[useAuth] login - Login failed", error);
        const errorMessage = getErrorMessage(error);
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: errorMessage,
        });
        throw error;
      }
    },
    [],
  );

  /**
   * Register a new user account
   * Returns whether email confirmation is required
   * Note: In Cognito (staging/prod), user is NOT authenticated until email is confirmed
   * In dev mode with mock auth, user is authenticated immediately
   */
  const register = useCallback(
    async (
      data: RegisterRequest,
    ): Promise<{ requiresEmailConfirmation: boolean }> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await apiRegister(data);
        const requiresEmailConfirmation =
          response.requiresEmailConfirmation ?? false;

        setState({
          user: response.user,
          // Only authenticate if email confirmation is NOT required
          // In Cognito mode: requiresEmailConfirmation = true -> not authenticated
          // In dev mode (mock auth): requiresEmailConfirmation = false/undefined -> authenticated
          isAuthenticated: !requiresEmailConfirmation,
          isLoading: false,
          error: null,
        });

        return { requiresEmailConfirmation };
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: errorMessage,
        });
        throw error;
      }
    },
    [],
  );

  /**
   * Logout current user
   */
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await apiLogout();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Even if logout API fails, clear local state
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  /**
   * Refresh authentication token
   */
  const refreshToken = useCallback(async () => {
    const refreshTokenValue = tokenManager.getRefreshToken();
    if (!refreshTokenValue) {
      throw new Error("No refresh token available");
    }

    try {
      await apiRefreshToken({ refreshToken: refreshTokenValue });
      // After successful refresh, reload user data
      await checkAuth();
    } catch (error) {
      // Refresh failed, clear auth state
      tokenManager.clearTokens();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Session expired. Please login again.",
      });
      throw error;
    }
  }, [checkAuth]);

  /**
   * Confirm user signup with verification code
   */
  const confirmSignUp = useCallback(async (data: ConfirmSignUpRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await apiConfirmSignUp(data);
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Request password reset
   */
  const forgotPassword = useCallback(async (data: ForgotPasswordRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await apiForgotPassword(data);
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Confirm password reset with verification code
   */
  const confirmForgotPassword = useCallback(
    async (data: ConfirmForgotPasswordRequest) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        await apiConfirmForgotPassword(data);
        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    [],
  );

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    confirmSignUp,
    forgotPassword,
    confirmForgotPassword,
    clearError,
    checkAuth,
  };
}
