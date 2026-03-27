import messaging from '@react-native-firebase/messaging';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initializeSslPinning } from 'react-native-ssl-public-key-pinning';
import { tokenStorage } from '../src/utils/storage';

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
  
  if (!userToken) {
    console.log('🔒 用户已登出，静默丢弃该推送，绝不展示！');
    return; 
  }

  if (!remoteMessage || !remoteMessage.data || !remoteMessage.data.encrypted_payload) {
    console.log('空数据或格式不对，直接丢弃');
    return;
  }

  // TODO: 解密逻辑
  const decryptedText = "测试解密明文：后台订单状态已更新";

  // 解密成功后，用 expo-notifications 把明文推到系统通知栏
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'CeramiCraft Notification',
      body: decryptedText, 
      sound: true,
    },
    trigger: null, // null 意味着立刻弹出
  });
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
  // 注册前台推送钩子
  useEffect(() => {
    async function setupPushNotifications() {
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        console.log('✅ 用户真正在系统级别同意了推送权限！');
        try {
          const token = await messaging().getToken();
          console.log('🔥 你的 FCM Token (发给后端对接):', token);
        } catch (error) {
          console.log('❌ 获取 Token 失败:', error);
        }
      } else {
        console.log('⚠️ 用户拒绝了通知权限，或者系统默认拦截了');
        // 可选：在这里弹个 Alert 引导用户去设置里打开
      }
    }
    setupPushNotifications();

    // 4. 监听前台消息 (用户正在玩 App 时收到的推送)
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('📱 [前台状态] 收到静默推送:', remoteMessage.data);
      
      if (!remoteMessage?.data?.encrypted_payload) return;

      // TODO: 解密逻辑
      const decryptedText = "测试解密明文：您正在浏览时有新消息！";

      // 前台收到消息，直接在顶部弹横幅提醒
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'CeramiCraft 提醒',
          body: decryptedText,
        },
        trigger: null,
      });
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