// Test that all auth exports are properly re-exported from index
import {
  useAuth,
  AuthProvider,
  useAuthContext,
  useHasRole,
  useIsAuthenticated,
  ProtectedRoute,
  RequireAuth,
  RequireUser,
  RequireAdmin,
  secureStorage,
} from "./index";

describe("Auth index exports", () => {
  it("should export useAuth hook", () => {
    expect(useAuth).toBeDefined();
    expect(typeof useAuth).toBe("function");
  });

  it("should export AuthProvider", () => {
    expect(AuthProvider).toBeDefined();
  });

  it("should export useAuthContext hook", () => {
    expect(useAuthContext).toBeDefined();
    expect(typeof useAuthContext).toBe("function");
  });

  it("should export useHasRole hook", () => {
    expect(useHasRole).toBeDefined();
    expect(typeof useHasRole).toBe("function");
  });

  it("should export useIsAuthenticated hook", () => {
    expect(useIsAuthenticated).toBeDefined();
    expect(typeof useIsAuthenticated).toBe("function");
  });

  it("should export ProtectedRoute component", () => {
    expect(ProtectedRoute).toBeDefined();
  });

  it("should export RequireAuth component", () => {
    expect(RequireAuth).toBeDefined();
  });

  it("should export RequireUser component", () => {
    expect(RequireUser).toBeDefined();
  });

  it("should export RequireAdmin component", () => {
    expect(RequireAdmin).toBeDefined();
  });

  it("should export secureStorage", () => {
    expect(secureStorage).toBeDefined();
    expect(typeof secureStorage.getAccessToken).toBe("function");
  });
});
