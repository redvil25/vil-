/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0 authorization code flow.
 *
 * PKCE is required for public clients (SPAs without a client secret) to securely
 * exchange authorization codes for tokens. It prevents authorization code interception
 * attacks by binding the token request to the original authorization request.
 *
 * Flow:
 * 1. Generate a random code_verifier
 * 2. Derive code_challenge = BASE64URL(SHA256(code_verifier))
 * 3. Send code_challenge with the authorization request
 * 4. Send code_verifier with the token exchange request
 * 5. Server verifies SHA256(code_verifier) === code_challenge
 *
 * @module pkce
 */

const PKCE_VERIFIER_KEY = "sandbox_pkce_code_verifier";

/**
 * Generate a cryptographically random code verifier (43-128 characters).
 * Uses Web Crypto API for secure random generation.
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Derive a code challenge from a code verifier using SHA-256.
 * code_challenge = BASE64URL(SHA256(code_verifier))
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Base64url-encode a Uint8Array (RFC 7636 Appendix A).
 * Standard base64 with +/ replaced by -_ and padding removed.
 */
function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Generate and store a PKCE code verifier, returning the derived code challenge.
 * The verifier is stored in sessionStorage so it survives the OAuth redirect
 * but is cleared when the browser tab closes.
 */
export async function createPKCEChallenge(): Promise<{
  codeChallenge: string;
  codeChallengeMethod: string;
}> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store verifier in sessionStorage (survives redirect, cleared on tab close)
  if (typeof window !== "undefined") {
    sessionStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier);
  }

  return {
    codeChallenge,
    codeChallengeMethod: "S256",
  };
}

/**
 * Retrieve and consume the stored PKCE code verifier.
 * Returns null if no verifier is stored (e.g., session expired or different tab).
 * The verifier is removed from storage after retrieval to prevent reuse.
 */
export function consumePKCEVerifier(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  if (verifier) {
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  }
  return verifier;
}
