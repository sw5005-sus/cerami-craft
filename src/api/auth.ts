import { API_ENDPOINTS } from '../config/api-endpoints';
import type { ActivateRequest, ActivateResponse, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../types/api';
import { request } from './api';

// 用户登录
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await request.post<LoginResponse>(API_ENDPOINTS.USER.LOGIN, {
      email: credentials.email,
      password: credentials.password,
      id: credentials.id || 0,
    });
    
    // 请求成功就说明登录成功（状态码 200）
    // 由于 token 在 cookie 中返回，我们设置一个标识表示已登录
    localStorage.setItem('userToken', 'logged-in-' + Date.now());
    
    // 触发登录状态变化事件
    window.dispatchEvent(new CustomEvent('loginStatusChanged', {
      detail: { user: { email: credentials.email } }
    }));
    
    return response;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// 用户注册
export const register = async (userInfo: RegisterRequest): Promise<RegisterResponse> => {
  try {
    const response = await request.post<RegisterResponse>(API_ENDPOINTS.USER.REGISTER, userInfo);
    return response;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

// 激活用户账户
export const activateAccount = async (activateInfo: ActivateRequest): Promise<ActivateResponse> => {
  try {
    const response = await request.put<ActivateResponse>(API_ENDPOINTS.USER.ACTIVATE, activateInfo);
    return response;
  } catch (error) {
    console.error('Activation failed:', error);
    throw error;
  }
};

// 用户登出
export const logout = async (): Promise<void> => {
  try {
    // 调用后端登出API
    await request.post(API_ENDPOINTS.USER.LOGOUT);
    
    // API调用成功后，清除本地存储的 token
    localStorage.removeItem('userToken');
    
    // 触发登出状态变化事件
    window.dispatchEvent(new CustomEvent('loginStatusChanged', {
      detail: { user: null }
    }));
    
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout API failed:', error);
    // 即使登出接口失败，也要清除本地 token（前端强制登出）
    localStorage.removeItem('userToken');
    window.dispatchEvent(new CustomEvent('loginStatusChanged', {
      detail: { user: null }
    }));
    // 重新抛出错误，让调用者知道API调用失败了
    throw error;
  }
};

// 检查用户是否已登录
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('userToken');
  return !!token;
};

// 获取存储的 token
export const getAuthToken = (): string | null => {
  return localStorage.getItem('userToken');
};
