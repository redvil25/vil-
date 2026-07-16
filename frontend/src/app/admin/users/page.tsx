"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RequireAdmin } from "@/components/auth/ProtectedRoute";
import { adminAPI } from "@/lib/api/endpoints/admin";
import {
  AdminUserSummary,
  AdminUserDetails,
  UserRole,
  AccountStatus,
} from "@/types/api.types";

// Tab type for filtering users
type UserTab = "all" | "users" | "admins";

// Display status values derived from account + cognito status
type DisplayStatus =
  | "all"
  | "Active"
  | "Disabled"
  | "Unconfirmed"
  | "Password Reset"
  | "Reset Required";

function UserManagementContent() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<UserTab>("all");
  const [statusFilter, setStatusFilter] = useState<DisplayStatus>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUserDetails | null>(
    null,
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    lastKey?: string;
    hasMore: boolean;
  }>({ hasMore: false });

  // Fetch users based on active tab
  const fetchUsers = useCallback(async (role?: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.listUsers({ role, limit: 50 });
      setUsers(response.users);
      setPagination({
        lastKey: response.pagination.lastKey,
        hasMore: response.pagination.hasMore,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load users when tab changes
  useEffect(() => {
    const roleMap: Record<UserTab, UserRole | undefined> = {
      all: undefined,
      users: UserRole.USER,
      admins: UserRole.ADMIN,
    };
    fetchUsers(roleMap[activeTab]);
  }, [activeTab, fetchUsers]);

  // Fetch user details
  const handleViewDetails = async (userId: string) => {
    setDetailsLoading(true);
    try {
      const details = await adminAPI.getUserDetails(userId);
      setSelectedUser(details);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch user details",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // Enable user
  const handleEnableUser = async (userId: string) => {
    if (!confirm("Are you sure you want to enable this user?")) return;
    setActionLoading(userId);
    try {
      await adminAPI.enableUser(userId);
      const roleMap: Record<UserTab, UserRole | undefined> = {
        all: undefined,
        users: UserRole.USER,
        admins: UserRole.ADMIN,
      };
      await fetchUsers(roleMap[activeTab]);
      if (selectedUser?.userId === userId) {
        const details = await adminAPI.getUserDetails(userId);
        setSelectedUser(details);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable user");
    } finally {
      setActionLoading(null);
    }
  };

  // Disable user
  const handleDisableUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to disable this user? They will not be able to log in.",
      )
    )
      return;
    setActionLoading(userId);
    try {
      await adminAPI.disableUser(userId);
      const roleMap: Record<UserTab, UserRole | undefined> = {
        all: undefined,
        users: UserRole.USER,
        admins: UserRole.ADMIN,
      };
      await fetchUsers(roleMap[activeTab]);
      if (selectedUser?.userId === userId) {
        const details = await adminAPI.getUserDetails(userId);
        setSelectedUser(details);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable user");
    } finally {
      setActionLoading(null);
    }
  };

  // Reset password
  const handleResetPassword = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to send a password reset email to this user?",
      )
    )
      return;
    setActionLoading(userId);
    try {
      await adminAPI.resetUserPassword(userId);
      alert("Password reset email sent successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setActionLoading(null);
    }
  };

  // Derive a display status from account status, Cognito status, and email verified
  const getDisplayStatus = (
    user: AdminUserSummary | AdminUserDetails,
  ): string => {
    if (user.accountStatus === AccountStatus.DISABLED) return "Disabled";
    if (user.cognitoStatus === "EXTERNAL_PROVIDER") return "Active";
    if (user.cognitoStatus === "UNCONFIRMED" || !user.emailVerified)
      return "Unconfirmed";
    if (user.cognitoStatus === "FORCE_CHANGE_PASSWORD") return "Password Reset";
    if (user.cognitoStatus === "RESET_REQUIRED") return "Reset Required";
    return "Active";
  };

  // Get status badge color based on display status
  const getStatusBadgeClass = (user: AdminUserSummary | AdminUserDetails) => {
    const displayStatus = getDisplayStatus(user);
    switch (displayStatus) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Disabled":
        return "bg-red-100 text-red-800";
      case "Unconfirmed":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-orange-100 text-orange-800";
    }
  };

  // Get role badge color
  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter users by selected display status
  const filteredUsers =
    statusFilter === "all"
      ? users
      : users.filter((user) => getDisplayStatus(user) === statusFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm">
          <Link href="/admin" className="text-blue-600 hover:text-blue-800">
            Admin Dashboard
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">User Management</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">View and manage user accounts</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
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
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-500"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs and Filters */}
        <div className="mb-6 flex items-end justify-between border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {(["all", "users", "admins"] as UserTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab
                    ? "border-purple-500 text-purple-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>

          <div className="mb-3 flex items-center gap-2">
            <label
              htmlFor="status-filter"
              className="text-sm font-medium text-gray-700"
            >
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DisplayStatus)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
              <option value="Unconfirmed">Unconfirmed</option>
              <option value="Password Reset">Password Reset</option>
              <option value="Reset Required">Reset Required</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* User List */}
          <div className="flex-1">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  {statusFilter !== "all" && users.length > 0
                    ? `No users with status "${statusFilter}"`
                    : "No users found"}
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.userId}
                        className={`hover:bg-gray-50 ${
                          selectedUser?.userId === user.userId
                            ? "bg-purple-50"
                            : ""
                        }`}
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getRoleBadgeClass(
                              user.role,
                            )}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(user)}`}
                          >
                            {getDisplayStatus(user)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <button
                            onClick={() => handleViewDetails(user.userId)}
                            className="mr-2 text-purple-600 hover:text-purple-900"
                          >
                            View
                          </button>
                          {user.role !== UserRole.ADMIN && (
                            <>
                              {user.accountStatus === AccountStatus.ACTIVE ? (
                                <button
                                  onClick={() => handleDisableUser(user.userId)}
                                  disabled={actionLoading === user.userId}
                                  className="mr-2 text-red-600 hover:text-red-900 disabled:opacity-50"
                                >
                                  Disable
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleEnableUser(user.userId)}
                                  disabled={actionLoading === user.userId}
                                  className="mr-2 text-green-600 hover:text-green-900 disabled:opacity-50"
                                >
                                  Enable
                                </button>
                              )}
                              <button
                                onClick={() => handleResetPassword(user.userId)}
                                disabled={actionLoading === user.userId}
                                className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                              >
                                Reset PW
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Load More */}
              {pagination.hasMore && !loading && (
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 text-center">
                  <button className="text-sm font-medium text-purple-600 hover:text-purple-500">
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* User Details Panel */}
          {selectedUser && (
            <div className="w-96 flex-shrink-0">
              <div className="sticky top-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    User Details
                  </h2>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {detailsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium uppercase text-gray-500">
                        Username
                      </label>
                      <p className="text-gray-900">{selectedUser.username}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase text-gray-500">
                        Email
                      </label>
                      <p className="text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase text-gray-500">
                        Role
                      </label>
                      <p>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getRoleBadgeClass(selectedUser.role)}`}
                        >
                          {selectedUser.role}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase text-gray-500">
                        Account Status
                      </label>
                      <p>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(selectedUser)}`}
                        >
                          {getDisplayStatus(selectedUser)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase text-gray-500">
                        Cognito Status
                      </label>
                      <p className="text-gray-900">
                        {selectedUser.cognitoStatus}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase text-gray-500">
                        Email Verified
                      </label>
                      <p className="text-gray-900">
                        {selectedUser.emailVerified ? "Yes" : "No"}
                      </p>
                    </div>
                    {selectedUser.bio && (
                      <div>
                        <label className="text-xs font-medium uppercase text-gray-500">
                          Bio
                        </label>
                        <p className="text-gray-900">{selectedUser.bio}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium uppercase text-gray-500">
                        Created
                      </label>
                      <p className="text-gray-900">
                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedUser.lastActiveAt && (
                      <div>
                        <label className="text-xs font-medium uppercase text-gray-500">
                          Last Active
                        </label>
                        <p className="text-gray-900">
                          {new Date(selectedUser.lastActiveAt).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {selectedUser.role !== UserRole.ADMIN && (
                      <div className="space-y-2 border-t border-gray-200 pt-4">
                        {selectedUser.accountStatus === AccountStatus.ACTIVE ? (
                          <button
                            onClick={() =>
                              handleDisableUser(selectedUser.userId)
                            }
                            disabled={actionLoading === selectedUser.userId}
                            className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Disable Account
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleEnableUser(selectedUser.userId)
                            }
                            disabled={actionLoading === selectedUser.userId}
                            className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Enable Account
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleResetPassword(selectedUser.userId)
                          }
                          disabled={actionLoading === selectedUser.userId}
                          className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Send Password Reset Email
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <RequireAdmin>
      <UserManagementContent />
    </RequireAdmin>
  );
}
