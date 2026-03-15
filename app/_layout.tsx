import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Stack } from 'expo-router';
import { initializeSslPinning } from 'react-native-ssl-public-key-pinning';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
if (!isExpoGo) {
  initializeSslPinning({
    'api.ntdoc.site': { // 锁定你的核心 API 域名
      includeSubdomains: true, 
      publicKeyHashes: [
        // 完美的叶子证书 (api.ntdoc.site)
          'W+o1IWvuIGMIHHGxS//Ur6Huo80ZFKN5uT/ZmaJWaZM=', 
          // 服务器真正发过来的 R12 中间证书
          'kZwN96eHtZftBWrOZUsd6cA4es80n3NzSk/XtYz2EqQ=', 
          // 稳定的终极根证书 (ISRG Root X1)
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