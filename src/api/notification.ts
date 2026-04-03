// src/api/notification.ts
import { apiClient } from './api';

// 定义请求参数类型
export interface BindPushTokenRequest {
  device_id: string;
  fcm_token: string;
}

// 定义响应数据类型
export interface BindPushTokenResponse {
  aes_key: string;
}

/**
 * 绑定 FCM Token 并获取端到端加密的 AES 密钥
 */
export const bindPushToken = async (data: BindPushTokenRequest): Promise<BindPushTokenResponse> => {
  const response = await apiClient.post('/notification-ms/v1/push-token', data); 
  return response.data; 
};