import { API_ENDPOINTS } from '../config/api-endpoints';
import type { ApiResponse, CreateAddressRequest, UpdateAddressRequest, UserAddress } from '../types/api';
import { apiClient } from './api';

/**
 * 新增用户地址
 */
export const createUserAddress = async (addressData: CreateAddressRequest): Promise<UserAddress> => {
  const response = await apiClient.post<ApiResponse<UserAddress>>(
    API_ENDPOINTS.USER.USER_ADDRESSES, 
    addressData
  );
  return response.data.data;
};

/**
 * 获取用户所有地址
 */
export const getUserAddresses = async (): Promise<UserAddress[]> => {
  const response = await apiClient.get<ApiResponse<UserAddress[]>>(
    API_ENDPOINTS.USER.USER_ADDRESSES
  );
  return response.data.data;
};

/**
 * 更新用户地址
 */
export const updateUserAddress = async (addressId: number, addressData: UpdateAddressRequest): Promise<UserAddress> => {
  const response = await apiClient.put<ApiResponse<UserAddress>>(
    `${API_ENDPOINTS.USER.USER_ADDRESSES}/${addressId}`, 
    addressData
  );
  return response.data.data;
};

/**
 * 删除用户地址
 */
export const deleteUserAddress = async (addressId: number): Promise<void> => {
  await apiClient.delete(`${API_ENDPOINTS.USER.USER_ADDRESSES}/${addressId}`);
};
