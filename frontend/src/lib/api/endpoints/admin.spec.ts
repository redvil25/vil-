import { UserRole } from "@/types/api.types";

// Mock apiClient
jest.mock("../client", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import { adminAPI } from "./admin";
import apiClient from "../client";

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;

describe("Admin API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listUsers", () => {
    it("should fetch users with default parameters", async () => {
      const mockUsers = {
        users: [
          {
            userId: "user-1",
            username: "user1",
            email: "user1@example.com",
            role: UserRole.USER,
          },
        ],
        lastEvaluatedKey: undefined,
      };
      mockGet.mockResolvedValue({ data: { data: mockUsers } });

      const result = await adminAPI.listUsers();

      expect(mockGet).toHaveBeenCalledWith("/admin/users", {
        params: undefined,
      });
      expect(result).toEqual(mockUsers);
    });

    it("should fetch users with role filter", async () => {
      const mockUsers = { users: [], lastEvaluatedKey: undefined };
      mockGet.mockResolvedValue({ data: { data: mockUsers } });

      await adminAPI.listUsers({ role: UserRole.ADMIN });

      expect(mockGet).toHaveBeenCalledWith("/admin/users", {
        params: { role: UserRole.ADMIN },
      });
    });

    it("should handle authorization errors", async () => {
      const error = new Error("Admin access required");
      mockGet.mockRejectedValue(error);

      await expect(adminAPI.listUsers()).rejects.toThrow(
        "Admin access required",
      );
    });
  });

  describe("getUserDetails", () => {
    it("should fetch user details", async () => {
      const mockUser = {
        userId: "user-123",
        username: "testuser",
        email: "test@example.com",
        role: UserRole.USER,
      };
      mockGet.mockResolvedValue({ data: { data: mockUser } });

      const result = await adminAPI.getUserDetails("user-123");

      expect(mockGet).toHaveBeenCalledWith("/admin/users/user-123");
      expect(result).toEqual(mockUser);
    });

    it("should handle user not found", async () => {
      const error = new Error("User not found");
      mockGet.mockRejectedValue(error);

      await expect(adminAPI.getUserDetails("nonexistent")).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("enableUser", () => {
    it("should enable a user", async () => {
      mockPost.mockResolvedValue({
        data: { data: { message: "User enabled" } },
      });

      await adminAPI.enableUser("user-123");

      expect(mockPost).toHaveBeenCalledWith("/admin/users/user-123/enable");
    });
  });

  describe("disableUser", () => {
    it("should disable a user", async () => {
      mockPost.mockResolvedValue({
        data: { data: { message: "User disabled" } },
      });

      await adminAPI.disableUser("user-123");

      expect(mockPost).toHaveBeenCalledWith("/admin/users/user-123/disable");
    });
  });

  describe("resetUserPassword", () => {
    it("should reset user password", async () => {
      mockPost.mockResolvedValue({
        data: { data: { message: "Password reset" } },
      });

      await adminAPI.resetUserPassword("user-123");

      expect(mockPost).toHaveBeenCalledWith(
        "/admin/users/user-123/reset-password",
      );
    });
  });
});

describe("Admin API Object", () => {
  it("should export all user management functions", () => {
    expect(adminAPI.listUsers).toBeDefined();
    expect(adminAPI.getUserDetails).toBeDefined();
    expect(adminAPI.enableUser).toBeDefined();
    expect(adminAPI.disableUser).toBeDefined();
    expect(adminAPI.resetUserPassword).toBeDefined();
  });
});
