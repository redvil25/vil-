/**
 * Tests for Secure Token Storage Module
 *
 * These tests are security-critical as they verify the proper
 * storage and handling of authentication tokens.
 */

import { secureStorage } from "./secure-storage";

// Mock localStorage with full interface
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("secureStorage", () => {
  beforeEach(() => {
    // Clear all storage before each test
    localStorageMock.clear();
    secureStorage.clearTokens();
  });

  afterEach(() => {
    // Clean up after each test
    localStorageMock.clear();
    secureStorage.clearTokens();
  });

  describe("Access Token Management", () => {
    describe("setAccessToken", () => {
      it("stores access token in memory", () => {
        const token = "access_token_123";
        secureStorage.setAccessToken(token);

        expect(secureStorage.getAccessToken()).toBe(token);
      });

      it("does NOT store access token in localStorage (memory-only for security)", () => {
        const token = "access_token_456";
        secureStorage.setAccessToken(token);

        // Access tokens are NEVER stored in localStorage for security
        expect(localStorage.getItem("sandbox_access_token")).toBeNull();
      });

      it("updates access token when called multiple times", () => {
        secureStorage.setAccessToken("token1");
        expect(secureStorage.getAccessToken()).toBe("token1");

        secureStorage.setAccessToken("token2");
        expect(secureStorage.getAccessToken()).toBe("token2");
      });

      it("handles empty string tokens", () => {
        secureStorage.setAccessToken("");
        // Empty strings are not considered valid tokens (returns null)
        expect(secureStorage.getAccessToken()).toBeNull();
      });
    });

    describe("getAccessToken", () => {
      it("returns null when no token is set", () => {
        expect(secureStorage.getAccessToken()).toBeNull();
      });

      it("only returns in-memory token (never from localStorage)", () => {
        // Even if localStorage has a token, it should NOT be returned
        localStorage.setItem("sandbox_access_token", "localStorage_token");
        secureStorage.setAccessToken("memory_token");

        // Should ONLY return memory token
        expect(secureStorage.getAccessToken()).toBe("memory_token");
      });

      it("returns null when memory is empty (no localStorage fallback)", () => {
        // Set token directly in localStorage (simulating old behavior)
        localStorage.setItem("sandbox_access_token", "localStorage_token");

        // Memory is empty, should return null (no fallback for security)
        expect(secureStorage.getAccessToken()).toBeNull();
      });

      it("returns null when both memory and localStorage are empty", () => {
        expect(secureStorage.getAccessToken()).toBeNull();
      });
    });

    describe("removeAccessToken", () => {
      it("clears access token from memory", () => {
        secureStorage.setAccessToken("token_to_remove");
        expect(secureStorage.getAccessToken()).toBe("token_to_remove");

        secureStorage.removeAccessToken();

        // Memory should be cleared
        expect(secureStorage.getAccessToken()).toBeNull();
      });

      it("returns null after removal", () => {
        secureStorage.setAccessToken("token_to_remove");
        secureStorage.removeAccessToken();

        expect(secureStorage.getAccessToken()).toBeNull();
      });

      it("handles removal when no token exists", () => {
        expect(() => secureStorage.removeAccessToken()).not.toThrow();
        expect(secureStorage.getAccessToken()).toBeNull();
      });
    });
  });

  describe("Refresh Token Management", () => {
    describe("setRefreshToken", () => {
      it("stores refresh token in localStorage", () => {
        const token = "refresh_token_789";
        secureStorage.setRefreshToken(token);

        expect(localStorage.getItem("sandbox_refresh_token")).toBe(token);
      });

      it("updates refresh token when called multiple times", () => {
        secureStorage.setRefreshToken("refresh1");
        expect(secureStorage.getRefreshToken()).toBe("refresh1");

        secureStorage.setRefreshToken("refresh2");
        expect(secureStorage.getRefreshToken()).toBe("refresh2");
      });

      it("handles empty string tokens", () => {
        secureStorage.setRefreshToken("");
        // localStorage treats empty strings as falsy, returns null
        // This is correct behavior - empty tokens = no token
        expect(secureStorage.getRefreshToken()).toBeNull();
      });
    });

    describe("getRefreshToken", () => {
      it("returns null when no token is set", () => {
        expect(secureStorage.getRefreshToken()).toBeNull();
      });

      it("retrieves refresh token from localStorage", () => {
        const token = "refresh_token_abc";
        secureStorage.setRefreshToken(token);

        expect(secureStorage.getRefreshToken()).toBe(token);
      });

      it("returns token set directly in localStorage", () => {
        localStorage.setItem("sandbox_refresh_token", "direct_token");
        expect(secureStorage.getRefreshToken()).toBe("direct_token");
      });
    });

    describe("removeRefreshToken", () => {
      it("clears refresh token from localStorage", () => {
        secureStorage.setRefreshToken("token_to_remove");
        expect(localStorage.getItem("sandbox_refresh_token")).toBe(
          "token_to_remove",
        );

        secureStorage.removeRefreshToken();
        expect(localStorage.getItem("sandbox_refresh_token")).toBeNull();
      });

      it("returns null after removal", () => {
        secureStorage.setRefreshToken("token_to_remove");
        secureStorage.removeRefreshToken();

        expect(secureStorage.getRefreshToken()).toBeNull();
      });

      it("handles removal when no token exists", () => {
        expect(() => secureStorage.removeRefreshToken()).not.toThrow();
        expect(secureStorage.getRefreshToken()).toBeNull();
      });
    });
  });

  describe("Token Management Operations", () => {
    describe("clearTokens", () => {
      it("clears both access and refresh tokens", () => {
        secureStorage.setAccessToken("access_token");
        secureStorage.setRefreshToken("refresh_token");

        expect(secureStorage.getAccessToken()).toBe("access_token");
        expect(secureStorage.getRefreshToken()).toBe("refresh_token");

        secureStorage.clearTokens();

        expect(secureStorage.getAccessToken()).toBeNull();
        expect(secureStorage.getRefreshToken()).toBeNull();
      });

      it("clears refresh token from localStorage (access tokens are memory-only)", () => {
        secureStorage.setAccessToken("access_token");
        secureStorage.setRefreshToken("refresh_token");

        secureStorage.clearTokens();

        // Only refresh token is in localStorage
        expect(localStorage.getItem("sandbox_refresh_token")).toBeNull();
      });

      it("handles clearing when no tokens exist", () => {
        expect(() => secureStorage.clearTokens()).not.toThrow();
        expect(secureStorage.hasTokens()).toBe(false);
      });

      it("removes access token from memory", () => {
        secureStorage.setAccessToken("memory_token");
        secureStorage.clearTokens();

        // Even if localStorage fallback exists, memory should be cleared
        expect(secureStorage.getAccessToken()).toBeNull();
      });
    });

    describe("hasTokens", () => {
      it("returns false when no tokens exist", () => {
        expect(secureStorage.hasTokens()).toBe(false);
      });

      it("returns true when only access token exists", () => {
        secureStorage.setAccessToken("access_token");
        expect(secureStorage.hasTokens()).toBe(true);
      });

      it("returns true when only refresh token exists", () => {
        secureStorage.setRefreshToken("refresh_token");
        expect(secureStorage.hasTokens()).toBe(true);
      });

      it("returns true when both tokens exist", () => {
        secureStorage.setAccessToken("access_token");
        secureStorage.setRefreshToken("refresh_token");
        expect(secureStorage.hasTokens()).toBe(true);
      });

      it("returns false after clearing tokens", () => {
        secureStorage.setAccessToken("access_token");
        secureStorage.setRefreshToken("refresh_token");
        expect(secureStorage.hasTokens()).toBe(true);

        secureStorage.clearTokens();
        expect(secureStorage.hasTokens()).toBe(false);
      });

      it("returns false when access token exists only in localStorage (memory-only)", () => {
        // Access tokens in localStorage are ignored (memory-only for security)
        localStorage.setItem("sandbox_access_token", "localStorage_only");
        expect(secureStorage.hasTokens()).toBe(false);
      });
    });
  });

  describe("Security Scenarios", () => {
    describe("Memory-only storage (no localStorage fallback)", () => {
      it("memory token is the only source for access tokens", () => {
        localStorage.setItem("sandbox_access_token", "old_token");
        secureStorage.setAccessToken("new_token");

        // Only memory token is returned
        expect(secureStorage.getAccessToken()).toBe("new_token");
      });

      it("returns null after memory is cleared (no localStorage fallback)", () => {
        secureStorage.setAccessToken("token");
        // Simulate memory being cleared (page refresh)
        secureStorage.removeAccessToken();
        localStorage.setItem("sandbox_access_token", "fallback_token");

        // No fallback to localStorage for security
        expect(secureStorage.getAccessToken()).toBeNull();
      });
    });

    describe("Token isolation", () => {
      it("access token and refresh token are stored separately", () => {
        secureStorage.setAccessToken("access_token_value");
        secureStorage.setRefreshToken("refresh_token_value");

        expect(secureStorage.getAccessToken()).toBe("access_token_value");
        expect(secureStorage.getRefreshToken()).toBe("refresh_token_value");
      });

      it("removing access token does not affect refresh token", () => {
        secureStorage.setAccessToken("access_token");
        secureStorage.setRefreshToken("refresh_token");

        secureStorage.removeAccessToken();

        expect(secureStorage.getAccessToken()).toBeNull();
        expect(secureStorage.getRefreshToken()).toBe("refresh_token");
      });

      it("removing refresh token does not affect access token", () => {
        secureStorage.setAccessToken("access_token");
        secureStorage.setRefreshToken("refresh_token");

        secureStorage.removeRefreshToken();

        expect(secureStorage.getAccessToken()).toBe("access_token");
        expect(secureStorage.getRefreshToken()).toBeNull();
      });
    });

    describe("Edge cases", () => {
      it("handles special characters in tokens", () => {
        const specialToken = "token.with-special_chars!@#$%^&*()";
        secureStorage.setAccessToken(specialToken);
        expect(secureStorage.getAccessToken()).toBe(specialToken);
      });

      it("handles very long tokens", () => {
        const longToken = "a".repeat(10000);
        secureStorage.setAccessToken(longToken);
        expect(secureStorage.getAccessToken()).toBe(longToken);
      });

      it("handles JWT-like tokens", () => {
        const jwtToken =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
        secureStorage.setAccessToken(jwtToken);
        expect(secureStorage.getAccessToken()).toBe(jwtToken);
      });

      it("handles multiple rapid token updates", () => {
        for (let i = 0; i < 100; i++) {
          secureStorage.setAccessToken(`token_${i}`);
        }
        expect(secureStorage.getAccessToken()).toBe("token_99");
      });

      it("handles token update during retrieval", () => {
        secureStorage.setAccessToken("token1");
        const token1 = secureStorage.getAccessToken();
        secureStorage.setAccessToken("token2");
        const token2 = secureStorage.getAccessToken();

        expect(token1).toBe("token1");
        expect(token2).toBe("token2");
      });
    });
  });

  describe("Storage Keys", () => {
    it("does NOT store access tokens in localStorage (memory-only)", () => {
      secureStorage.setAccessToken("test_token");
      // Access tokens are never in localStorage
      expect(localStorage.getItem("sandbox_access_token")).toBeNull();
    });

    it("uses correct localStorage key for refresh token", () => {
      secureStorage.setRefreshToken("test_refresh");
      expect(localStorage.getItem("sandbox_refresh_token")).toBe(
        "test_refresh",
      );
    });

    it("does not interfere with other localStorage keys", () => {
      localStorage.setItem("some_other_key", "other_value");
      secureStorage.setAccessToken("token");
      secureStorage.clearTokens();

      expect(localStorage.getItem("some_other_key")).toBe("other_value");
    });
  });

  describe("Type Safety", () => {
    it("returns string when token exists", () => {
      secureStorage.setAccessToken("token");
      const token = secureStorage.getAccessToken();
      expect(typeof token).toBe("string");
    });

    it("returns null when token does not exist", () => {
      const token = secureStorage.getAccessToken();
      expect(token).toBeNull();
    });

    it("accepts string tokens", () => {
      expect(() => secureStorage.setAccessToken("valid_token")).not.toThrow();
    });
  });

  describe("Logout Scenario", () => {
    it("simulates complete logout flow", () => {
      // Login: set both tokens
      secureStorage.setAccessToken("access_token_after_login");
      secureStorage.setRefreshToken("refresh_token_after_login");

      expect(secureStorage.hasTokens()).toBe(true);
      expect(secureStorage.getAccessToken()).toBe("access_token_after_login");
      expect(secureStorage.getRefreshToken()).toBe("refresh_token_after_login");

      // Logout: clear all tokens
      secureStorage.clearTokens();

      expect(secureStorage.hasTokens()).toBe(false);
      expect(secureStorage.getAccessToken()).toBeNull();
      expect(secureStorage.getRefreshToken()).toBeNull();
      // Only refresh token is in localStorage (access tokens are memory-only)
      expect(localStorage.getItem("sandbox_refresh_token")).toBeNull();
    });
  });

  describe("Token Refresh Scenario", () => {
    it("simulates token refresh flow", () => {
      // Initial login
      secureStorage.setAccessToken("old_access_token");
      secureStorage.setRefreshToken("refresh_token");

      // Token expires, refresh using refresh token
      const refreshToken = secureStorage.getRefreshToken();
      expect(refreshToken).toBe("refresh_token");

      // Get new access token
      secureStorage.setAccessToken("new_access_token");

      expect(secureStorage.getAccessToken()).toBe("new_access_token");
      expect(secureStorage.getRefreshToken()).toBe("refresh_token");
    });

    it("simulates token refresh with rotation", () => {
      // Initial state
      secureStorage.setAccessToken("old_access");
      secureStorage.setRefreshToken("old_refresh");

      // Refresh flow updates both tokens
      secureStorage.setAccessToken("new_access");
      secureStorage.setRefreshToken("new_refresh");

      expect(secureStorage.getAccessToken()).toBe("new_access");
      expect(secureStorage.getRefreshToken()).toBe("new_refresh");
    });
  });

  describe("Page Refresh Simulation", () => {
    it("demonstrates memory-only access tokens are lost on refresh", () => {
      // Before refresh: set both tokens
      secureStorage.setAccessToken("access_before_refresh");
      secureStorage.setRefreshToken("refresh_before_refresh");

      // Access token is in memory only
      expect(secureStorage.getAccessToken()).toBe("access_before_refresh");
      expect(localStorage.getItem("sandbox_access_token")).toBeNull();

      // Refresh token is in localStorage
      const refreshInStorage = localStorage.getItem("sandbox_refresh_token");
      expect(refreshInStorage).toBe("refresh_before_refresh");

      // After page refresh (simulated by clearing memory), only refresh token persists
      secureStorage.removeAccessToken();
      expect(secureStorage.getAccessToken()).toBeNull();
      expect(localStorage.getItem("sandbox_refresh_token")).toBe(
        "refresh_before_refresh",
      );
    });
  });

  describe("E2E Mode - Token Retrieval", () => {
    beforeEach(() => {
      localStorageMock.clear();
      secureStorage.clearTokens();
    });

    it("should retrieve access token from E2E localStorage when token exists there", () => {
      // Create a valid non-expired token
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
      );
      const signature = "test_signature";
      const validToken = `${header}.${payload}.${signature}`;

      localStorage.setItem("sandbox_access_token_e2e", validToken);
      // The presence of E2E tokens should trigger E2E mode detection
      const token = secureStorage.getAccessToken();
      // Token should be retrieved from localStorage in E2E mode
      expect(token).toBe(validToken);
    });

    it("should retrieve ID token from E2E localStorage when token exists there", () => {
      // Create a valid non-expired token
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
      );
      const signature = "test_signature";
      const validToken = `${header}.${payload}.${signature}`;

      localStorage.setItem("sandbox_id_token_e2e", validToken);
      const token = secureStorage.getIdToken();
      expect(token).toBe(validToken);
    });
  });

  describe("ID Token Management", () => {
    beforeEach(() => {
      localStorageMock.clear();
      secureStorage.clearTokens();
    });

    it("should set and get ID token from memory", () => {
      secureStorage.setIdToken("test_id_token");
      expect(secureStorage.getIdToken()).toBe("test_id_token");
    });

    it("should return null when no ID token is set", () => {
      expect(secureStorage.getIdToken()).toBeNull();
    });

    it("should remove ID token", () => {
      secureStorage.setIdToken("token_to_remove");
      expect(secureStorage.getIdToken()).toBe("token_to_remove");

      secureStorage.removeIdToken();
      expect(secureStorage.getIdToken()).toBeNull();
    });

    it("should clear E2E ID token from localStorage on removal", () => {
      localStorage.setItem("sandbox_id_token_e2e", "e2e_token");
      secureStorage.removeIdToken();
      expect(localStorage.getItem("sandbox_id_token_e2e")).toBeNull();
    });
  });

  describe("Token Expiration", () => {
    beforeEach(() => {
      localStorageMock.clear();
      secureStorage.clearTokens();
    });

    it("should detect expired token", () => {
      // Create a JWT with exp in the past
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }),
      ); // 1 hour ago
      const signature = "test_signature";
      const expiredToken = `${header}.${payload}.${signature}`;

      expect(secureStorage.isTokenExpired(expiredToken)).toBe(true);
    });

    it("should detect valid (non-expired) token", () => {
      // Create a JWT with exp in the future
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
      ); // 1 hour from now
      const signature = "test_signature";
      const validToken = `${header}.${payload}.${signature}`;

      expect(secureStorage.isTokenExpired(validToken)).toBe(false);
    });

    it("should treat token without exp as expired", () => {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(JSON.stringify({ sub: "user123" })); // No exp claim
      const signature = "test_signature";
      const tokenWithoutExp = `${header}.${payload}.${signature}`;

      expect(secureStorage.isTokenExpired(tokenWithoutExp)).toBe(true);
    });

    it("should treat invalid token format as expired", () => {
      expect(secureStorage.isTokenExpired("invalid_token")).toBe(true);
      expect(secureStorage.isTokenExpired("only.two")).toBe(true);
    });

    it("should treat malformed payload as expired", () => {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const invalidPayload = "not_valid_base64!!!";
      const signature = "test_signature";
      const malformedToken = `${header}.${invalidPayload}.${signature}`;

      expect(secureStorage.isTokenExpired(malformedToken)).toBe(true);
    });

    it("should not return expired E2E token from localStorage", () => {
      // Create an expired token
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }),
      );
      const signature = "test_signature";
      const expiredToken = `${header}.${payload}.${signature}`;

      // Store expired token in E2E localStorage
      localStorage.setItem("sandbox_access_token_e2e", expiredToken);

      // Should return null and clear the expired token
      const token = secureStorage.getAccessToken();
      expect(token).toBeNull();
      expect(localStorage.getItem("sandbox_access_token_e2e")).toBeNull();
    });

    it("should not return expired E2E ID token from localStorage", () => {
      // Create an expired token
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }),
      );
      const signature = "test_signature";
      const expiredToken = `${header}.${payload}.${signature}`;

      // Store expired token in E2E localStorage
      localStorage.setItem("sandbox_id_token_e2e", expiredToken);

      // Should return null and clear the expired token
      const token = secureStorage.getIdToken();
      expect(token).toBeNull();
      expect(localStorage.getItem("sandbox_id_token_e2e")).toBeNull();
    });
  });

  describe("clearTokens - Cognito keys cleanup", () => {
    beforeEach(() => {
      localStorageMock.clear();
      secureStorage.clearTokens();
    });

    it("should remove Cognito-specific keys from localStorage", () => {
      // Set up Cognito keys
      localStorage.setItem(
        "CognitoIdentityServiceProvider.app.user",
        "cognito_data",
      );
      localStorage.setItem(
        "CognitoIdentityServiceProvider.app.accessToken",
        "cognito_access",
      );
      localStorage.setItem("idToken", "old_id_token");
      localStorage.setItem("user", "user_data");

      secureStorage.clearTokens();

      expect(
        localStorage.getItem("CognitoIdentityServiceProvider.app.user"),
      ).toBeNull();
      expect(
        localStorage.getItem("CognitoIdentityServiceProvider.app.accessToken"),
      ).toBeNull();
      expect(localStorage.getItem("idToken")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });

    it("should clear all E2E tokens", () => {
      localStorage.setItem("sandbox_access_token_e2e", "e2e_access");
      localStorage.setItem("sandbox_id_token_e2e", "e2e_id");
      localStorage.setItem("sandbox_refresh_token", "refresh");

      secureStorage.clearTokens();

      expect(localStorage.getItem("sandbox_access_token_e2e")).toBeNull();
      expect(localStorage.getItem("sandbox_id_token_e2e")).toBeNull();
      expect(localStorage.getItem("sandbox_refresh_token")).toBeNull();
    });
  });
});
