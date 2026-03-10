import { Ionicons } from '@expo/vector-icons';
import { exchangeCodeAsync, makeRedirectUri, refreshAsync, useAuthRequest, useAutoDiscovery } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { syncZitadelCallback } from '../src/api/auth';
import { tokenStorage } from '../src/utils/storage';


import type { UserProfile } from '../src/types/api';


// 必须调用此方法以确保 WebBrowser 认证后能正确关闭弹窗
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();

  // 替换为你 Zitadel 控制台里的 Client ID
  const CLIENT_ID = '361761429302373082'; 
  
  // 利用 useAutoDiscovery 自动获取你的 Zitadel OIDC 配置
  const discovery = useAutoDiscovery('https://cerami-t6ihrd.us1.zitadel.cloud');

  // 生成回跳 URI (会自动使用 app.json 里的 scheme)
  const redirectUri = makeRedirectUri({
    scheme: 'ceramicraft',
    path: 'login'
  });
  console.log('🔗 Expo 真实的 Redirect URI 是:', redirectUri);

  // 配置授权请求 (Authorization Code Flow with PKCE)
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'email', 'offline_access', 'urn:zitadel:iam:user:metadata', 'custom:local_userid'],
      redirectUri,
    },
    discovery
  );

  // 监听浏览器重定向回来的结果
  useEffect(() => {
    const handleResponse = async () => {
      if (response?.type === 'success') {
        const { code } = response.params;
        
        try {
          // 1. 换取初次 Token 和 Refresh Token
          const tokenResult = await exchangeCodeAsync(
            {
              clientId: CLIENT_ID,
              code,
              redirectUri,
              extraParams: { code_verifier: request?.codeVerifier || '' },
            },
            discovery!
          );

          console.log('🎉 拿到初次 Token，准备呼叫后端...');

          // 2. 呼叫后端建档并写入 Metadata
          await syncZitadelCallback(tokenResult.accessToken)
          console.log('✅ 后端建档、写 Metadata 成功！');

          // 3. 核心步骤：用 Refresh Token 换取包含 Metadata 的新 Token
          let finalAccessToken = tokenResult.accessToken; 
          
          if (tokenResult.refreshToken) {
            console.log('🔄 正在向 Zitadel 申请包含 Metadata 的新 Token...');
            const refreshedResult = await refreshAsync(
              {
                clientId: CLIENT_ID,
                refreshToken: tokenResult.refreshToken,
              },
              discovery!
            );
            // 这个 finalAccessToken 就是被我们脚本注入了业务数据的终极 Token
            finalAccessToken = refreshedResult.accessToken; 
            console.log('🎉 终极 Token 获取成功！');
          } else {
             console.warn('⚠️ Zitadel 没有返回 Refresh Token，请检查控制台 Grant Types 配置！');
          }

          // 4. 存入本地沙盒，加载业务数据
          await tokenStorage.save(finalAccessToken);
          
          // 跳转回个人中心或首页
          router.replace('/(tabs)/profile');
          
        } catch (error) {
          console.warn('error Token Exchange Error:', error);
          Alert.alert('Error', 'Failed to exchange token.');
        }
      } else if (response?.type === 'error') {
        Alert.alert('Login Failed', response.error?.message);
      }
    };

    if (response && discovery && request) {
      handleResponse();
    }
  }, [response, discovery, request]);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Confirm', 
        style: 'destructive',
        onPress: async () => {
          try {
            // 1. 构造登出后跳回 App 的地址（必须和 Zitadel 后台配的一模一样）
            const returnTo = makeRedirectUri({
              scheme: 'ceramicraft',
              path: 'login' // 登出后让他回登录页
            });

            // 2. 拼接 Zitadel 的注销接口 URL
            const clientId = '361761429302373082'; // 填入你的 RN App Client ID
            const zitadelDomain = 'https://cerami-t6ihrd.us1.zitadel.cloud'; // 你的 Zitadel 实例地址
            
            // OIDC 标准的登出端点
            const logoutUrl = `${zitadelDomain}/oidc/v1/end_session?client_id=${clientId}&post_logout_redirect_uri=${encodeURIComponent(returnTo)}`;

            // 3. 拉起浏览器，去 Zitadel 服务器上清除 Session Cookie
            const result = await WebBrowser.openAuthSessionAsync(logoutUrl, returnTo);
            console.log('🚪 Logout Result:', result);

            // 4. 清理本地沙盒里的 Token 和内存状态
            await tokenStorage.remove();
            setUser(null);
            
            // (可选) 如果你用了 Expo Router，可以直接 push 回首页或登录页
            // router.replace('/login');
            
          } catch (error) {
            console.warn('error Logout failed:', error);
            Alert.alert('Error', 'Failed to log out properly.');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/'); 
          }
        }}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="shield-checkmark" size={80} color="#c75d35" />
          <Text style={styles.title}>CeramiCraft IAM</Text>
          <Text style={styles.subtitle}>Secure login powered by Zitadel</Text>
        </View>

        <TouchableOpacity 
          style={styles.loginBtn} 
          disabled={!request}
          onPress={() => promptAsync()}
        >
          {!request ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Continue with Zitadel</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout}>
          <Text>temp Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  logoContainer: { alignItems: 'center', marginBottom: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 20 },
  subtitle: { fontSize: 16, color: '#666', marginTop: 10 },
  loginBtn: { backgroundColor: '#c75d35', width: '100%', padding: 16, borderRadius: 12, alignItems: 'center' },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});