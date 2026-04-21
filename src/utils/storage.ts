import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'user_token';
const AES_KEY_NAME = 'PUSH_AES_KEY';

export const tokenStorage = {
  /**
   * 1. 存 Token
   * 移动端使用加密存储，Web端回退到 localStorage
   */
  async save(token: string) {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (e) {
      console.warn('error Save token failed:', e);
    }
  },

  /**
   * 2. 取 Token
   */
  async get() {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
      } else {
        return await SecureStore.getItemAsync(TOKEN_KEY);
      }
    } catch (e) {
      console.warn('error Get token failed:', e);
      return null;
    }
  },

  /**
   * 3. 删 Token (登出时调用)
   */
  async remove() {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (e) {
      console.warn('error Remove token failed:', e);
    }
  }
};

export const aesKeyStorage = {
  async save(aesKey: string) {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(AES_KEY_NAME, aesKey);
      } else {
        await SecureStore.setItemAsync(AES_KEY_NAME, aesKey);
      }
    } catch (e) {
      console.warn('error Save AES key failed:', e);
    }
  },

  async get() {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(AES_KEY_NAME);
      } else {
        return await SecureStore.getItemAsync(AES_KEY_NAME);
      }
    } catch (e) {
      console.warn('error Get AES key failed:', e);
      return null;
    }
  },

  async remove() {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(AES_KEY_NAME);
      } else {
        await SecureStore.deleteItemAsync(AES_KEY_NAME);
      }
    } catch (e) {
      console.warn('error Remove AES key failed:', e);
    }
  }
};