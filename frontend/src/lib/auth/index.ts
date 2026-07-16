/**
 * Authentication Module
 *
 * Exports all authentication-related utilities, hooks, and components.
 */

// Hooks
export { useAuth } from "@/lib/hooks/use-auth";
export type { AuthState, UseAuthReturn } from "@/lib/hooks/use-auth";

// Context and Providers
export {
  AuthProvider,
  useAuthContext,
  useHasRole,
  useIsAuthenticated,
} from "@/components/auth/AuthProvider";

// Route Protection
export {
  ProtectedRoute,
  RequireAuth,
  RequireUser,
  RequireAdmin,
} from "@/components/auth/ProtectedRoute";

// Secure Storage
export { secureStorage } from "./secure-storage";
