// API Response Types
export interface APIResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  requestId?: string;
}

export interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    limit: number;
    lastKey?: string;
    hasMore: boolean;
    totalCount?: number;
  };
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  idToken?: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ConfirmSignUpRequest {
  email: string;
  confirmationCode: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ConfirmForgotPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
  requiresEmailConfirmation?: boolean;
}

// User Types
export enum UserRole {
  USER = "User",
  ADMIN = "Admin",
}

export interface UserProfile {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProfile {
  userId: string;
  username: string;
  role: UserRole;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdateProfileRequest {
  username?: string;
  bio?: string;
  avatarUrl?: string;
}

// Query Parameters
export interface PaginationParams {
  limit?: number;
  lastKey?: string;
}

// Admin User Management Types
export enum AccountStatus {
  ACTIVE = "Active",
  DISABLED = "Disabled",
}

export interface AdminUserSummary {
  userId: string;
  email: string;
  username: string;
  role: UserRole;
  accountStatus: AccountStatus;
  cognitoStatus: string;
  emailVerified: boolean;
  createdAt: string;
  lastActiveAt?: string;
}

export interface AdminUserDetails extends AdminUserSummary {
  bio?: string;
  avatarUrl?: string;
  updatedAt: string;
  cognitoUserCreateDate: string;
  cognitoUserLastModifiedDate: string;
}

export interface AdminUserListResponse {
  users: AdminUserSummary[];
  pagination: {
    limit: number;
    lastKey?: string;
    hasMore: boolean;
  };
}

export interface ListUsersParams {
  role?: UserRole;
  limit?: number;
  lastEvaluatedKey?: string;
}
