import { render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import {
  AuthProvider,
  useAuthContext,
  useHasRole,
  useIsAuthenticated,
} from "./AuthProvider";
import { UserRole } from "@/types/api.types";
import * as useAuthHook from "@/lib/hooks/use-auth";

// Mock the useAuth hook
jest.mock("@/lib/hooks/use-auth");

const mockUseAuth = useAuthHook.useAuth as jest.MockedFunction<
  typeof useAuthHook.useAuth
>;

describe("AuthProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children", () => {
    mockUseAuth.mockReturnValue({
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
      <AuthProvider>
        <div>Test Child</div>
      </AuthProvider>,
    );

    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("provides auth context to children", () => {
    const mockAuthState = {
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
    };

    mockUseAuth.mockReturnValue(mockAuthState);

    function TestComponent() {
      const auth = useAuthContext();
      return (
        <div>
          {auth.isAuthenticated ? "Authenticated" : "Not Authenticated"}
        </div>
      );
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByText("Not Authenticated")).toBeInTheDocument();
  });
});

describe("useAuthContext", () => {
  it("throws error when used outside AuthProvider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuthContext());
    }).toThrow("useAuthContext must be used within an AuthProvider");

    consoleSpy.mockRestore();
  });

  it("returns auth context when used within AuthProvider", () => {
    const mockAuthState = {
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
    };

    mockUseAuth.mockReturnValue(mockAuthState);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuthContext(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockAuthState.user);
  });
});

describe("useHasRole", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it("returns false when user is not authenticated", () => {
    mockUseAuth.mockReturnValue({
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

    const { result } = renderHook(() => useHasRole(UserRole.USER), { wrapper });

    expect(result.current).toBe(false);
  });

  it("returns true for user with USER role", () => {
    mockUseAuth.mockReturnValue({
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

    const { result } = renderHook(() => useHasRole(UserRole.USER), { wrapper });

    expect(result.current).toBe(true);
  });

  it("returns false for user with ADMIN role required", () => {
    mockUseAuth.mockReturnValue({
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

    const { result } = renderHook(() => useHasRole(UserRole.ADMIN), {
      wrapper,
    });

    expect(result.current).toBe(false);
  });

  it("returns true for admin with any role (admin has all permissions)", () => {
    mockUseAuth.mockReturnValue({
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

    const { result: userResult } = renderHook(() => useHasRole(UserRole.USER), {
      wrapper,
    });
    const { result: adminResult } = renderHook(
      () => useHasRole(UserRole.ADMIN),
      { wrapper },
    );

    expect(userResult.current).toBe(true);
    expect(adminResult.current).toBe(true);
  });
});

describe("useIsAuthenticated", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it("returns false when not authenticated", () => {
    mockUseAuth.mockReturnValue({
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

    const { result } = renderHook(() => useIsAuthenticated(), { wrapper });

    expect(result.current).toBe(false);
  });

  it("returns true when authenticated", () => {
    mockUseAuth.mockReturnValue({
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

    const { result } = renderHook(() => useIsAuthenticated(), { wrapper });

    expect(result.current).toBe(true);
  });
});
