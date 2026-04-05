// src/hooks/usePushSync.ts
import { useAuth } from '@/hooks/useAuth';
import { bindPushToken } from '@/src/api/notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import * as Application from 'expo-application';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export const usePushSync = () => {
  // 从 Store 中拿到登录状态
  const isLoggedIn = useAuth((state) => state.isLoggedIn);

  useEffect(() => {
    const runSync = async () => {
      if (!isLoggedIn) return;

      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        console.log('✅ 用户真正在系统级别同意了推送权限！');
        try {
          const token = await messaging().getToken();
          let deviceId = 'unknown-device';
          if (Platform.OS === 'android') {
            deviceId = Application.getAndroidId();
          } else if (Platform.OS === 'ios') {
            deviceId = await Application.getIosIdForVendorAsync() || 'unknown-ios-device';
          }

          const requestData = {
            device_id: deviceId,
            fcm_token: token
          };
          const res = await bindPushToken(requestData);
          console.log('🔑 成功拿到后端的 AES 密钥！', res);
          await AsyncStorage.setItem('PUSH_AES_KEY', res.aes_key);
        } catch (error) {
          console.log('❌ 获取 Token 或绑定 失败:', error);
        }
      } else {
        console.log('⚠️ 用户拒绝了通知权限，或者系统默认拦截了');
      }
    };

    runSync();
  }, [isLoggedIn]); 
};