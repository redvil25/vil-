"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext, useHasRole } from "@/components/auth/AuthProvider";
import { UserRole } from "@/types/api.types";

/**
 * User avatar component with fallback to initials
 */
function UserAvatar({
  avatarUrl,
  username,
  size = "sm",
}: {
  avatarUrl?: string;
  username: string;
  size?: "sm" | "md";
}) {
  const [avatarError, setAvatarError] = useState(false);
  const showAvatar = avatarUrl && !avatarError;
  const sizeClasses = size === "sm" ? "h-6 w-6" : "h-10 w-10";
  const textSize = size === "sm" ? "text-xs" : "text-base";

  return (
    <div className={`relative ${sizeClasses} overflow-hidden rounded-full`}>
      {showAvatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`${username}'s avatar`}
          className="h-full w-full object-cover"
          onError={() => setAvatarError(true)}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center bg-blue-100 ${textSize} font-medium text-blue-600`}
        >
          {username.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthContext();
  const isAdmin = useHasRole(UserRole.ADMIN);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const adminNavigation = [{ name: "Admin", href: "/admin" }];

  const isActiveLink = (href: string) => {
    if (href === "/") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex flex-shrink-0 items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">Sandbox</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden flex-shrink-0 md:flex md:items-center md:space-x-6">
            {/* Admin navigation */}
            {isAuthenticated &&
              isAdmin &&
              adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActiveLink(item.href)
                      ? "text-blue-600"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                >
                  {item.name}
                </Link>
              ))}

            {/* Auth buttons */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  data-testid="user-menu-button"
                  aria-label={`User menu for ${user?.username || user?.email}`}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <UserAvatar
                    avatarUrl={user?.avatarUrl}
                    username={user?.username || user?.email || "?"}
                  />
                  <span>{user?.username || user?.email}</span>
                  <svg
                    className={`h-4 w-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                  >
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                        data-testid="logout-button"
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              aria-label={mobileMenuOpen ? "Close main menu" : "Open main menu"}
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">
                {mobileMenuOpen ? "Close main menu" : "Open main menu"}
              </span>
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 pb-3 pt-4 md:hidden">
            {isAuthenticated && user ? (
              <>
                {/* User info */}
                <div className="flex items-center gap-3 px-4 pb-3">
                  <UserAvatar
                    avatarUrl={user?.avatarUrl}
                    username={user?.username || user?.email || "?"}
                    size="md"
                  />
                  <div>
                    <div className="text-base font-medium text-gray-800">
                      {user?.username || user?.email}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {user?.role}
                    </div>
                  </div>
                </div>

                {/* Navigation links */}
                <div className="space-y-1 px-2 pt-2">
                  {isAdmin &&
                    adminNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`block rounded-md px-3 py-2 text-base font-medium ${
                          isActiveLink(item.href)
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                </div>

                {/* User menu */}
                <div className="mt-3 space-y-1 border-t border-gray-200 px-2 pt-2">
                  <Link
                    href="/profile"
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    data-testid="mobile-logout-button"
                    aria-label="Sign out"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-1 px-2 pt-3">
                <Link
                  href="/auth/login"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="block rounded-md bg-blue-600 px-3 py-2 text-base font-medium text-white hover:bg-blue-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
