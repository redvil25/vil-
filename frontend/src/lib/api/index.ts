// Export all API endpoints
export { authAPI } from "./endpoints/auth";
export { profileAPI } from "./endpoints/profile";
export { adminAPI } from "./endpoints/admin";

// Export client and utilities
export { default as apiClient, tokenManager, getErrorMessage } from "./client";
