import type { AxiosResponse } from 'axios';
import { API_ENDPOINTS } from '../config/api-endpoints';
import type { ActivateRequest, ActivateResponse, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../types/api';
import { apiClient, request } from './api';

// 1. 用户登录
export const login = async (credentials: LoginRequest): Promise<AxiosResponse<LoginResponse>> => {
  try {
    console.log('🚀 API Request: Login', { ...credentials, id: 0 });
    
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.USER.LOGIN, {
      email: credentials.email,
      password: credentials.password,
      id: credentials.id || 0, 
    });
    return response;
  } catch (error) {
    console.error('Login request failed:', error);
    throw error;
  }
};

export const syncZitadelCallback = async (initialToken: string) => {
  try {
    console.log('🚀 API Request: Zitadel OAuth Callback');
    
    // POST 请求，body 为空对象 {}，并在 header 中强制携带初次 Token
    const response = await apiClient.post(
      API_ENDPOINTS.USER.OAUTH_CALLBACK, 
      {}, 
      {
        headers: {
          'Authorization': `Bearer ${initialToken}`
        }
      }
    );
    console.log(response.data)
    return response.data; // 直接返回 data 会让业务层更干净
  } catch (error) {
    console.error('OAuth callback request failed:', error);
    throw error;
  }
};

// 2. 用户注册
export const register = async (userInfo: RegisterRequest): Promise<RegisterResponse> => {
  try {
    // ✅ 注册也必须带上 id: 0
    const data = {
        email: userInfo.email,
        password: userInfo.password,
        id: userInfo.id || 0 
    };
    
    console.log('🚀 API Request: Register', data);
    
    const response = await request.post<RegisterResponse>(API_ENDPOINTS.USER.REGISTER, data);
    return response;
  } catch (error) {
    console.error('Registration request failed:', error);
    throw error;
  }
};

// 3. 激活用户账户
export const activateAccount = async (activateInfo: ActivateRequest): Promise<ActivateResponse> => {
  try {
    const response = await request.put<ActivateResponse>(API_ENDPOINTS.USER.ACTIVATE, activateInfo);
    return response;
  } catch (error) {
    console.error('Activation request failed:', error);
    throw error;
  }
};

// 4. 用户登出
export const logout = async (): Promise<void> => {
  try {
    await request.post(API_ENDPOINTS.USER.LOGOUT);
  } catch (error) {
    console.error('Logout API failed:', error);
    throw error;
  }
};