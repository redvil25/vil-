import { render, screen, waitFor } from "@testing-library/react";
import { useRouter, usePathname } from "next/navigation";
import {
  ProtectedRoute,
  RequireAuth,
  RequireUser,
  RequireAdmin,
} from "./ProtectedRoute";
import { useAuthContext } from "./AuthProvider";
import { UserRole } from "@/types/api.types";

// Mock Next.js navigation hooks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock AuthProvider
jest.mock("./AuthProvider", () => ({
  useAuthContext: jest.fn(),
}));

const mockPush = jest.fn();
const mockRouter = { push: mockPush };
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseAuthContext = useAuthContext as jest.MockedFunction<
  typeof useAuthContext
>;

describe("ProtectedRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as any);
    mockUsePathname.mockReturnValue("/dashboard");
  });

  describe("Loading State", () => {
    it("shows default loading spinner when isLoading is true", () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("shows custom loading fallback when provided", () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <ProtectedRoute loadingFallback={<div>Custom Loading...</div>}>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      expect(screen.getByText("Custom Loading...")).toBeInTheDocument();
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    it("does not redirect while loading", () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("Authentication Check", () => {
    it("redirects to login when not authenticated", async () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/auth/login?returnUrl=%2Fdashboard",
        );
      });
    });

    it("redirects to custom path when redirectTo is provided", async () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <ProtectedRoute redirectTo="/custom-login">
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/custom-login?returnUrl=%2Fdashboard",
        );
      });
    });

    it("does not add returnUrl when already on redirect path", async () => {
      mockUsePathname.mockReturnValue("/auth/login");
      mockUseAuthContext.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/auth/login");
      });
    });

    it("renders null when not authenticated and not loading", () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      const { container } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      expect(container.firstChild).toBeNull();
    });

    it("renders null when user is null even if isAuthenticated is true", () => {
      mockUseAuthContext.mockReturnValue({
        user: null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      const { container } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Authenticated Access - No Role Required", () => {
    it("renders children when authenticated as USER", () => {
      mockUseAuthContext.mockReturnValue({
        user: {
          userId: "user-123",
          email: "user@example.com",
          username: "user",
          role: UserRole.USER,
          createdAt: "2024-01-01T00:00:00Z",
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("renders children when authenticated as ADMIN", () => {
      mockUseAuthContext.mockReturnValue({
        user: {
          userId: "user-123",
          email: "admin@example.com",
          username: "admin",
          role: UserRole.ADMIN,
          createdAt: "2024-01-01T00:00:00Z",
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  describe("Role-Based Access Control - USER Role", () => {
    it("allows USER access to USER route", () => {
      mockUseAuthContext.mockReturnValue({
        user: {
          userId: "user-123",
          email: "user@example.com",
          username: "user",
          role: UserRole.USER,
          createdAt: "2024-01-01T00:00:00Z",
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <ProtectedRoute requiredRole={UserRole.USER}>
          <div>User Content</div>
        </ProtectedRoute>,
      );

      expect(screen.getByText("User Content")).toBeInTheDocument();
    });

    it("denies USER access to ADMIN route", () => {
      mockUseAuthContext.mockReturnValue({
        user: {
          userId: "user-123",
          email: "user@example.com",
          username: "user",
          role: UserRole.USER,
          createdAt: "2024-01-01T00:00:00Z",
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <ProtectedRoute requiredRole={UserRole.ADMIN}>
          <div>Admin Content</div>
        </ProtectedRoute>,
      );

      expect(screen.getByText("Access Denied")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
      expect(screen.getByText("User")).toBeInTheDocument();
    });
  });

  describe("Role-Based Access Control - ADMIN Role", () => {
    it("allows ADMIN access to USER route", () => {
      mockUseAuthContext.mockReturnValue({
        user: {
          userId: "user-123",
          email: "admin@example.com",
          username: "admin",
          role: UserRole.ADMIN,
          createdAt: "2024-01-01T00:00:00Z",
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <ProtectedRoute requiredRole={UserRole.USER}>
          <div>User Content</div>
        </ProtectedRoute>,
      );

      expect(screen.getByText("User Content")).toBeInTheDocument();
    });

    it("allows ADMIN access to ADMIN route", () => {
      mockUseAuthContext.mockReturnValue({
        user: {
          userId: "user-123",
          email: "admin@example.com",
          username: "admin",
          role: UserRole.ADMIN,
          createdAt: "2024-01-01T00:00:00Z",
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <ProtectedRoute requiredRole={UserRole.ADMIN}>
          <div>Admin Content</div>
        </ProtectedRoute>,
      );

      expect(screen.getByText("Admin Content")).toBeInTheDocument();
    });
  });

  describe("Custom Fallbacks", () => {
    it("shows custom unauthorized fallback when provided", () => {
      mockUseAuthContext.mockReturnValue({
        user: {
          userId: "user-123",
          email: "user@example.com",
          username: "user",
          role: UserRole.USER,
          createdAt: "2024-01-01T00:00:00Z",
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <ProtectedRoute
          requiredRole={UserRole.ADMIN}
          unauthorizedFallback={<div>Custom Unauthorized Message</div>}
        >
          <div>Admin Content</div>
        </ProtectedRoute>,
      );

      expect(
        screen.getByText("Custom Unauthorized Message"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Access Denied")).not.toBeInTheDocument();
    });

    it("shows Go to Homepage button in default unauthorized state", () => {
      mockUseAuthContext.mockReturnValue({
        user: {
          userId: "user-123",
          email: "user@example.com",
          username: "user",
          role: UserRole.USER,
          createdAt: "2024-01-01T00:00:00Z",
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <ProtectedRoute requiredRole={UserRole.ADMIN}>
          <div>Admin Content</div>
        </ProtectedRoute>,
      );

      const homeButton = screen.getByRole("button", {
        name: /Go to Homepage/i,
      });
      expect(homeButton).toBeInTheDocument();

      homeButton.click();
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  describe("Convenience Wrappers", () => {
    it("RequireAuth wrapper works without role check", () => {
      mockUseAuthContext.mockReturnValue({
        user: {
          userId: "user-123",
          email: "test@example.com",
          username: "testuser",
          role: UserRole.USER,
          createdAt: "2024-01-01T00:00:00Z",
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <RequireAuth>
          <div>Authenticated Content</div>
        </RequireAuth>,
      );

      expect(screen.getByText("Authenticated Content")).toBeInTheDocument();
    });

    it("RequireUser wrapper requires USER role", () => {
      mockUseAuthContext.mockReturnValue({
        user: {
          userId: "user-123",
          email: "user@example.com",
          username: "user",
          role: UserRole.USER,
          createdAt: "2024-01-01T00:00:00Z",
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <RequireUser>
          <div>User Content</div>
        </RequireUser>,
      );

      expect(screen.getByText("User Content")).toBeInTheDocument();
    });

    it("RequireAdmin wrapper requires ADMIN role", () => {
      mockUseAuthContext.mockReturnValue({
        user: {
          userId: "user-123",
          email: "admin@example.com",
          username: "admin",
          role: UserRole.ADMIN,
          createdAt: "2024-01-01T00:00:00Z",
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <RequireAdmin>
          <div>Admin Content</div>
        </RequireAdmin>,
      );

      expect(screen.getByText("Admin Content")).toBeInTheDocument();
    });

    it("RequireAdmin denies USER access", () => {
      mockUseAuthContext.mockReturnValue({
        user: {
          userId: "user-123",
          email: "user@example.com",
          username: "user",
          role: UserRole.USER,
          createdAt: "2024-01-01T00:00:00Z",
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: jest.fn(),
        register: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        confirmSignUp: jest.fn(),
        forgotPassword: jest.fn(),
        confirmForgotPassword: jest.fn(),
        clearError: jest.fn(),
        checkAuth: jest.fn(),
      });

      render(
        <RequireAdmin>
          <div>Admin Content</div>
        </RequireAdmin>,
      );

      expect(screen.getByText("Access Denied")).toBeInTheDocument();
    });
  });
});
