import { renderHook, waitFor, act } from "@testing-library/react";
import { useAuth } from "./use-auth";
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
import { tokenManager } from "@/lib/api/client";
import { UserRole } from "@/types/api.types";
import type { AuthUser, AuthResponse } from "@/types/api.types";

// Mock API functions
jest.mock("@/lib/api/endpoints/auth", () => ({
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
  getMe: jest.fn(),
  confirmSignUp: jest.fn(),
  forgotPassword: jest.fn(),
  confirmForgotPassword: jest.fn(),
}));

// Mock tokenManager and getErrorMessage
jest.mock("@/lib/api/client", () => ({
  tokenManager: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    clearTokens: jest.fn(),
    isTokenExpired: jest.fn(),
  },
  getErrorMessage: jest.fn((error: unknown) => {
    // Mimic the real getErrorMessage behavior for tests
    if (error instanceof Error) {
      return error.message;
    }
    return "An unexpected error occurred";
  }),
}));

const mockApiLogin = apiLogin as jest.MockedFunction<typeof apiLogin>;
const mockApiRegister = apiRegister as jest.MockedFunction<typeof apiRegister>;
const mockApiLogout = apiLogout as jest.MockedFunction<typeof apiLogout>;
const mockApiRefreshToken = apiRefreshToken as jest.MockedFunction<
  typeof apiRefreshToken
>;
const mockGetMe = getMe as jest.MockedFunction<typeof getMe>;
const mockApiConfirmSignUp = apiConfirmSignUp as jest.MockedFunction<
  typeof apiConfirmSignUp
>;
const mockApiForgotPassword = apiForgotPassword as jest.MockedFunction<
  typeof apiForgotPassword
>;
const mockApiConfirmForgotPassword =
  apiConfirmForgotPassword as jest.MockedFunction<
    typeof apiConfirmForgotPassword
  >;

const mockTokenManager = tokenManager as jest.Mocked<typeof tokenManager>;

