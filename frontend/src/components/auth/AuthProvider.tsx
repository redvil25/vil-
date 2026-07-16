"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAuth, type UseAuthReturn } from "@/lib/hooks/use-auth";
import { UserRole } from "@/types/api.types";

/**
 * Authentication context type
 */
type AuthContextType = UseAuthReturn;

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 *
 * Provides authentication state and methods to the entire application via React Context.
 * Wraps the application to enable auth state management throughout the component tree.
 *
 * Features:
 * - Global auth state management
 * - Automatic token refresh
 * - Persistent auth state across page reloads
 * - Login/logout/register operations
 *
 * @example
 * ```tsx
 * // In app layout
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 *
 * // In any component
 * function MyComponent() {
 *   const { user, isAuthenticated, login } = useAuthContext();
 *   // ...
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 *
 * Must be used within an AuthProvider component.
 * Provides access to authentication state and operations.
 *
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function LoginButton() {
 *   const { isAuthenticated, login, logout } = useAuthContext();
 *
 *   if (isAuthenticated) {
 *     return <button onClick={logout}>Logout</button>;
 *   }
 *
 *   return <button onClick={() => login({ email, password })}>Login</button>;
 * }
 * ```
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
}

/**
 * Hook to check if user has a specific role
 *
 * Convenience hook for role-based access control.
 *
 * @param requiredRole - The role to check for (UserRole.USER or UserRole.ADMIN)
 * @returns Boolean indicating if user has the required role
 *
 * @example
 * ```tsx
 * function AdminOnlyFeature() {
 *   const hasAdminRole = useHasRole(UserRole.ADMIN);
 *
 *   if (!hasAdminRole) {
 *     return <div>You must be an admin to access this feature</div>;
 *   }
 *
 *   return <div>Admin feature content...</div>;
 * }
 * ```
 */
export function useHasRole(requiredRole: UserRole): boolean {
  const { user } = useAuthContext();

  if (!user) {
    return false;
  }

  // Admin has access to everything
  if (user.role === UserRole.ADMIN) {
    return true;
  }

  // User has access to USER features only
  if (user.role === UserRole.USER && requiredRole === UserRole.USER) {
    return true;
  }

  return false;
}

/**
 * Hook to check if user is authenticated
 *
 * Convenience hook to quickly check authentication status.
 *
 * @returns Boolean indicating if user is authenticated
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isAuthenticated = useIsAuthenticated();
 *
 *   return (
 *     <div>
 *       {isAuthenticated ? 'Welcome!' : 'Please login'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated;
}
