export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface ApiErrorResponse {
  error: ApiError;
}

export interface LoginRequest {
  email: string;
  password: string;
  device_id?: string;
  device_name?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: UserProfile;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface VerifyRequest {
  email: string;
  code: string;
  device_id?: string;
  device_name?: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

export interface LogoutRequest {
  refresh_token?: string;
  device_id?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  phonenumber: string | null;
  provider?: string | null;
  is_elite?: boolean;
  is_partner?: boolean;
  created_at: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phonenumber?: string | null;
  currentPassword?: string;
  newPassword?: string;
}