describe("useAuth", () => {
  const mockUser: AuthUser = {
    userId: "user-123",
    email: "test@example.com",
    username: "testuser",
    role: UserRole.USER,
    createdAt: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // By default, tokens are not expired
    mockTokenManager.isTokenExpired.mockReturnValue(false);
  });

  describe("Initial State and checkAuth", () => {
    it("starts with loading state and transitions to unauthenticated", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      // Hook starts with loading true, then checkAuth runs and sets it to false
      // We verify the transition completes
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it("sets unauthenticated when no tokens present", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockGetMe).not.toHaveBeenCalled();
    });

    it("fetches user when access token is present", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("valid-access-token");
      mockTokenManager.getRefreshToken.mockReturnValue("valid-refresh-token");
      mockGetMe.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(mockGetMe).toHaveBeenCalledTimes(1);
    });

    it("refreshes token when getMe fails but refresh token exists", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("expired-access-token");
      mockTokenManager.getRefreshToken.mockReturnValue("valid-refresh-token");
      mockGetMe
        .mockRejectedValueOnce(new Error("Token expired"))
        .mockResolvedValue(mockUser);
      mockApiRefreshToken.mockResolvedValue({
        accessToken: "new-access-token",
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(mockApiRefreshToken).toHaveBeenCalledWith({
        refreshToken: "valid-refresh-token",
      });
      expect(mockGetMe).toHaveBeenCalledTimes(2);
    });

    it("clears tokens when refresh fails", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("expired-access-token");
      mockTokenManager.getRefreshToken.mockReturnValue("expired-refresh-token");
      mockGetMe.mockRejectedValue(new Error("Token expired"));
      mockApiRefreshToken.mockRejectedValue(new Error("Refresh failed"));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
    });

    it("clears tokens when getMe fails and no refresh token", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("invalid-access-token");
      mockTokenManager.getRefreshToken.mockReturnValue(null);
      mockGetMe.mockRejectedValue(new Error("Unauthorized"));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
      expect(mockApiRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("successfully logs in user", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);

      const loginResponse: AuthResponse = {
        user: mockUser,
        tokens: {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
          expiresIn: 900,
        },
      };
      mockApiLogin.mockResolvedValue(loginResponse);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({
          email: "test@example.com",
          password: "password123",
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBeNull();
      expect(mockApiLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("sets error state when login fails", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);

      const loginError = new Error("Invalid credentials");
      mockApiLogin.mockRejectedValue(loginError);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.login({
            email: "test@example.com",
            password: "wrong",
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe("Invalid credentials");
    });

    it("handles non-Error objects in login failure", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);

      mockApiLogin.mockRejectedValue("Unknown error");

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.login({
            email: "test@example.com",
            password: "wrong",
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe("An unexpected error occurred");
    });
  });

  describe("register", () => {
    it("successfully registers user", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);

      const registerResponse: AuthResponse = {
        user: mockUser,
        tokens: {
          accessToken: "",
          refreshToken: "",
          expiresIn: 0,
        },
        requiresEmailConfirmation: true,
      };
      mockApiRegister.mockResolvedValue(registerResponse);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.register({
          email: "test@example.com",
          password: "password123",
          username: "testuser",
          role: UserRole.USER,
        });
      });

      // When requiresEmailConfirmation is true, user is NOT authenticated
      // They must confirm their email first
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.error).toBeNull();
      expect(mockApiRegister).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        username: "testuser",
        role: UserRole.USER,
      });
    });

    it("sets error state when registration fails", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);

      const registrationError = new Error("Email already exists");
      mockApiRegister.mockRejectedValue(registrationError);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.register({
            email: "test@example.com",
            password: "password123",
            username: "testuser",
            role: UserRole.USER,
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe("Email already exists");
    });

    it("handles non-Error objects in registration failure", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);

      mockApiRegister.mockRejectedValue("Unknown error");

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.register({
            email: "test@example.com",
            password: "password123",
            username: "testuser",
            role: UserRole.USER,
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe("An unexpected error occurred");
    });
  });

  describe("logout", () => {
    it("successfully logs out user", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("valid-access-token");
      mockTokenManager.getRefreshToken.mockReturnValue("valid-refresh-token");
      mockGetMe.mockResolvedValue(mockUser);
      mockApiLogout.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
      expect(mockApiLogout).toHaveBeenCalled();
    });

    it("clears state even when logout API fails", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("valid-access-token");
      mockTokenManager.getRefreshToken.mockReturnValue("valid-refresh-token");
      mockGetMe.mockResolvedValue(mockUser);
      mockApiLogout.mockRejectedValue(new Error("Logout failed"));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe("refreshToken", () => {
    it("successfully refreshes token and reloads user", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("valid-access-token");
      mockTokenManager.getRefreshToken.mockReturnValue("valid-refresh-token");
      mockGetMe.mockResolvedValue(mockUser);
      mockApiRefreshToken.mockResolvedValue({
        accessToken: "new-access-token",
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      mockGetMe.mockClear();

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(mockApiRefreshToken).toHaveBeenCalledWith({
        refreshToken: "valid-refresh-token",
      });
      expect(mockGetMe).toHaveBeenCalled();
    });

    it("throws error when no refresh token available", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.refreshToken();
        }),
      ).rejects.toThrow("No refresh token available");
    });

    it("clears tokens and sets error when refresh fails", async () => {
      mockTokenManager.getAccessToken.mockReturnValue("valid-access-token");
      mockTokenManager.getRefreshToken.mockReturnValue("expired-refresh-token");
      mockGetMe.mockResolvedValue(mockUser);
      mockApiRefreshToken.mockRejectedValue(new Error("Refresh failed"));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        try {
          await result.current.refreshToken();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe("Session expired. Please login again.");
      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
    });
  });

  describe("confirmSignUp", () => {
    it("successfully confirms signup", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);
      mockApiConfirmSignUp.mockResolvedValue({ message: "Email confirmed" });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.confirmSignUp({
          email: "test@example.com",
          confirmationCode: "123456",
        });
      });

      expect(result.current.error).toBeNull();
      expect(mockApiConfirmSignUp).toHaveBeenCalledWith({
        email: "test@example.com",
        confirmationCode: "123456",
      });
    });

    it("sets error when confirmation fails", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);
      mockApiConfirmSignUp.mockRejectedValue(new Error("Invalid code"));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.confirmSignUp({
            email: "test@example.com",
            confirmationCode: "wrong",
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe("Invalid code");
    });

    it("handles non-Error objects in confirmation failure", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);
      mockApiConfirmSignUp.mockRejectedValue("Unknown error");

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.confirmSignUp({
            email: "test@example.com",
            confirmationCode: "123456",
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe("An unexpected error occurred");
    });
  });

  describe("forgotPassword", () => {
    it("successfully requests password reset", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);
      mockApiForgotPassword.mockResolvedValue({ message: "Reset code sent" });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.forgotPassword({ email: "test@example.com" });
      });

      expect(result.current.error).toBeNull();
      expect(mockApiForgotPassword).toHaveBeenCalledWith({
        email: "test@example.com",
      });
    });

    it("sets error when password reset request fails", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);
      mockApiForgotPassword.mockRejectedValue(new Error("User not found"));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.forgotPassword({
            email: "nonexistent@example.com",
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe("User not found");
    });

    it("handles non-Error objects in forgot password failure", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);
      mockApiForgotPassword.mockRejectedValue("Unknown error");

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.forgotPassword({ email: "test@example.com" });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe("An unexpected error occurred");
    });
  });

  describe("confirmForgotPassword", () => {
    it("successfully confirms password reset", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);
      mockApiConfirmForgotPassword.mockResolvedValue({
        message: "Password reset successful",
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.confirmForgotPassword({
          email: "test@example.com",
          code: "123456",
          newPassword: "newPassword123",
        });
      });

      expect(result.current.error).toBeNull();
      expect(mockApiConfirmForgotPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        code: "123456",
        newPassword: "newPassword123",
      });
    });

    it("sets error when password reset confirmation fails", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);
      mockApiConfirmForgotPassword.mockRejectedValue(new Error("Invalid code"));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.confirmForgotPassword({
            email: "test@example.com",
            code: "wrong",
            newPassword: "newPassword123",
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe("Invalid code");
    });

    it("handles non-Error objects in confirm forgot password failure", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);
      mockApiConfirmForgotPassword.mockRejectedValue("Unknown error");

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.confirmForgotPassword({
            email: "test@example.com",
            code: "123456",
            newPassword: "newPassword123",
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe("An unexpected error occurred");
    });
  });

  describe("clearError", () => {
    it("clears error state", async () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue(null);
      mockApiLogin.mockRejectedValue(new Error("Login failed"));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger an error
      await act(async () => {
        try {
          await result.current.login({
            email: "test@example.com",
            password: "wrong",
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe("Login failed");

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
