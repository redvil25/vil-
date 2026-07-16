/**
 * Secure Token Storage Module
 *
 * Implements a secure token storage pattern with:
 * - Access tokens stored ONLY in memory (JavaScript variable)
 * - Refresh tokens stored in localStorage (acceptable for MVP)
 * - Automatic cleanup on logout
 *
 * SECURITY NOTES:
 * - Access tokens are short-lived (15 min) and stored ONLY in memory to prevent XSS attacks
 * - Refresh tokens are longer-lived (7 days) and stored in localStorage for MVP
 * - Memory storage is cleared on page refresh, requiring token refresh via refresh token
 * - This is MORE SECURE than localStorage for access tokens
 * - Future improvement: Use httpOnly cookies for refresh tokens (requires backend support)
 *
 * @module secure-storage
 */

/**
 * In-memory storage for tokens
 * These are cleared on page refresh, which is intentional for security
 * Tokens are NEVER stored in localStorage to prevent XSS token theft (except E2E mode)
 *
 * NOTE: For API Gateway with Cognito authorizer (without Authorization Scopes),
 * the ID token must be used for authentication, not the access token.
 * - ID Token: Used for API Gateway authorization (contains user claims)
 * - Access Token: Used for Cognito APIs and when Authorization Scopes are configured
 */
let accessTokenMemory: string | null = null;
let idTokenMemory: string | null = null;

/**
 * LocalStorage keys
 */
const STORAGE_KEYS = {
  REFRESH_TOKEN: "sandbox_refresh_token",
  ACCESS_TOKEN_E2E: "sandbox_access_token_e2e", // Only for local dev
  ID_TOKEN_E2E: "sandbox_id_token_e2e", // Only for local dev - used for API Gateway auth
} as const;

/**
 * Check if running in E2E test mode
 * E2E mode enables token persistence in localStorage for Playwright session management
 *
 * IMPORTANT: E2E mode should ONLY be enabled when actually running E2E tests,
 * NOT for all users on the Amplify deployment. The presence of E2E tokens in
 * localStorage is the definitive indicator that an E2E test session is active.
 */
const isE2EMode = (): boolean => {
  if (typeof window === "undefined") {
    console.log("[SecureStorage] isE2EMode: window is undefined (SSR)");
    return false;
  }

  const hostname = window.location.hostname;
  const hasE2EModeEnv = process.env.NEXT_PUBLIC_E2E_MODE === "true";
  const hasE2EDevModeEnv = process.env.NEXT_PUBLIC_E2E_DEV_MODE === "true";

  // Check for E2E tokens in localStorage - their presence indicates E2E mode
  // This is the PRIMARY indicator that an E2E test session is active
  const hasE2ETokensInStorage =
    !!localStorage.getItem("sandbox_access_token_e2e") ||
    !!localStorage.getItem("sandbox_id_token_e2e");

  // E2E mode is enabled if:
  // 1. NEXT_PUBLIC_E2E_MODE is explicitly set to true (local Cognito tests)
  // 2. NEXT_PUBLIC_E2E_DEV_MODE is true (local mock auth tests)
  // 3. E2E tokens exist in localStorage (active E2E test session on any host)
  //
  // NOTE: We do NOT use hasAmplifyHost here because that would incorrectly
  // treat ALL users on the Amplify deployment as E2E mode, breaking normal auth.
  const result = hasE2EModeEnv || hasE2EDevModeEnv || hasE2ETokensInStorage;

  console.log("[SecureStorage] isE2EMode check:", {
    hostname,
    hasE2EModeEnv,
    hasE2EDevModeEnv,
    hasE2ETokensInStorage,
    result,
  });

  return result;
};

/**
 * Secure Token Storage Manager
 *
 * Provides methods to securely store and retrieve authentication tokens.
 * Uses in-memory storage for access tokens and localStorage for refresh tokens.
 */
