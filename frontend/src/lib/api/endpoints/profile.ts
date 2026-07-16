import apiClient from "../client";
import type {
  APIResponse,
  UserProfile,
  PublicProfile,
  UpdateProfileRequest,
} from "@/types/api.types";

export const profileAPI = {
  /**
   * Get current user's profile (private view)
   */
  getMyProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<APIResponse<UserProfile>>("/me");
    return response.data.data;
  },

  /**
   * Update current user's profile
   */
  updateMyProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await apiClient.put<APIResponse<UserProfile>>("/me", data);
    return response.data.data;
  },

  /**
   * Get a public user profile by ID
   */
  getPublicProfile: async (userId: string): Promise<PublicProfile> => {
    const response = await apiClient.get<APIResponse<PublicProfile>>(
      `/users/${userId}`,
    );
    return response.data.data;
  },
};
