"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { secureStorage } from "@/lib/auth/secure-storage";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { consumePKCEVerifier } from "@/lib/auth/pkce";

// Force dynamic rendering for pages using useSearchParams
export const dynamic = "force-dynamic";

/**
 * Exchange an authorization code for tokens via the Cognito /oauth2/token endpoint.
 * Uses PKCE code_verifier for public clients (no client secret).
 */
async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
): Promise<{
  access_token: string;
  id_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}> {
  const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

  if (!cognitoDomain || !clientId) {
    throw new Error("Missing Cognito configuration");
  }

  const redirectUri = `${window.location.origin}/auth/callback`;
  const tokenUrl = `https://${cognitoDomain}/oauth2/token`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      "[OAuth Callback] Token exchange failed:",
      response.status,
      errorBody,
    );
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json();
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    // Guard against duplicate execution. The effect can re-fire when
    // replaceState clears the hash or React re-renders the Suspense boundary.
    // Once we have processed the callback (success or error), skip subsequent runs.
    if (processedRef.current) {
      console.log(
        "[OAuth Callback] Already processed, skipping duplicate execution",
      );
      return;
    }

    const handleCallback = async () => {
      console.log("[OAuth Callback] Processing callback...");

      // Check for error in URL query params
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (errorParam) {
        console.error(
          "[OAuth Callback] Error in URL:",
          errorParam,
          errorDescription,
        );
        processedRef.current = true;
        setError(errorDescription || errorParam);
        return;
      }

      // Check for authorization code (code flow with PKCE)
      const authCode = searchParams.get("code");

      if (authCode) {
        processedRef.current = true;
        console.log(
          "[OAuth Callback] Authorization code received, exchanging for tokens...",
        );

        const codeVerifier = consumePKCEVerifier();
        if (!codeVerifier) {
          console.error(
            "[OAuth Callback] No PKCE code verifier found in session",
          );
          setError(
            "Authentication session expired. Please try signing in again.",
          );
          return;
        }

        try {
          const tokens = await exchangeCodeForTokens(authCode, codeVerifier);

          console.log("[OAuth Callback] Token exchange successful:", {
            hasAccessToken: !!tokens.access_token,
            hasIdToken: !!tokens.id_token,
            hasRefreshToken: !!tokens.refresh_token,
            expiresIn: tokens.expires_in,
          });

          // Store all tokens including refresh token
          secureStorage.setAccessToken(tokens.access_token);
          secureStorage.setIdToken(tokens.id_token);
          if (tokens.refresh_token) {
            secureStorage.setRefreshToken(tokens.refresh_token);
          }

          console.log(
            "[OAuth Callback] Tokens stored successfully (including refresh token)",
          );

          // Clean URL by removing the code parameter
          window.history.replaceState(null, "", window.location.pathname);

          // Update auth state and redirect
          console.log("[OAuth Callback] Updating auth state...");
          await checkAuth();
          console.log("[OAuth Callback] Auth state updated, redirecting...");

          router.push("/");
        } catch (err) {
          console.error("[OAuth Callback] Code exchange failed:", err);
          setError("Failed to complete sign-in. Please try again.");
        }
        return;
      }

      // Fallback: check for tokens in URL hash (legacy implicit flow)
      // This handles any in-flight implicit flow sessions during rollout
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const accessToken = params.get("access_token");
      const idToken = params.get("id_token");
      const expiresIn = params.get("expires_in");

      console.log("[OAuth Callback] Checking hash for implicit flow tokens:", {
        hasAccessToken: !!accessToken,
        hasIdToken: !!idToken,
        expiresIn,
      });

      if (accessToken && idToken) {
        // Mark as processed before any async work to prevent re-entry
        processedRef.current = true;

        // Store tokens using secure storage
        secureStorage.setAccessToken(accessToken);
        secureStorage.setIdToken(idToken);

        // Implicit flow does not return refresh tokens
        console.log(
          "[OAuth Callback] Implicit flow tokens stored (no refresh token)",
        );

        // Clear the hash from URL for security (tokens should not remain in URL)
        window.history.replaceState(null, "", window.location.pathname);

        // Update auth state with new tokens before navigating
        console.log("[OAuth Callback] Updating auth state...");
        await checkAuth();
        console.log("[OAuth Callback] Auth state updated, redirecting...");

        // Redirect to home page - AuthProvider will call getMe() to load user profile
        // For Google OAuth users, the backend getMe() endpoint handles:
        // 1. Existing users: Falls back to email lookup if userId not found, then syncs Cognito
        // 2. New users: Auto-creates DynamoDB profile with USER role
        router.push("/");
      } else {
        // Only treat as an error if we haven't already processed tokens.
        // This handles the case where the hash was cleared but tokens are already in memory.
        if (!secureStorage.getAccessToken()) {
          processedRef.current = true;
          console.error("[OAuth Callback] No tokens received");
          setError("No tokens received from authentication. Please try again.");
        } else {
          console.log(
            "[OAuth Callback] Hash already consumed, tokens exist in memory",
          );
          processedRef.current = true;
        }
      }
    };

    handleCallback();
  }, [router, searchParams, checkAuth]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Authentication Failed
          </h1>
          <p className="mb-6 text-gray-600">{error}</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
