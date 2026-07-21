import { apiClient } from './api';
import { API_ROUTES } from '@/constants/api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  VerifyRequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UserProfile,
  UpdateProfileRequest,
} from '@/types/api';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>(API_ROUTES.auth.login, data);
    return res.data;
  },

  async register(data: RegisterRequest): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>(API_ROUTES.auth.register, data);
    return res.data;
  },

  async verify(data: VerifyRequest): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>(API_ROUTES.auth.verify, data);
    return res.data;
  },

  async logout(data: LogoutRequest): Promise<void> {
    await apiClient.post(API_ROUTES.auth.logout, data);
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>(API_ROUTES.auth.forgotPassword, data);
    return res.data;
  },

  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>(API_ROUTES.auth.resetPassword, data);
    return res.data;
  },

  async googleLogin(params: {
    idToken: string;
    deviceId?: string;
    deviceName?: string;
  }): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>(API_ROUTES.auth.googleLogin, params);
    return res.data;
  },

  async appleLogin(payload: {
    identityToken: string;
    fullName?: { firstName?: string | null; lastName?: string | null } | null;
    deviceId?: string;
    deviceName?: string;
  }): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>(API_ROUTES.auth.appleLogin, payload);
    return res.data;
  },

  async getMe(): Promise<UserProfile> {
    const res = await apiClient.get<UserProfile>(API_ROUTES.me);
    return res.data;
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const res = await apiClient.patch<UserProfile>(API_ROUTES.me, data);
    return res.data;
  },

  async deleteAccount(): Promise<void> {
    await apiClient.delete(API_ROUTES.me);
  },
};
