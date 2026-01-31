import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api-endpoints';
import type { UserProfile, ApiResponse } from '../types/api';

/**
 * 获取当前用户信息
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get<ApiResponse<UserProfile>>(API_ENDPOINTS.USER.USER_SELF);
  return response.data.data;
};

/**
 * 更新当前用户信息
 */
export const updateUserProfile = async (profileData: UserProfile): Promise<UserProfile> => {
  const response = await apiClient.put<ApiResponse<UserProfile>>(API_ENDPOINTS.USER.USER_SELF, profileData);
  return response.data.data;
};
