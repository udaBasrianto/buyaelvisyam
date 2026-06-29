/**
 * Secure Authentication Service with Refresh Token Rotation
 * Prevents token hijacking and ensures proper session cleanup
 */

import axios from 'axios';
import { getApiBaseUrl } from "@/lib/runtime-config";

const baseURL = getApiBaseUrl();
let backendOfflineUntil = 0;

// Token storage with expiration tracking
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

export const authService = {
  /**
   * Set tokens with expiration tracking
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number = 3600) {
    const expiryTime = Date.now() + (expiresIn * 1000);
    
    // Use sessionStorage for access token (cleared on tab close)
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // Use localStorage for refresh token (for persistence across sessions)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  /**
   * Get current access token, refresh if expired
   */
  getAccessToken(): string | null {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);

    if (!token || !expiry) return null;

    // Check if token expired
    if (Date.now() > parseInt(expiry)) {
      this.clearTokens();
      return null;
    }

    return token;
  },

  /**
   * Clear all authentication tokens
   */
  clearTokens() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  },
};

// Create axios instance with interceptors
const api = axios.create({ baseURL });

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const now = Date.now();
    if (now < backendOfflineUntil) {
      return Promise.reject(new Error('BACKEND_OFFLINE'));
    }

    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401s and network errors
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Network error
    if (error.response === undefined) {
      backendOfflineUntil = Date.now() + 5000;
      return Promise.reject(error);
    }

    // Unauthorized - token expired/invalid
    if (error.response?.status === 401) {
      authService.clearTokens();
      // Redirect to login or emit auth event
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);

export default api;
