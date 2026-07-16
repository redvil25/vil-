"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "./AuthProvider";
import { UserRole } from "@/types/api.types";

/**
 * Props for ProtectedRoute component
 */
interface ProtectedRouteProps {
  children: ReactNode;
  /** Required role to access this route. If not specified, any authenticated user can access. */
  requiredRole?: UserRole;
  /** Custom fallback component to show while loading */
  loadingFallback?: ReactNode;
  /** Custom fallback component to show when unauthorized */
  unauthorizedFallback?: ReactNode;
  /** Redirect path for unauthenticated users (default: /auth/login) */
  redirectTo?: string;
}

/**
 * Protected Route Component
 *
 * Higher-order component that protects routes requiring authentication and/or specific roles.
 * Redirects unauthenticated users to the login page and shows an error for unauthorized access.
 *
 * Features:
 * - Authentication check
 * - Role-based access control
 * - Automatic redirect to login
 * - Custom loading and unauthorized states
 *
 * @example
 * ```tsx
 * // Protect a route requiring authentication
 * export default function DashboardPage() {
 *   return (
 *     <ProtectedRoute>
 *       <Dashboard />
 *     </ProtectedRoute>
 *   );
 * }
 *
 * // Protect a route requiring Writer role
 * export default function WritePage() {
 *   return (
 *     <ProtectedRoute requiredRole="WRITER">
 *       <WriterDashboard />
 *     </ProtectedRoute>
 *   );
 * }
 *
 * // Protect a route requiring Admin role
 * export default function AdminPage() {
 *   return (
 *     <ProtectedRoute requiredRole="ADMIN">
 *       <AdminDashboard />
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 */
export function ProtectedRoute({
  children,
  requiredRole,
  loadingFallback,
  unauthorizedFallback,
  redirectTo = "/auth/login",
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthContext();

  useEffect(() => {
    console.log("[ProtectedRoute] useEffect triggered", {
      isLoading,
      isAuthenticated,
      user: user ? { userId: user.userId, role: user.role } : null,
      pathname,
      requiredRole,
    });

    // Don't redirect while still loading
    if (isLoading) {
      console.log("[ProtectedRoute] Still loading, skipping redirect check");
      return;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      console.log("[ProtectedRoute] Not authenticated, redirecting to login");
      // Save the current path to redirect back after login
      const returnUrl =
        pathname !== redirectTo
          ? `?returnUrl=${encodeURIComponent(pathname)}`
          : "";
      router.push(`${redirectTo}${returnUrl}`);
    } else {
      console.log(
        "[ProtectedRoute] User is authenticated, rendering protected content",
      );
    }
  }, [
    isAuthenticated,
    isLoading,
    router,
    pathname,
    redirectTo,
    user,
    requiredRole,
  ]);

  // Show loading state
  if (isLoading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }

    return (
      <div
        className="flex min-h-screen items-center justify-center"
        data-testid="protected-route-loading"
        role="status"
        aria-live="polite"
        aria-label="Loading authentication status"
      >
        <div className="text-center">
          <div
            className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
            aria-hidden="true"
          ></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Check role if required
  if (requiredRole) {
    const hasRequiredRole = checkRole(user.role, requiredRole);

    if (!hasRequiredRole) {
      if (unauthorizedFallback) {
        return <>{unauthorizedFallback}</>;
      }

      return (
        <div
          className="flex min-h-screen items-center justify-center"
          data-testid="access-denied"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
            <h1
              className="mb-2 text-2xl font-bold text-destructive"
              data-testid="access-denied-title"
              id="access-denied-heading"
            >
              Access Denied
            </h1>
            <p
              className="mb-4 text-muted-foreground"
              data-testid="access-denied-message"
              aria-describedby="access-denied-heading"
            >
              You don&apos;t have permission to access this page. This page
              requires <span className="font-semibold">{requiredRole}</span>{" "}
              role.
            </p>
            <p className="text-sm text-muted-foreground">
              Your current role:{" "}
              <span className="font-semibold">{user.role}</span>
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              data-testid="go-to-homepage-button"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required role (if specified)
  return <>{children}</>;
}

/**
 * Check if a user role has access to a required role
 *
 * Role hierarchy:
 * - ADMIN has access to everything
 * - USER only has access to USER features
 *
 * @param userRole - The user's current role
 * @param requiredRole - The required role for access
 * @returns Boolean indicating if user has access
 */
function checkRole(userRole: UserRole, requiredRole: UserRole): boolean {
  // Admin has access to everything
  if (userRole === UserRole.ADMIN) {
    return true;
  }

  // User has access to USER features only
  if (userRole === UserRole.USER) {
    return requiredRole === UserRole.USER;
  }

  return false;
}

/**
 * Wrapper component to require authentication only (no role check)
 *
 * Convenience wrapper for routes that just need authentication.
 *
 * @example
 * ```tsx
 * export default function ProfilePage() {
 *   return (
 *     <RequireAuth>
 *       <UserProfile />
 *     </RequireAuth>
 *   );
 * }
 * ```
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

/**
 * Wrapper component to require User role
 *
 * Convenience wrapper for authenticated user routes.
 *
 * @example
 * ```tsx
 * export default function ProfilePage() {
 *   return (
 *     <RequireUser>
 *       <UserDashboard />
 *     </RequireUser>
 *   );
 * }
 * ```
 */
export function RequireUser({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole={UserRole.USER}>{children}</ProtectedRoute>
  );
}

/**
 * Wrapper component to require Admin role
 *
 * Convenience wrapper for Admin-only routes.
 *
 * @example
 * ```tsx
 * export default function AdminPage() {
 *   return (
 *     <RequireAdmin>
 *       <AdminDashboard />
 *     </RequireAdmin>
 *   );
 * }
 * ```
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>{children}</ProtectedRoute>
  );
}
