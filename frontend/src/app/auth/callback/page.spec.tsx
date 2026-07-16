import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import CallbackPage from "./page";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { secureStorage } from "@/lib/auth/secure-storage";
import { consumePKCEVerifier } from "@/lib/auth/pkce";

// Mock Next.js navigation hooks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock AuthProvider
jest.mock("@/components/auth/AuthProvider", () => ({
  useAuthContext: jest.fn(),
}));

// Mock secure storage
jest.mock("@/lib/auth/secure-storage", () => ({
  secureStorage: {
    setAccessToken: jest.fn(),
    setIdToken: jest.fn(),
    setRefreshToken: jest.fn(),
    getAccessToken: jest.fn().mockReturnValue(null),
  },
}));

// Mock PKCE module
jest.mock("@/lib/auth/pkce", () => ({
  consumePKCEVerifier: jest.fn(),
}));

const mockConsumePKCEVerifier = consumePKCEVerifier as jest.MockedFunction<
  typeof consumePKCEVerifier
>;

const mockPush = jest.fn();
const mockRouter = { push: mockPush };
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;
const mockUseAuthContext = useAuthContext as jest.MockedFunction<
  typeof useAuthContext
>;
const mockSecureStorage = secureStorage as jest.Mocked<typeof secureStorage>;

// Helper to set URL hash in jsdom
const setLocationHash = (hash: string) => {
  // In jsdom, we can navigate by setting href
  window.history.pushState({}, "", `/auth/callback${hash}`);
};

