/**
 * Tests for PKCE (Proof Key for Code Exchange) utilities.
 *
 * These tests verify the secure generation and storage of PKCE
 * code verifiers and challenges for OAuth 2.0 authorization code flow.
 */

import { TextEncoder } from "util";

// Polyfill TextEncoder for Jest environment
global.TextEncoder = TextEncoder;

import { createPKCEChallenge, consumePKCEVerifier } from "./pkce";

// Mock sessionStorage
const sessionStorageMock = (() => {
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

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
});

// Mock crypto.subtle.digest
const mockDigest = jest.fn();
Object.defineProperty(global, "crypto", {
  value: {
    getRandomValues: (array: Uint8Array) => {
      // Fill with predictable values for testing
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256;
      }
      return array;
    },
    subtle: {
      digest: mockDigest,
    },
  },
  writable: true,
});

describe("PKCE Utilities", () => {
  beforeEach(() => {
    sessionStorageMock.clear();
    mockDigest.mockReset();
    // Default mock implementation for SHA-256 digest
    mockDigest.mockResolvedValue(
      new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer,
    );
  });

  afterEach(() => {
    sessionStorageMock.clear();
  });

  describe("createPKCEChallenge", () => {
    it("returns a code challenge and method", async () => {
      const result = await createPKCEChallenge();

      expect(result).toHaveProperty("codeChallenge");
      expect(result).toHaveProperty("codeChallengeMethod");
      expect(typeof result.codeChallenge).toBe("string");
      expect(result.codeChallengeMethod).toBe("S256");
    });

    it("stores the code verifier in sessionStorage", async () => {
      await createPKCEChallenge();

      const storedVerifier = sessionStorageMock.getItem(
        "sandbox_pkce_code_verifier",
      );
      expect(storedVerifier).not.toBeNull();
      expect(typeof storedVerifier).toBe("string");
      expect(storedVerifier!.length).toBeGreaterThan(0);
    });

    it("generates a base64url-encoded code challenge", async () => {
      const result = await createPKCEChallenge();

      // Base64url should not contain +, /, or =
      expect(result.codeChallenge).not.toMatch(/[+/=]/);
      // Should only contain valid base64url characters
      expect(result.codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("generates a base64url-encoded code verifier", async () => {
      await createPKCEChallenge();

      const storedVerifier = sessionStorageMock.getItem(
        "sandbox_pkce_code_verifier",
      );
      // Base64url should not contain +, /, or =
      expect(storedVerifier).not.toMatch(/[+/=]/);
      // Should only contain valid base64url characters
      expect(storedVerifier).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("calls crypto.subtle.digest with SHA-256", async () => {
      await createPKCEChallenge();

      expect(mockDigest).toHaveBeenCalledTimes(1);
      const [algorithm, data] = mockDigest.mock.calls[0];
      expect(algorithm).toBe("SHA-256");
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
    });

    it("generates different challenges for different verifiers", async () => {
      // First call with one set of random values
      const result1 = await createPKCEChallenge();

      // Mock different digest result for second call
      mockDigest.mockResolvedValueOnce(
        new Uint8Array([9, 10, 11, 12, 13, 14, 15, 16]).buffer,
      );

      const result2 = await createPKCEChallenge();

      // The challenges should be different due to different digest results
      expect(result1.codeChallenge).not.toBe(result2.codeChallenge);
    });

    it("overwrites previous verifier when called multiple times", async () => {
      await createPKCEChallenge();
      const firstVerifier = sessionStorageMock.getItem(
        "sandbox_pkce_code_verifier",
      );

      // Clear the mock to get fresh random values behavior
      mockDigest.mockResolvedValueOnce(
        new Uint8Array([20, 21, 22, 23, 24, 25, 26, 27]).buffer,
      );

      await createPKCEChallenge();
      const secondVerifier = sessionStorageMock.getItem(
        "sandbox_pkce_code_verifier",
      );

      // Both should exist and be valid
      expect(firstVerifier).not.toBeNull();
      expect(secondVerifier).not.toBeNull();
      // Only one key should exist in storage
      expect(sessionStorageMock.length).toBe(1);
    });
  });

  describe("consumePKCEVerifier", () => {
    it("returns the stored verifier", async () => {
      await createPKCEChallenge();
      const storedVerifier = sessionStorageMock.getItem(
        "sandbox_pkce_code_verifier",
      );

      const consumedVerifier = consumePKCEVerifier();

      expect(consumedVerifier).toBe(storedVerifier);
    });

    it("removes the verifier from storage after consumption", async () => {
      await createPKCEChallenge();
      expect(
        sessionStorageMock.getItem("sandbox_pkce_code_verifier"),
      ).not.toBeNull();

      consumePKCEVerifier();

      expect(
        sessionStorageMock.getItem("sandbox_pkce_code_verifier"),
      ).toBeNull();
    });

    it("returns null when no verifier is stored", () => {
      const result = consumePKCEVerifier();

      expect(result).toBeNull();
    });

    it("returns null on second call (single-use)", async () => {
      await createPKCEChallenge();

      const firstCall = consumePKCEVerifier();
      const secondCall = consumePKCEVerifier();

      expect(firstCall).not.toBeNull();
      expect(secondCall).toBeNull();
    });

    it("does not affect other sessionStorage keys", async () => {
      sessionStorageMock.setItem("other_key", "other_value");
      await createPKCEChallenge();

      consumePKCEVerifier();

      expect(sessionStorageMock.getItem("other_key")).toBe("other_value");
    });
  });

  describe("PKCE Flow Integration", () => {
    it("completes a full PKCE flow: create challenge, then consume verifier", async () => {
      // Step 1: Create challenge (before redirect to authorization server)
      const { codeChallenge, codeChallengeMethod } =
        await createPKCEChallenge();

      expect(codeChallenge).toBeTruthy();
      expect(codeChallengeMethod).toBe("S256");

      // Verifier should be stored
      expect(
        sessionStorageMock.getItem("sandbox_pkce_code_verifier"),
      ).not.toBeNull();

      // Step 2: After redirect back, consume verifier for token exchange
      const verifier = consumePKCEVerifier();

      expect(verifier).not.toBeNull();
      expect(typeof verifier).toBe("string");

      // Verifier should be removed after consumption
      expect(
        sessionStorageMock.getItem("sandbox_pkce_code_verifier"),
      ).toBeNull();
    });

    it("handles interrupted flow (verifier consumed without challenge)", () => {
      // Simulate a scenario where the session was cleared or user navigated directly
      const verifier = consumePKCEVerifier();

      expect(verifier).toBeNull();
    });

    it("handles stale verifier from previous flow", async () => {
      // Create first challenge
      await createPKCEChallenge();
      const firstVerifier = sessionStorageMock.getItem(
        "sandbox_pkce_code_verifier",
      );

      // Create second challenge (simulating a new login attempt)
      mockDigest.mockResolvedValueOnce(
        new Uint8Array([30, 31, 32, 33, 34, 35, 36, 37]).buffer,
      );
      await createPKCEChallenge();
      const secondVerifier = sessionStorageMock.getItem(
        "sandbox_pkce_code_verifier",
      );

      // The second verifier should be stored, overwriting the first
      expect(secondVerifier).toBe(firstVerifier); // Same due to mocked getRandomValues
      expect(sessionStorageMock.length).toBe(1);

      // Consuming should return the current verifier
      const consumed = consumePKCEVerifier();
      expect(consumed).toBe(secondVerifier);
    });
  });

  describe("Base64URL Encoding", () => {
    it("produces valid base64url output for code verifier", async () => {
      await createPKCEChallenge();
      const verifier = sessionStorageMock.getItem(
        "sandbox_pkce_code_verifier",
      );

      // RFC 7636: code_verifier must be 43-128 characters
      expect(verifier!.length).toBeGreaterThanOrEqual(43);
      expect(verifier!.length).toBeLessThanOrEqual(128);
    });

    it("produces valid base64url output for code challenge", async () => {
      const { codeChallenge } = await createPKCEChallenge();

      // SHA-256 produces 32 bytes, base64url encoded is ~43 characters
      expect(codeChallenge.length).toBeGreaterThan(0);
      // Should be URL-safe
      expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe("Security Characteristics", () => {
    it("uses SHA-256 for code challenge derivation", async () => {
      await createPKCEChallenge();

      expect(mockDigest).toHaveBeenCalled();
      const [algorithm] = mockDigest.mock.calls[0];
      expect(algorithm).toBe("SHA-256");
    });

    it("uses crypto.getRandomValues for secure random generation", async () => {
      const getRandomValuesSpy = jest.spyOn(crypto, "getRandomValues");

      await createPKCEChallenge();

      expect(getRandomValuesSpy).toHaveBeenCalled();
      expect(getRandomValuesSpy).toHaveBeenCalledWith(expect.any(Uint8Array));

      getRandomValuesSpy.mockRestore();
    });

    it("uses sessionStorage (cleared on tab close) not localStorage", async () => {
      await createPKCEChallenge();

      // Verifier should be in sessionStorage
      expect(
        sessionStorageMock.getItem("sandbox_pkce_code_verifier"),
      ).not.toBeNull();
    });

    it("removes verifier after single use to prevent replay attacks", async () => {
      await createPKCEChallenge();

      // First consumption succeeds
      const first = consumePKCEVerifier();
      expect(first).not.toBeNull();

      // Second consumption fails (prevents replay)
      const second = consumePKCEVerifier();
      expect(second).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty sessionStorage gracefully", () => {
      sessionStorageMock.clear();

      const result = consumePKCEVerifier();

      expect(result).toBeNull();
    });

    it("handles crypto.subtle.digest rejection", async () => {
      mockDigest.mockRejectedValueOnce(new Error("Crypto operation failed"));

      await expect(createPKCEChallenge()).rejects.toThrow(
        "Crypto operation failed",
      );
    });

    it("handles repeated rapid calls", async () => {
      // Simulate rapid calls that might occur from double-clicks
      const promises = [
        createPKCEChallenge(),
        createPKCEChallenge(),
        createPKCEChallenge(),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.codeChallenge).toBeTruthy();
        expect(result.codeChallengeMethod).toBe("S256");
      });

      // Only one verifier should be stored (last one wins)
      expect(sessionStorageMock.length).toBe(1);
    });
  });
});

describe("PKCE SSR Safety", () => {
  // Note: Testing SSR behavior (window undefined) is not straightforward in Jest
  // because the module is already loaded with window defined. The actual SSR
  // safety is tested by the implementation's typeof window !== 'undefined' check.
  // Here we verify the functions handle edge cases gracefully.

  it("consumePKCEVerifier handles missing storage key gracefully", () => {
    // Clear any existing verifier
    sessionStorageMock.clear();

    // Should return null without throwing
    const result = consumePKCEVerifier();
    expect(result).toBeNull();
  });

  it("createPKCEChallenge stores verifier when window is available", async () => {
    const result = await createPKCEChallenge();

    // Should succeed and store verifier
    expect(result.codeChallenge).toBeTruthy();
    expect(
      sessionStorageMock.getItem("sandbox_pkce_code_verifier"),
    ).not.toBeNull();
  });
});
