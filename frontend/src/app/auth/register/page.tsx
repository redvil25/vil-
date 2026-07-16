"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useAuthContext } from "@/components/auth/AuthProvider";
import { UserRole } from "@/types/api.types";
import { createPKCEChallenge } from "@/lib/auth/pkce";

// Validation schema matching Cognito requirements
const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    username: z
      .string()
      .min(3, "Display name must be at least 3 characters")
      .max(30, "Display name must be less than 30 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Display name can only contain letters, numbers, hyphens, and underscores",
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const {
    register: registerUser,
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    clearError,
  } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  const password = useWatch({ control, name: "password" });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true);
      clearError();

      const { requiresEmailConfirmation } = await registerUser({
        email: data.email,
        password: data.password,
        username: data.username,
        role: UserRole.USER,
      });

      if (requiresEmailConfirmation) {
        // Cognito mode: User needs to confirm email before authentication
        setShowSuccess(true);
        setTimeout(() => {
          router.push(`/auth/confirm?email=${encodeURIComponent(data.email)}`);
        }, 2000);
      } else {
        // Mock/dev mode: User is immediately authenticated, redirect to homepage
        // The useEffect hook will handle the redirect via isAuthenticated state
        router.push("/");
      }
    } catch (error) {
      // Error is handled by auth context
      setIsSubmitting(false);
    }
  };

  const isLoading = authLoading || isSubmitting;

  /**
   * Redirect to Google OAuth via Cognito Hosted UI
   * Uses authorization code flow with PKCE for secure token exchange
   * (returns refresh tokens, unlike the implicit flow)
   */
  const handleGoogleSignUp = async () => {
    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

    if (!cognitoDomain || !clientId) {
      console.error(
        "[Register] Missing Cognito configuration for Google sign-up",
      );
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;

    // Generate PKCE challenge (required for public clients using code flow)
    const { codeChallenge, codeChallengeMethod } = await createPKCEChallenge();

    // Build the Cognito Hosted UI URL for Google sign-up using authorization code flow
    const googleAuthUrl =
      `https://${cognitoDomain}/oauth2/authorize?` +
      `identity_provider=Google&` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=email+openid+profile&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=${codeChallengeMethod}`;

    console.log(
      "[Register] Redirecting to Google sign-up (code flow with PKCE)",
    );
    window.location.href = googleAuthUrl;
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="rounded-md border border-green-200 bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Account created successfully!
                </h3>
                <p className="mt-2 text-sm text-green-700">
                  Redirecting to email confirmation...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit(onSubmit)}
          data-testid="registration-form"
          aria-label="User registration form"
        >
          {authError && (
            <div
              className="rounded-md border border-red-200 bg-red-50 p-4"
              data-testid="auth-error"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3
                    className="text-sm font-medium text-red-800"
                    data-testid="auth-error-message"
                  >
                    {authError}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                {...register("email")}
                id="email"
                type="email"
                autoComplete="email"
                className={`block w-full rounded-md border px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${
                  errors.email
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
                placeholder="you@example.com"
                disabled={isLoading}
                data-testid="email-input"
                aria-label="Email address"
                aria-required="true"
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p
                  className="mt-1 text-sm text-red-600"
                  id="email-error"
                  data-testid="email-error"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
              {!errors.email && (
                <p className="mt-1 text-xs text-gray-500">
                  We&apos;ll send you a verification code to confirm your email.
                  We only send transactional emails required for account
                  operation.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="username"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Display name
              </label>
              <input
                {...register("username")}
                id="username"
                type="text"
                autoComplete="username"
                className={`block w-full rounded-md border px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${
                  errors.username
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
                placeholder="Your public display name"
                disabled={isLoading}
                data-testid="username-input"
                aria-label="Display name"
                aria-required="true"
                aria-invalid={errors.username ? "true" : "false"}
                aria-describedby={
                  errors.username ? "username-error" : undefined
                }
              />
              {errors.username && (
                <p
                  className="mt-1 text-sm text-red-600"
                  id="username-error"
                  role="alert"
                >
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                {...register("password")}
                id="password"
                type="password"
                autoComplete="new-password"
                className={`block w-full rounded-md border px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${
                  errors.password
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
                placeholder="Enter a strong password"
                disabled={isLoading}
                data-testid="password-input"
                aria-label="Password"
                aria-required="true"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={
                  errors.password ? "password-error" : "password-help"
                }
              />
              {errors.password && (
                <p
                  className="mt-1 text-sm text-red-600"
                  id="password-error"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
              {password && !errors.password && (
                <p className="mt-1 text-xs text-gray-500" id="password-help">
                  Password must be at least 8 characters with uppercase,
                  lowercase, and numbers
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Confirm password
              </label>
              <input
                {...register("confirmPassword")}
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className={`block w-full rounded-md border px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${
                  errors.confirmPassword
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
                placeholder="Confirm your password"
                disabled={isLoading}
                data-testid="confirm-password-input"
                aria-label="Confirm password"
                aria-required="true"
                aria-invalid={errors.confirmPassword ? "true" : "false"}
                aria-describedby={
                  errors.confirmPassword ? "confirm-password-error" : undefined
                }
              />
              {errors.confirmPassword && (
                <p
                  className="mt-1 text-sm text-red-600"
                  id="confirm-password-error"
                  role="alert"
                >
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  {...register("acceptTerms")}
                  id="acceptTerms"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isLoading}
                  data-testid="accept-terms-checkbox"
                  aria-label="Accept terms and conditions"
                  aria-required="true"
                  aria-invalid={errors.acceptTerms ? "true" : "false"}
                  aria-describedby={
                    errors.acceptTerms ? "terms-error" : undefined
                  }
                />
              </div>
              <div className="ml-2">
                <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                  I accept the{" "}
                  <Link
                    href="/legal/terms"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/legal/privacy"
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Privacy Policy
                  </Link>
                </label>
                {errors.acceptTerms && (
                  <p
                    className="mt-1 text-sm text-red-600"
                    id="terms-error"
                    data-testid="terms-error"
                    role="alert"
                  >
                    {errors.acceptTerms.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="submit-button"
            >
              {isSubmitting ? (
                <>
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  </span>
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-up Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              data-testid="google-signup-button"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
