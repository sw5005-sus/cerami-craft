/* eslint-disable no-undef */
// Jest setup file
// jest 对象在全局作用域中自动可用

// 定义全局变量
global.__DEV__ = true;
global.fetch = jest.fn();

// Mock Expo modules
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {},
  },
}));

jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

jest.mock('expo-device', () => ({
  osName: 'Android',
  osBuildId: 'test-build',
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  multiSet: jest.fn(),
  multiGet: jest.fn(),
}));

// Mock Firebase messaging
jest.mock('@react-native-firebase/messaging', () => ({
  messaging: jest.fn(() => ({
    getToken: jest.fn().mockResolvedValue('mock-fcm-token'),
    requestPermission: jest.fn().mockResolvedValue(1),
  })),
}));

// Mock Expo Application
jest.mock('expo-application', () => ({
  getAndroidId: jest.fn(() => 'mock-android-id'),
  getIosIdForVendorAsync: jest.fn().mockResolvedValue('mock-ios-id'),
}));
