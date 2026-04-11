/**
 * useAuth Hook 测试
 * 
 * 测试策略：
 * 1. Mock AsyncStorage（设备层存储）
 * 2. Mock expo-secure-store（安全存储）
 * 3. Mock tokenStorage utility
 * 4. Zustand 状态重置
 * 5. 测试认证流程
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isTokenValid } from '../../src/utils/auth';
import { tokenStorage } from '../../src/utils/storage';
import { useAuth } from '../useAuth';

// ==================== MOCKS ====================
// 1. Mock AsyncStorage（原生模块）
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    removeItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}));

// 2. Mock expo-secure-store（原生模块）
jest.mock('expo-secure-store', () => ({
  __esModule: true,
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// 3. Mock tokenStorage utility
jest.mock('../../src/utils/storage', () => ({
  tokenStorage: {
    save: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

// 4. Mock isTokenValid utility
jest.mock('../../src/utils/auth', () => ({
  isTokenValid: jest.fn((token) => {
    if (token === 'valid-token') {
      return true;
    }
    if (token === 'expired-token') {
      return false;
    }
    return false;
  }),
}));

describe('useAuth Hook - Zustand Store', () => {
  // ==================== 设置和清理 ====================
  beforeEach(() => {
    // 重置所有 mocks
    jest.clearAllMocks();
    
    // 重置 Zustand 状态
    useAuth.setState({
      isLoggedIn: false,
    });
  });

  // ==================== 测试用例 ====================
  
  describe('初始状态', () => {
    it('应该以未登录状态初始化', () => {
      const state = useAuth.getState();
      expect(state.isLoggedIn).toBe(false);
    });
  });

  describe('setLogin', () => {
    it('应该能够设置登录状态为 true', () => {
      const { setLogin } = useAuth.getState();
      
      setLogin(true);
      
      expect(useAuth.getState().isLoggedIn).toBe(true);
    });

    it('应该能够设置登录状态为 false', () => {
      const { setLogin } = useAuth.getState();
      
      setLogin(true);
      expect(useAuth.getState().isLoggedIn).toBe(true);
      
      setLogin(false);
      expect(useAuth.getState().isLoggedIn).toBe(false);
    });
  });

  describe('checkLogin', () => {
    it('当 token 有效时应该设置 isLoggedIn 为 true', async () => {
      // Arrange
      (tokenStorage.get as jest.Mock).mockResolvedValueOnce('valid-token');
      const { checkLogin } = useAuth.getState();

      // Act
      await checkLogin();

      // Assert
      expect(useAuth.getState().isLoggedIn).toBe(true);
      expect(tokenStorage.get).toHaveBeenCalled();
      expect(isTokenValid).toHaveBeenCalledWith('valid-token');
    });

    it('当 token 过期时应该设置 isLoggedIn 为 false', async () => {
      // Arrange
      (tokenStorage.get as jest.Mock).mockResolvedValueOnce('expired-token');
      const { checkLogin } = useAuth.getState();

      // Act
      await checkLogin();

      // Assert
      expect(useAuth.getState().isLoggedIn).toBe(false);
      expect(isTokenValid).toHaveBeenCalledWith('expired-token');
    });

    it('当没有 token 时应该设置 isLoggedIn 为 false', async () => {
      // Arrange
      (tokenStorage.get as jest.Mock).mockResolvedValueOnce(null);
      const { checkLogin } = useAuth.getState();

      // Act
      await checkLogin();

      // Assert
      expect(useAuth.getState().isLoggedIn).toBe(false);
    });
  });

  describe('logout', () => {
    it('应该清除 token 存储、AsyncStorage 和设置 isLoggedIn 为 false', async () => {
      // Arrange
      const { setLogin, logout } = useAuth.getState();
      setLogin(true);

      // Act
      await logout();

      // Assert
      expect(tokenStorage.remove).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('PUSH_AES_KEY');
      expect(useAuth.getState().isLoggedIn).toBe(false);
    });

    it('当 tokenStorage.remove 抛出错误时应该优雅处理', async () => {
      // Arrange
      const mockError = new Error('Storage error');
      (tokenStorage.remove as jest.Mock).mockRejectedValueOnce(mockError);
      const { logout } = useAuth.getState();
      
      // 禁用 console.error 以避免测试输出中的错误日志
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert: 不应该抛出错误
      await expect(logout()).resolves.toBeUndefined();
      
      // 验证 console.error 被调用了（错误被正确处理）
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '退出清理时发生错误:',
        mockError
      );
      
      // 最后状态应该被设置为 false
      expect(useAuth.getState().isLoggedIn).toBe(false);
      
      // 恢复 console.error
      consoleErrorSpy.mockRestore();
    });

    it('应该清除 PUSH_AES_KEY 从 AsyncStorage', async () => {
      const { logout } = useAuth.getState();

      // Act
      await logout();

      // Assert
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('PUSH_AES_KEY');
    });
  });

  describe('完整流程', () => {
    it('应该能完整走过 登录 -> 检查 -> 登出 流程', async () => {
      const { setLogin, checkLogin, logout } = useAuth.getState();

      // 1. 初始状态：未登录
      expect(useAuth.getState().isLoggedIn).toBe(false);

      // 2. 设置登录状态
      setLogin(true);
      expect(useAuth.getState().isLoggedIn).toBe(true);

      // 3. 检查登录状态（mock 返回有效 token）
      (tokenStorage.get as jest.Mock).mockResolvedValueOnce('valid-token');
      await checkLogin();
      expect(useAuth.getState().isLoggedIn).toBe(true);

      // 4. 登出
      await logout();
      expect(useAuth.getState().isLoggedIn).toBe(false);
      expect(tokenStorage.remove).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('PUSH_AES_KEY');
    });
  });
});