describe("CallbackPage", () => {
  const mockCheckAuth = jest.fn();
  const mockReplaceState = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(
      mockRouter as unknown as ReturnType<typeof useRouter>,
    );
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
      checkAuth: mockCheckAuth,
    });

    // Default: no error params, no hash
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    } as unknown as ReturnType<typeof useSearchParams>);

    // Set default location (no hash)
    setLocationHash("");

    // Mock window.history.replaceState
    jest
      .spyOn(window.history, "replaceState")
      .mockImplementation(mockReplaceState);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Loading State", () => {
    it("shows loading spinner when tokens are being processed", async () => {
      // Set up hash with valid tokens
      setLocationHash(
        "#access_token=test-access-token&id_token=test-id-token&expires_in=900",
      );

      // Make checkAuth hang so we can observe the loading state
      mockCheckAuth.mockImplementation(() => new Promise(() => {}));

      render(<CallbackPage />);

      // The loading spinner should be visible while checkAuth is pending
      expect(screen.getByText("Completing sign in...")).toBeInTheDocument();
    });

    it("transitions from loading to redirect on success", async () => {
      setLocationHash(
        "#access_token=test-access-token&id_token=test-id-token&expires_in=900",
      );
      mockCheckAuth.mockResolvedValue(undefined);

      render(<CallbackPage />);

      // Should redirect to /stories after processing
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("Successful OAuth Callback", () => {
    it("stores tokens and redirects to /stories when tokens are present in hash", async () => {
      // Set up hash with tokens
      setLocationHash(
        "#access_token=test-access-token&id_token=test-id-token&expires_in=900",
      );

      mockCheckAuth.mockResolvedValue(undefined);

      render(<CallbackPage />);

      await waitFor(() => {
        expect(mockSecureStorage.setAccessToken).toHaveBeenCalledWith(
          "test-access-token",
        );
        expect(mockSecureStorage.setIdToken).toHaveBeenCalledWith(
          "test-id-token",
        );
      });

      await waitFor(() => {
        expect(mockCheckAuth).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });

    it("clears URL hash after storing tokens", async () => {
      setLocationHash(
        "#access_token=test-access-token&id_token=test-id-token&expires_in=900",
      );

      mockCheckAuth.mockResolvedValue(undefined);

      render(<CallbackPage />);

      await waitFor(() => {
        expect(mockReplaceState).toHaveBeenCalledWith(
          null,
          "",
          "/auth/callback",
        );
      });
    });

    it("calls checkAuth before navigating", async () => {
      setLocationHash(
        "#access_token=test-access-token&id_token=test-id-token&expires_in=900",
      );

      let checkAuthCalledBeforePush = false;
      mockCheckAuth.mockImplementation(async () => {
        if (!mockPush.mock.calls.length) {
          checkAuthCalledBeforePush = true;
        }
      });

      render(<CallbackPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });

      expect(checkAuthCalledBeforePush).toBe(true);
    });
  });

  describe("Error Handling - URL Error Params", () => {
    it("displays error when error param is present in URL", async () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn((param) => {
          if (param === "error") return "access_denied";
          if (param === "error_description") return "User denied access";
          return null;
        }),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<CallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Authentication Failed")).toBeInTheDocument();
        expect(screen.getByText("User denied access")).toBeInTheDocument();
      });
    });

    it("displays error code when no error_description", async () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn((param) => {
          if (param === "error") return "server_error";
          return null;
        }),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<CallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Authentication Failed")).toBeInTheDocument();
        expect(screen.getByText("server_error")).toBeInTheDocument();
      });
    });

    it("shows Return to Login button on error", async () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn((param) => {
          if (param === "error") return "access_denied";
          return null;
        }),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<CallbackPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Return to Login/i }),
        ).toBeInTheDocument();
      });
    });

    it("navigates to login when Return to Login is clicked", async () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn((param) => {
          if (param === "error") return "access_denied";
          return null;
        }),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<CallbackPage />);

      await waitFor(() => {
        const button = screen.getByRole("button", { name: /Return to Login/i });
        fireEvent.click(button);
      });

      expect(mockPush).toHaveBeenCalledWith("/auth/login");
    });
  });

  describe("Error Handling - No Tokens", () => {
    it("displays error when no tokens in hash", async () => {
      // Empty hash - no tokens (already set in beforeEach)
      render(<CallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Authentication Failed")).toBeInTheDocument();
        expect(
          screen.getByText(
            "No tokens received from authentication. Please try again.",
          ),
        ).toBeInTheDocument();
      });
    });

    it("displays error when only access_token is present (missing id_token)", async () => {
      setLocationHash("#access_token=test-access-token");

      render(<CallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Authentication Failed")).toBeInTheDocument();
        expect(
          screen.getByText(
            "No tokens received from authentication. Please try again.",
          ),
        ).toBeInTheDocument();
      });
    });

    it("displays error when only id_token is present (missing access_token)", async () => {
      setLocationHash("#id_token=test-id-token");

      render(<CallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Authentication Failed")).toBeInTheDocument();
        expect(
          screen.getByText(
            "No tokens received from authentication. Please try again.",
          ),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Token Storage", () => {
    it("does not store tokens when error is present", async () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn((param) => {
          if (param === "error") return "access_denied";
          return null;
        }),
      } as unknown as ReturnType<typeof useSearchParams>);

      // Even with tokens in hash, should not store them if error is present
      setLocationHash("#access_token=test-access-token&id_token=test-id-token");

      render(<CallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Authentication Failed")).toBeInTheDocument();
      });

      expect(mockSecureStorage.setAccessToken).not.toHaveBeenCalled();
      expect(mockSecureStorage.setIdToken).not.toHaveBeenCalled();
    });
  });

  describe("Authorization Code Flow (PKCE)", () => {
    const mockTokenResponse = {
      access_token: "code-flow-access-token",
      id_token: "code-flow-id-token",
      refresh_token: "code-flow-refresh-token",
      token_type: "Bearer",
      expires_in: 900,
    };

    beforeEach(() => {
      // Set env vars for token exchange
      process.env.NEXT_PUBLIC_COGNITO_DOMAIN =
        "sandbox-test.auth.us-west-2.amazoncognito.com";
      process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = "test-client-id";

      // Mock global fetch for token exchange
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockTokenResponse),
      });
    });

    afterEach(() => {
      delete process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
      delete process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
      (global.fetch as jest.Mock).mockRestore?.();
    });

    it("exchanges authorization code for tokens and stores all including refresh token", async () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn((param) => {
          if (param === "code") return "test-auth-code";
          return null;
        }),
      } as unknown as ReturnType<typeof useSearchParams>);

      mockConsumePKCEVerifier.mockReturnValue("test-code-verifier");
      mockCheckAuth.mockResolvedValue(undefined);

      render(<CallbackPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "https://sandbox-test.auth.us-west-2.amazoncognito.com/oauth2/token",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          }),
        );
      });

      await waitFor(() => {
        expect(mockSecureStorage.setAccessToken).toHaveBeenCalledWith(
          "code-flow-access-token",
        );
        expect(mockSecureStorage.setIdToken).toHaveBeenCalledWith(
          "code-flow-id-token",
        );
        expect(mockSecureStorage.setRefreshToken).toHaveBeenCalledWith(
          "code-flow-refresh-token",
        );
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });

    it("sends correct parameters in token exchange request", async () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn((param) => {
          if (param === "code") return "test-auth-code";
          return null;
        }),
      } as unknown as ReturnType<typeof useSearchParams>);

      mockConsumePKCEVerifier.mockReturnValue("test-code-verifier");
      mockCheckAuth.mockResolvedValue(undefined);

      render(<CallbackPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = fetchCall[1].body;
      const params = new URLSearchParams(body);

      expect(params.get("grant_type")).toBe("authorization_code");
      expect(params.get("client_id")).toBe("test-client-id");
      expect(params.get("code")).toBe("test-auth-code");
      expect(params.get("code_verifier")).toBe("test-code-verifier");
      expect(params.get("redirect_uri")).toContain("/auth/callback");
    });

    it("shows error when PKCE verifier is missing", async () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn((param) => {
          if (param === "code") return "test-auth-code";
          return null;
        }),
      } as unknown as ReturnType<typeof useSearchParams>);

      mockConsumePKCEVerifier.mockReturnValue(null);

      render(<CallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Authentication Failed")).toBeInTheDocument();
        expect(
          screen.getByText(
            "Authentication session expired. Please try signing in again.",
          ),
        ).toBeInTheDocument();
      });
    });

    it("shows error when token exchange fails", async () => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn((param) => {
          if (param === "code") return "test-auth-code";
          return null;
        }),
      } as unknown as ReturnType<typeof useSearchParams>);

      mockConsumePKCEVerifier.mockReturnValue("test-code-verifier");

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue("invalid_grant"),
      });

      render(<CallbackPage />);

      await waitFor(() => {
        expect(screen.getByText("Authentication Failed")).toBeInTheDocument();
        expect(
          screen.getByText("Failed to complete sign-in. Please try again."),
        ).toBeInTheDocument();
      });
    });

    it("prioritizes authorization code over hash tokens", async () => {
      // Both code param and hash tokens present -- code should take priority
      mockUseSearchParams.mockReturnValue({
        get: jest.fn((param) => {
          if (param === "code") return "test-auth-code";
          return null;
        }),
      } as unknown as ReturnType<typeof useSearchParams>);

      setLocationHash("#access_token=hash-token&id_token=hash-id-token");
      mockConsumePKCEVerifier.mockReturnValue("test-code-verifier");
      mockCheckAuth.mockResolvedValue(undefined);

      render(<CallbackPage />);

      await waitFor(() => {
        // Should use code flow tokens, not hash tokens
        expect(mockSecureStorage.setAccessToken).toHaveBeenCalledWith(
          "code-flow-access-token",
        );
        expect(mockSecureStorage.setRefreshToken).toHaveBeenCalledWith(
          "code-flow-refresh-token",
        );
      });
    });
  });
});
