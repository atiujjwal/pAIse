import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../features/auth/store";
import { ApiResponse } from "./response";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple refresh calls simultaneously
let isRefreshing = false;
// Queue to hold requests while token is refreshing
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// --- Request Interceptor ---
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor ---
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If no refresh token is available, logout immediately
      const { refreshToken, logout, setAuth, user } = useAuthStore.getState();
      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise(function (resolve, reject) {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh endpoint [Source 124]
        // We use a clean axios instance to avoid infinite loops in interceptors
        const response = await axios.post<{
          data: { access_token: string; refresh_token: string };
        }>(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });

        const { access_token, refresh_token: new_refresh_token } =
          response.data.data;

        // Update Store
        if (user) {
          setAuth(user, access_token, new_refresh_token);
        }

        // Process queued requests
        processQueue(null, access_token);

        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails (token expired/revoked), hard logout
        processQueue(refreshError, null);
        logout();
        // Optional: Redirect to login via window.location if not handled by AuthGuard
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Standard error formatting
    // If backend sends standard error envelope, strictly type the rejection
    if (error.response?.data && typeof error.response.data === "object") {
      return Promise.reject(
        (error.response.data as ApiResponse).error || error
      );
    }

    return Promise.reject(error);
  }
);
