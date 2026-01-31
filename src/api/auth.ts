import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { request } from './api';

// 这里为了编译通过，简单定义一下类型，你可以用你 src/types/api.ts 里的
interface LoginResponse { token?: string; [key: string]: any }
interface LoginRequest { email?: string; password?: string; id?: number }

// 用户登录
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await request.post<LoginResponse>(API_ENDPOINTS.USER.LOGIN, {
      email: credentials.email,
      password: credentials.password,
      id: credentials.id || 0,
    });
    
    // 假设后端直接返回 token 字段，或者我们在 Header 里拿到了
    // 为了模拟之前的逻辑，我们存一个标记
    await AsyncStorage.setItem('userToken', 'logged-in-' + Date.now());
    
    // 注意：React Native 里不能 dispatchEvent
    // 如果需要更新 UI 状态，请在 LoginScreen 页面里调用 setLoginState
    
    return response;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// 用户登出
export const logout = async (): Promise<void> => {
  try {
    // 调用后端登出
    await request.post(API_ENDPOINTS.USER.LOGOUT);
  } catch (error) {
    console.warn('Logout API failed, forcing local logout');
  } finally {
    // 无论后端是否成功，前端必须清除 token
    await AsyncStorage.removeItem('userToken');
    console.log('Local logout successful');
  }
};

// 检查是否登录 (注意：这是异步的！)
export const checkAuthStatus = async (): Promise<boolean> => {
  const token = await AsyncStorage.getItem('userToken');
  return !!token;
};