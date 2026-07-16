import type { AuthResponse, AuthUser } from "@/types/api.types";
import { UserRole } from "@/types/api.types";

// Mock secure storage
jest.mock("@/lib/auth/secure-storage", () => ({
  secureStorage: {
    setAccessToken: jest.fn(),
    setIdToken: jest.fn(),
    setRefreshToken: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

// Mock apiClient with tokenManager
jest.mock("../client", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
  tokenManager: {
    setAccessToken: jest.fn(),
    setIdToken: jest.fn(),
    setRefreshToken: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

// Import after mocking
import {
  authAPI,
  register,
  login,
  logout,
  refreshToken,
  confirmSignUp,
  forgotPassword,
  confirmForgotPassword,
  getMe,
} from "./auth";
import apiClient, { tokenManager } from "../client";

const mockPost = apiClient.post as jest.Mock;
const mockGet = apiClient.get as jest.Mock;
const mockSetAccessToken = tokenManager.setAccessToken as jest.Mock;
const mockSetIdToken = tokenManager.setIdToken as jest.Mock;
const mockSetRefreshToken = tokenManager.setRefreshToken as jest.Mock;
const mockClearTokens = tokenManager.clearTokens as jest.Mock;

describe("Auth API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAuthResponse: AuthResponse = {
    user: {
      userId: "user-123",
      email: "test@example.com",
      username: "testuser",
      role: UserRole.USER,
      createdAt: "2024-01-01T00:00:00Z",
    },
    tokens: {
      accessToken: "access-token",
      refreshToken: "refresh-token",
      idToken: "id-token",
      expiresIn: 900,
    },
  };

  describe("register", () => {
    it("should register a new user and store tokens when no email confirmation required", async () => {
      mockPost.mockResolvedValue({ data: { data: mockAuthResponse } });

      const result = await register({
        email: "test@example.com",
        password: "Password123!",
        username: "testuser",
        role: UserRole.USER,
      });

      expect(mockPost).toHaveBeenCalledWith("/auth/register", {
        email: "test@example.com",
        password: "Password123!",
        username: "testuser",
        role: UserRole.USER,
      });
      expect(result).toEqual(mockAuthResponse);
      expect(mockSetAccessToken).toHaveBeenCalledWith("access-token");
      expect(mockSetIdToken).toHaveBeenCalledWith("id-token");
      expect(mockSetRefreshToken).toHaveBeenCalledWith("refresh-token");
    });

    it("should not store tokens when email confirmation is required", async () => {
      const cognitoResponse = {
        ...mockAuthResponse,
        requiresEmailConfirmation: true,
        tokens: {
          accessToken: "",
          refreshToken: "",
          idToken: "",
          expiresIn: 0,
        },
      };
      mockPost.mockResolvedValue({ data: { data: cognitoResponse } });

      const result = await register({
        email: "test@example.com",
        password: "Password123!",
        username: "testuser",
        role: UserRole.USER,
      });

      expect(result.requiresEmailConfirmation).toBe(true);
      expect(mockSetAccessToken).not.toHaveBeenCalled();
    });

    it("should handle registration errors", async () => {
      const error = new Error("Email already exists");
      mockPost.mockRejectedValue(error);

      await expect(
        register({
          email: "existing@example.com",
          password: "Password123!",
          username: "testuser",
          role: UserRole.USER,
        }),
      ).rejects.toThrow("Email already exists");
    });
  });

  describe("login", () => {
    it("should login and store tokens", async () => {
      mockPost.mockResolvedValue({ data: { data: mockAuthResponse } });

      const result = await login({
        email: "test@example.com",
        password: "Password123!",
      });

      expect(mockPost).toHaveBeenCalledWith("/auth/login", {
        email: "test@example.com",
        password: "Password123!",
      });
      expect(result).toEqual(mockAuthResponse);
      expect(mockSetAccessToken).toHaveBeenCalledWith("access-token");
      expect(mockSetIdToken).toHaveBeenCalledWith("id-token");
      expect(mockSetRefreshToken).toHaveBeenCalledWith("refresh-token");
    });

    it("should handle login without id token", async () => {
      const responseWithoutIdToken = {
        ...mockAuthResponse,
        tokens: { ...mockAuthResponse.tokens, idToken: undefined },
      };
      mockPost.mockResolvedValue({ data: { data: responseWithoutIdToken } });

      await login({ email: "test@example.com", password: "Password123!" });

      expect(mockSetIdToken).not.toHaveBeenCalled();
    });

    it("should handle invalid credentials", async () => {
      const error = new Error("Invalid credentials");
      mockPost.mockRejectedValue(error);

      await expect(
        login({ email: "test@example.com", password: "wrong" }),
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("refreshToken", () => {
    it("should refresh access token", async () => {
      const refreshResponse = { accessToken: "new-access", idToken: "new-id" };
      mockPost.mockResolvedValue({ data: { data: refreshResponse } });

      const result = await refreshToken({ refreshToken: "refresh-token" });

      expect(mockPost).toHaveBeenCalledWith("/auth/refresh", {
        refreshToken: "refresh-token",
      });
      expect(result).toEqual(refreshResponse);
      expect(mockSetAccessToken).toHaveBeenCalledWith("new-access");
      expect(mockSetIdToken).toHaveBeenCalledWith("new-id");
    });

    it("should handle expired refresh token", async () => {
      const error = new Error("Refresh token expired");
      mockPost.mockRejectedValue(error);

      await expect(
        refreshToken({ refreshToken: "expired-token" }),
      ).rejects.toThrow("Refresh token expired");
    });
  });

  describe("logout", () => {
    it("should logout and clear tokens", async () => {
      mockPost.mockResolvedValue({ data: { success: true } });

      await logout();

      expect(mockPost).toHaveBeenCalledWith("/auth/logout");
      expect(mockClearTokens).toHaveBeenCalled();
    });

    it("should clear tokens even if API call fails", async () => {
      mockPost.mockRejectedValue(new Error("Network error"));

      await logout();

      expect(mockClearTokens).toHaveBeenCalled();
    });
  });

  describe("confirmSignUp", () => {
    it("should confirm email with code", async () => {
      mockPost.mockResolvedValue({
        data: { data: { message: "Email confirmed" } },
      });

      const result = await confirmSignUp({
        email: "test@example.com",
        confirmationCode: "123456",
      });

      expect(mockPost).toHaveBeenCalledWith("/auth/confirm-signup", {
        email: "test@example.com",
        confirmationCode: "123456",
      });
      expect(result.message).toBe("Email confirmed");
    });

    it("should handle invalid confirmation code", async () => {
      const error = new Error("Invalid code");
      mockPost.mockRejectedValue(error);

      await expect(
        confirmSignUp({ email: "test@example.com", confirmationCode: "wrong" }),
      ).rejects.toThrow("Invalid code");
    });
  });

  describe("forgotPassword", () => {
    it("should initiate password reset", async () => {
      mockPost.mockResolvedValue({ data: { data: { message: "Code sent" } } });

      const result = await forgotPassword({ email: "test@example.com" });

      expect(mockPost).toHaveBeenCalledWith("/auth/forgot-password", {
        email: "test@example.com",
      });
      expect(result.message).toBe("Code sent");
    });

    it("should handle non-existent email gracefully", async () => {
      // API should still return success to prevent email enumeration
      mockPost.mockResolvedValue({
        data: { data: { message: "If email exists, code sent" } },
      });

      const result = await forgotPassword({ email: "nonexistent@example.com" });

      expect(result.message).toContain("code sent");
    });
  });

  describe("confirmForgotPassword", () => {
    it("should reset password with code", async () => {
      mockPost.mockResolvedValue({
        data: { data: { message: "Password reset" } },
      });

      const result = await confirmForgotPassword({
        email: "test@example.com",
        code: "123456",
        newPassword: "NewPassword123!",
      });

      expect(mockPost).toHaveBeenCalledWith("/auth/confirm-forgot-password", {
        email: "test@example.com",
        code: "123456",
        newPassword: "NewPassword123!",
      });
      expect(result.message).toBe("Password reset");
    });

    it("should handle expired code", async () => {
      const error = new Error("Code expired");
      mockPost.mockRejectedValue(error);

      await expect(
        confirmForgotPassword({
          email: "test@example.com",
          code: "expired",
          newPassword: "NewPassword123!",
        }),
      ).rejects.toThrow("Code expired");
    });
  });

  describe("getMe", () => {
    it("should get current user profile", async () => {
      const user: AuthUser = {
        userId: "user-123",
        email: "test@example.com",
        username: "testuser",
        role: UserRole.USER,
        createdAt: "2024-01-01T00:00:00Z",
      };
      mockGet.mockResolvedValue({ data: { data: user } });

      const result = await getMe();

      expect(mockGet).toHaveBeenCalledWith("/me");
      expect(result).toEqual(user);
    });

    it("should handle unauthenticated request", async () => {
      const error = new Error("Unauthorized");
      mockGet.mockRejectedValue(error);

      await expect(getMe()).rejects.toThrow("Unauthorized");
    });
  });
});

describe("Auth API Named Exports", () => {
  it("should export all functions", () => {
    expect(register).toBeDefined();
    expect(login).toBeDefined();
    expect(logout).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(confirmSignUp).toBeDefined();
    expect(forgotPassword).toBeDefined();
    expect(confirmForgotPassword).toBeDefined();
    expect(getMe).toBeDefined();
    expect(authAPI).toBeDefined();
  });
});
