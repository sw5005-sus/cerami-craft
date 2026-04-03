import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import { BASE_URL } from '../config/api-endpoints';
import { tokenStorage } from '../utils/storage';

// 定义错误类型 (根据你的代码推断)
export interface ApiError {
  code: number;
  data: any;
  err_msg: string;
}

// 创建 axios 实例
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: BASE_URL, // 强制使用 HTTPS
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    // RN 处理 cookies 需要额外库，通常 App 用 Token Header 认证，所以这里先保留但可能不生效
    withCredentials: true, 
  });

  // === 请求拦截器 ===
  instance.interceptors.request.use(
    async (config) => {
      try {
        const token = await tokenStorage.get();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔥🔥🔥 [API DEBUG REQUEST] 🔥🔥🔥');
          console.log(JSON.stringify({
            url: '' + config.baseURL + config.url,
            method: config.method?.toUpperCase(), // POST/GET
            headers: config.headers, 
            body: config.data        
          }, null, 2));
          console.log('🔥🔥🔥 [END DEBUG] 🔥🔥🔥');
        }
      } catch (e) {
        console.warn('error Error fetching token', e);
      }
      
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL || ''}${config.url || ''}`,
      });
      
      return config;
    },
    (error) => {
      console.warn('error Request Error:', error);
      return Promise.reject(error);
    }
  );

  // === 响应拦截器 ===
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log('API Response:', response.status, response.headers, response.config.url);
      return response;
    },
    async (error) => {
      console.warn('Response Error:', error);
      
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 401:
            // [关键修改] 不能直接 window.location.href
            // 我们清除 token，然后抛出错误，让 UI 层去决定跳转到登录页
            //await AsyncStorage.removeItem('userToken');
            console.warn('warn Unauthorized: Token expired or invalid');
            break;
          case 403:
            console.warn('error Permission Denied');
            break;
          case 404:
            console.warn('error Resource Not Found');
            break;
          case 500:
            console.warn('error Server Error');
            break;
        }
        
        return Promise.reject({
          code: status,
          data: data?.data || null,
          err_msg: data?.err_msg || error.message || 'Request Failed',
        } as ApiError);

      } else if (error.request) {
        // 网络错误 (常见于 SSL 证书问题或连不上网)
        return Promise.reject({
          code: -1,
          data: 'NETWORK_ERROR',
          err_msg: 'Network Error. Please check your connection.',
        } as ApiError);
      } else {
        return Promise.reject({
          code: -2,
          data: 'UNKNOWN_ERROR',
          err_msg: error.message || 'Unknown Error',
        } as ApiError);
      }
    }
  );

  return instance;
};

export const apiClient = createApiInstance();

// 通用请求方法
export const request = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.get(url, config).then(res => res.data),
  
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.post(url, data, config).then(res => res.data),
  
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.put(url, data, config).then(res => res.data),
  
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.delete(url, config).then(res => res.data),
    
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    apiClient.patch(url, data, config).then(res => res.data),
};

export default apiClient;