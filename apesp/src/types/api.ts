/**
 * Standard API Response Envelope matching Backend Source [10, 11]
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Common Entity Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  avatar?: string;
  invite_code: string;
  currency: string;
  timezone: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string; 
  refreshToken: string;
  sessionId: string;
}
