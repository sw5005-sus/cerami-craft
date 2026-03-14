import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initializeSslPinning } from 'react-native-ssl-public-key-pinning';

export default function Layout() {
  useEffect(() => {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

    if (isExpoGo) {
      console.log('⚠️ 当前处于 Expo Go 环境，已自动跳过 SSL Pinning 验证');
      return; 
    }
    initializeSslPinning({
      'api.ntdoc.site': { // 锁定你的核心 API 域名
        includeSubdomains: true, 
        publicKeyHashes: [
          'sha256/W+o1IWvuIGMIHHGxS//Ur6Huo80ZFKN5uT/ZmaJWaZM=', 
          // 'sha256/备用哈希值=====================', // 强烈建议以后加上备用指纹防翻车
        ],
      },
    }).then(() => {
      console.log('🔒 SSL Pinning 初始化成功，网络通道已锁定！');
    }).catch(err => {
      console.error('🚨 SSL Pinning 初始化失败:', err);
    });
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