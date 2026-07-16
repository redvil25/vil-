import apiClient from "../client";
import type {
  APIResponse,
  AdminUserDetails,
  AdminUserListResponse,
  ListUsersParams,
} from "@/types/api.types";

export const adminAPI = {
  // ==================== User Management ====================

  /**
   * List all users with optional role filter
   */
  listUsers: async (
    params?: ListUsersParams,
  ): Promise<AdminUserListResponse> => {
    const response = await apiClient.get<APIResponse<AdminUserListResponse>>(
      "/admin/users",
      {
        params,
      },
    );
    return response.data.data;
  },

  /**
   * Get detailed information about a specific user
   */
  getUserDetails: async (userId: string): Promise<AdminUserDetails> => {
    const response = await apiClient.get<APIResponse<AdminUserDetails>>(
      `/admin/users/${userId}`,
    );
    return response.data.data;
  },

  /**
   * Enable a user account
   */
  enableUser: async (userId: string): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/enable`);
  },

  /**
   * Disable a user account
   */
  disableUser: async (userId: string): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/disable`);
  },

  /**
   * Reset a user's password (sends reset email)
   */
  resetUserPassword: async (userId: string): Promise<void> => {
    await apiClient.post(`/admin/users/${userId}/reset-password`);
  },
};

// User Management exports
export const listUsers = adminAPI.listUsers;
export const getUserDetails = adminAPI.getUserDetails;
export const enableUser = adminAPI.enableUser;
export const disableUser = adminAPI.disableUser;
export const resetUserPassword = adminAPI.resetUserPassword;
