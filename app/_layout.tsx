import { useAuth } from '@/hooks/useAuth';
import { usePushSync } from '@/hooks/usePushSync';
import messaging from '@react-native-firebase/messaging';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initializeSslPinning } from 'react-native-ssl-public-key-pinning';
import { isTokenValid } from '../src/utils/auth';
import { decryptAES_GCM } from '../src/utils/crypto';
import { aesKeyStorage, tokenStorage } from '../src/utils/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, 
    shouldShowList: true,   
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('在后台收到了静默密文推送！', remoteMessage);
  const userToken = await tokenStorage.get();
  if (isTokenValid(userToken)) {
    console.log('🔒 用户已登出，静默丢弃该推送，绝不展示！');
    return; 
  }

  const pushData = remoteMessage.data;
  if (!pushData || !pushData.encrypted_payload) return;
  const { title,  encrypted_payload} = pushData;
  try {
    const savedAesKey = await aesKeyStorage.get();;
    if (!savedAesKey) {
      console.log('⚠️ 本地没有找到 AES 密钥，无法解密！');
      return;
    }

    const realData = decryptAES_GCM(encrypted_payload as string, savedAesKey);
    console.log('🎉 见证奇迹！解密后的核心数据是:', realData);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: title as string || 'CeramiCraft Notification',
        body: realData || 'You have a new message!',
        sound: true,
      },
      trigger: null,
    });

  } catch (err) {
    console.log('推送处理流程出错:', err);
  }
});

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
if (!isExpoGo) {
  initializeSslPinning({
    'api.ntdoc.site': { // 锁定你的核心 API 域名
      includeSubdomains: true, 
      publicKeyHashes: [
        // leaf (api.ntdoc.site)
          'W+o1IWvuIGMIHHGxS//Ur6Huo80ZFKN5uT/ZmaJWaZM=', 
          //  R12 intermediate
          'kZwN96eHtZftBWrOZUsd6cA4es80n3NzSk/XtYz2EqQ=', 
          // ISRG Root X1
          'C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=',
        // 'sha256/备用哈希值=====================', // 强烈建议以后加上备用指纹防翻车
      ],
    },
  }).then(() => {
    console.log('🔒 SSL Pinning 初始化成功，网络通道已锁定！');
  }).catch(err => {
    console.error('🚨 SSL Pinning 初始化失败:', err);
  });
}

export default function Layout() {
  const checkLogin = useAuth((state)=>state.checkLogin);
  usePushSync();
  useEffect(() => {
    checkLogin();
  }, [checkLogin])

  useEffect(() => {
    // 4. 监听前台消息 (用户正在玩 App 时收到的推送)
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('📱 [前台状态] 收到静默推送:', remoteMessage.data);
      const pushData = remoteMessage.data;
      if (!pushData || !pushData.encrypted_payload) return;

      const { title,  encrypted_payload} = pushData;

      try {
        const savedAesKey = await aesKeyStorage.get();
        if (!savedAesKey) {
          console.log('⚠️ 本地没有找到 AES 密钥，无法解密！');
          return;
        }

        const realData = decryptAES_GCM(encrypted_payload as string, savedAesKey);
        console.log('🎉 见证奇迹！解密后的核心数据是:', realData);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: title as string || 'CeramiCraft Notification',
            body: realData || 'You have a new message!',
            sound: true,
          },
          trigger: null,
        });

      } catch (err) {
        console.log('推送处理流程出错:', err);
      }
    });

    // 组件卸载时清理前台监听器
    return () => {
      unsubscribeForeground();
    };
  }, []);
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f5f5f5',
        },
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* 详情页继续保留在 Stack 里，这样点进去可以盖住底部栏 */}
      <Stack.Screen name="product/[id]" options={{ title: 'Detail', headerShown: false }} />
    </Stack>
  );
}