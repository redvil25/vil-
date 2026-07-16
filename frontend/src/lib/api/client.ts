import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import type { APIResponse, APIError } from "@/types/api.types";
import { secureStorage } from "@/lib/auth/secure-storage";

// API Client Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Export token manager for backward compatibility
// This is an alias to secureStorage for consistent API
export const tokenManager = secureStorage;

// Request interceptor - Add auth token to requests
// NOTE: API Gateway Cognito authorizer (without Authorization Scopes) requires ID token, not access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Use ID token for API Gateway Cognito authorizer
    // Fall back to access token for backward compatibility (e.g., local dev mode)
    const idToken = tokenManager.getIdToken();
    const accessToken = tokenManager.getAccessToken();
    const token = idToken || accessToken;

    console.log("[ApiClient] Request interceptor:", {
      url: config.url,
      method: config.method,
      hasIdToken: !!idToken,
      hasAccessToken: !!accessToken,
      tokenSource: idToken ? "idToken" : accessToken ? "accessToken" : "none",
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 50)}...` : "null",
    });

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[ApiClient] Authorization header set");
    } else {
      console.log(
        "[ApiClient] No token available, request will be unauthenticated",
      );
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle token refresh and errors
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<APIError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Check if this is an authentication endpoint (login, register, etc.)
    // These should NOT trigger automatic redirects - let the calling code handle errors
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/confirm");

    // If error is 401 and we haven't retried yet, try to refresh token
    // BUT: Don't do this for authentication endpoints - let them fail normally
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenManager.getRefreshToken();

      if (!refreshToken) {
        // No refresh token, clear tokens and redirect to login
        tokenManager.clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh token
        const response = await axios.post<
          APIResponse<{ accessToken: string; idToken?: string }>
        >(`${API_BASE_URL}/auth/refresh`, { refreshToken });

        const { accessToken, idToken } = response.data.data;
        tokenManager.setAccessToken(accessToken);
        // Also update ID token for API Gateway Cognito authorizer
        if (idToken) {
          tokenManager.setIdToken(idToken);
        }

        // Use ID token for API Gateway (fall back to access token)
        const tokenForAuth = idToken || accessToken;

        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${tokenForAuth}`;
        }

        processQueue(null, tokenForAuth);
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        processQueue(refreshError as Error, null);
        tokenManager.clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// Helper function to extract error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as APIError | undefined;
    if (apiError?.error?.message) {
      return apiError.error.message;
    }
    return error.message || "An unexpected error occurred";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
};

export default apiClient;
