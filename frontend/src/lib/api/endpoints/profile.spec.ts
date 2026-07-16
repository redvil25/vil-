import type { UserProfile, PublicProfile } from "@/types/api.types";
import { UserRole } from "@/types/api.types";

// Mock apiClient
jest.mock("../client", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

import { profileAPI } from "./profile";
import apiClient from "../client";

const mockGet = apiClient.get as jest.Mock;
const mockPut = apiClient.put as jest.Mock;

describe("Profile API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserProfile: UserProfile = {
    userId: "user-123",
    email: "test@example.com",
    username: "testuser",
    role: UserRole.USER,
    bio: "A sandbox user",
    avatarUrl: "https://example.com/avatar.jpg",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  };

  const mockPublicProfile: PublicProfile = {
    userId: "user-123",
    username: "testuser",
    role: UserRole.USER,
    bio: "A sandbox user",
    avatarUrl: "https://example.com/avatar.jpg",
  };

  describe("getMyProfile", () => {
    it("should fetch current user profile", async () => {
      mockGet.mockResolvedValue({ data: { data: mockUserProfile } });

      const result = await profileAPI.getMyProfile();

      expect(mockGet).toHaveBeenCalledWith("/me");
      expect(result).toEqual(mockUserProfile);
    });

    it("should handle unauthenticated request", async () => {
      const error = new Error("Unauthorized");
      mockGet.mockRejectedValue(error);

      await expect(profileAPI.getMyProfile()).rejects.toThrow("Unauthorized");
    });

    it("should return profile with User role", async () => {
      mockGet.mockResolvedValue({ data: { data: mockUserProfile } });

      const result = await profileAPI.getMyProfile();

      expect(result.role).toBe(UserRole.USER);
    });

    it("should return profile with Admin role", async () => {
      const adminProfile = { ...mockUserProfile, role: UserRole.ADMIN };
      mockGet.mockResolvedValue({ data: { data: adminProfile } });

      const result = await profileAPI.getMyProfile();

      expect(result.role).toBe(UserRole.ADMIN);
    });
  });

  describe("updateMyProfile", () => {
    it("should update username", async () => {
      const updatedProfile = { ...mockUserProfile, username: "newusername" };
      mockPut.mockResolvedValue({ data: { data: updatedProfile } });

      const result = await profileAPI.updateMyProfile({
        username: "newusername",
      });

      expect(mockPut).toHaveBeenCalledWith("/me", { username: "newusername" });
      expect(result.username).toBe("newusername");
    });

    it("should update bio", async () => {
      const updatedProfile = { ...mockUserProfile, bio: "New bio text" };
      mockPut.mockResolvedValue({ data: { data: updatedProfile } });

      const result = await profileAPI.updateMyProfile({ bio: "New bio text" });

      expect(mockPut).toHaveBeenCalledWith("/me", { bio: "New bio text" });
      expect(result.bio).toBe("New bio text");
    });

    it("should update multiple fields", async () => {
      const updatedProfile = {
        ...mockUserProfile,
        username: "newname",
        bio: "New bio",
      };
      mockPut.mockResolvedValue({ data: { data: updatedProfile } });

      const result = await profileAPI.updateMyProfile({
        username: "newname",
        bio: "New bio",
      });

      expect(mockPut).toHaveBeenCalledWith("/me", {
        username: "newname",
        bio: "New bio",
      });
      expect(result.username).toBe("newname");
      expect(result.bio).toBe("New bio");
    });

    it("should handle username already taken", async () => {
      const error = new Error("Username already taken");
      mockPut.mockRejectedValue(error);

      await expect(
        profileAPI.updateMyProfile({ username: "taken" }),
      ).rejects.toThrow("Username already taken");
    });

    it("should handle validation errors", async () => {
      const error = new Error("Username too short");
      mockPut.mockRejectedValue(error);

      await expect(
        profileAPI.updateMyProfile({ username: "ab" }),
      ).rejects.toThrow("Username too short");
    });
  });

  describe("getPublicProfile", () => {
    it("should fetch a public profile by user ID", async () => {
      mockGet.mockResolvedValue({ data: { data: mockPublicProfile } });

      const result = await profileAPI.getPublicProfile("user-123");

      expect(mockGet).toHaveBeenCalledWith("/users/user-123");
      expect(result).toEqual(mockPublicProfile);
    });

    it("should handle user not found", async () => {
      const error = new Error("User not found");
      mockGet.mockRejectedValue(error);

      await expect(profileAPI.getPublicProfile("nonexistent")).rejects.toThrow(
        "User not found",
      );
    });

    it("should return public profile without email", async () => {
      mockGet.mockResolvedValue({ data: { data: mockPublicProfile } });

      const result = await profileAPI.getPublicProfile("user-123");

      expect(result).not.toHaveProperty("email");
      expect(result.username).toBe("testuser");
    });
  });
});

describe("Profile API Object", () => {
  it("should have all methods defined", () => {
    expect(profileAPI.getMyProfile).toBeDefined();
    expect(profileAPI.updateMyProfile).toBeDefined();
    expect(profileAPI.getPublicProfile).toBeDefined();
  });
});