export const secureStorage = {
  /**
   * Get access token
   * In E2E mode, also checks localStorage to support Playwright state persistence
   */
  getAccessToken(): string | null {
    // First check memory
    if (accessTokenMemory) {
      console.log("[SecureStorage] Returning token from memory");
      return accessTokenMemory;
    }

    // In E2E mode, fallback to localStorage for Playwright state persistence
    const e2eMode = isE2EMode();
    console.log(
      "[SecureStorage] getAccessToken - isE2EMode() returned:",
      e2eMode,
    );
    if (e2eMode && typeof window !== "undefined") {
      const e2eToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_E2E);
      console.log("[SecureStorage] E2E mode - checking localStorage", {
        hasToken: !!e2eToken,
        tokenLength: e2eToken?.length || 0,
        hostname: window.location.hostname,
      });
      if (e2eToken) {
        // Validate token is not expired before using it
        if (this.isTokenExpired(e2eToken)) {
          console.log(
            "[SecureStorage] E2E token in localStorage is expired, clearing it",
          );
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_E2E);
          return null;
        }
        console.log(
          "[SecureStorage] E2E mode: Restoring token from localStorage to memory",
        );
        // Restore to memory for this session
        accessTokenMemory = e2eToken;
        return e2eToken;
      }
    }

    console.log("[SecureStorage] No token found in memory or localStorage", {
      isE2EMode: isE2EMode(),
      hostname:
        typeof window !== "undefined" ? window.location.hostname : "N/A",
    });
    return null;
  },

  /**
   * Check if JWT token is expired
   * Returns true if token is expired or invalid
   */
  isTokenExpired(token: string): boolean {
    try {
      // JWT format: header.payload.signature
      const parts = token.split(".");
      if (parts.length !== 3) {
        console.log("[SecureStorage] Invalid token format");
        return true;
      }

      // Decode payload (base64url)
      const payload = JSON.parse(atob(parts[1]));

      // Check expiration (exp is in seconds, Date.now() is in milliseconds)
      if (!payload.exp) {
        console.log("[SecureStorage] Token has no expiration");
        return true;
      }

      const isExpired = payload.exp * 1000 < Date.now();
      console.log("[SecureStorage] Token expiration check:", {
        exp: new Date(payload.exp * 1000).toISOString(),
        now: new Date().toISOString(),
        isExpired,
      });

      return isExpired;
    } catch (error) {
      console.error("[SecureStorage] Error checking token expiration:", error);
      return true; // Treat invalid tokens as expired
    }
  },

  /**
   * Set access token
   * In E2E mode, also stores in localStorage for Playwright state persistence
   */
  setAccessToken(token: string): void {
    accessTokenMemory = token;

    // In E2E mode, also store in localStorage for Playwright persistence
    if (isE2EMode() && typeof window !== "undefined") {
      console.log(
        "[SecureStorage] E2E mode detected, storing token in localStorage",
      );
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_E2E, token);
    } else {
      console.log(
        "[SecureStorage] Not in E2E mode, token stored in memory only",
        {
          hostname:
            typeof window !== "undefined" ? window.location.hostname : "N/A",
          isE2E: isE2EMode(),
        },
      );
    }
  },

  /**
   * Remove access token
   * Clears from both memory and localStorage (E2E mode)
   */
  removeAccessToken(): void {
    accessTokenMemory = null;

    // Also clear E2E localStorage if present
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_E2E);
    }
  },

  /**
   * Get ID token (used for API Gateway Cognito authorizer)
   * In E2E mode, also checks localStorage to support Playwright state persistence
   */
  getIdToken(): string | null {
    // First check memory
    if (idTokenMemory) {
      console.log("[SecureStorage] Returning ID token from memory");
      return idTokenMemory;
    }

    // In E2E mode, fallback to localStorage for Playwright state persistence
    if (isE2EMode() && typeof window !== "undefined") {
      const e2eToken = localStorage.getItem(STORAGE_KEYS.ID_TOKEN_E2E);
      console.log(
        "[SecureStorage] E2E mode - checking localStorage for ID token",
        {
          hasToken: !!e2eToken,
          tokenLength: e2eToken?.length || 0,
        },
      );
      if (e2eToken) {
        // Validate token is not expired before using it
        if (this.isTokenExpired(e2eToken)) {
          console.log(
            "[SecureStorage] E2E ID token in localStorage is expired, clearing it",
          );
          localStorage.removeItem(STORAGE_KEYS.ID_TOKEN_E2E);
          return null;
        }
        console.log(
          "[SecureStorage] E2E mode: Restoring ID token from localStorage to memory",
        );
        idTokenMemory = e2eToken;
        return e2eToken;
      }
    }

    console.log("[SecureStorage] No ID token found");
    return null;
  },

  /**
   * Set ID token (used for API Gateway Cognito authorizer)
   * In E2E mode, also stores in localStorage for Playwright state persistence
   */
  setIdToken(token: string): void {
    idTokenMemory = token;

    // In E2E mode, also store in localStorage for Playwright persistence
    if (isE2EMode() && typeof window !== "undefined") {
      console.log(
        "[SecureStorage] E2E mode detected, storing ID token in localStorage",
      );
      localStorage.setItem(STORAGE_KEYS.ID_TOKEN_E2E, token);
    }
  },

  /**
   * Remove ID token
   * Clears from both memory and localStorage (E2E mode)
   */
  removeIdToken(): void {
    idTokenMemory = null;

    // Also clear E2E localStorage if present
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.ID_TOKEN_E2E);
    }
  },

  /**
   * Get refresh token
   * Stored in localStorage (would ideally be in httpOnly cookie)
   */
  getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
    return null;
  },

  /**
   * Set refresh token
   * Stored in localStorage (would ideally be in httpOnly cookie)
   */
  setRefreshToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    }
  },

  /**
   * Remove refresh token
   * Clears from localStorage
   */
  removeRefreshToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
  },

  /**
   * Clear all tokens and auth-related storage
   * Removes access, ID, and refresh tokens from all storage locations
   * Also clears any other auth-related data that might persist
   */
  clearTokens(): void {
    console.log("[SecureStorage] clearTokens - Starting cleanup");

    this.removeAccessToken();
    this.removeIdToken();
    this.removeRefreshToken();

    // Also clear any other auth-related storage items
    if (typeof window !== "undefined") {
      // Clear user data
      localStorage.removeItem("user");

      // Clear any Cognito-specific keys that might exist
      localStorage.removeItem("idToken");
      localStorage.removeItem("CognitoIdentityServiceProvider.lastAuthUser");

      // Clear any keys that start with CognitoIdentityServiceProvider
      // (Cognito SDK stores session info with these keys)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("CognitoIdentityServiceProvider")) {
          keysToRemove.push(key);
        }
      }

      console.log(
        "[SecureStorage] clearTokens - Found Cognito keys to remove:",
        keysToRemove,
      );
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Verify cleanup was successful
      const remainingTokens = {
        accessTokenMemory: !!accessTokenMemory,
        idTokenMemory: !!idTokenMemory,
        refreshToken: !!localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        e2eAccessToken: !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_E2E),
        e2eIdToken: !!localStorage.getItem(STORAGE_KEYS.ID_TOKEN_E2E),
      };

      console.log("[SecureStorage] clearTokens - Cleanup complete", {
        clearedCognitoKeys: keysToRemove.length,
        remainingTokens,
      });

      // Verify no tokens remain
      const hasRemainingTokens = Object.values(remainingTokens).some((v) => v);
      if (hasRemainingTokens) {
        console.warn(
          "[SecureStorage] clearTokens - WARNING: Some tokens remain after cleanup!",
          remainingTokens,
        );
      }
    }
  },

  /**
   * Check if tokens exist
   * Returns true if either access token or refresh token exists
   */
  hasTokens(): boolean {
    return !!(this.getAccessToken() || this.getRefreshToken());
  },
};

/**
 * Token Storage Security Best Practices
 *
 * CURRENT IMPLEMENTATION (MVP):
 * - Access token: In-memory (JavaScript variable) + localStorage fallback
 * - Refresh token: localStorage
 *
 * FUTURE IMPROVEMENTS (Post-MVP):
 * 1. Implement httpOnly cookies for refresh tokens:
 *    - Requires backend to set cookies
 *    - Requires same-origin or proper CORS setup
 *    - Prevents JavaScript access to refresh tokens
 *
 * 2. Implement token rotation:
 *    - Issue new refresh token on each refresh
 *    - Invalidate old refresh tokens
 *    - Reduces risk of stolen refresh tokens
 *
 * 3. Implement refresh token fingerprinting:
 *    - Bind refresh token to device/browser fingerprint
 *    - Detect token theft across devices
 *
 * 4. Consider using a BFF (Backend-for-Frontend):
 *    - Next.js API routes handle auth
 *    - Tokens never exposed to client
 *    - Maximum security with minimal client changes
 */
