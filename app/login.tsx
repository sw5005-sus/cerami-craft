import { Ionicons } from '@expo/vector-icons';
import { exchangeCodeAsync, makeRedirectUri, useAuthRequest, useAutoDiscovery } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tokenStorage } from '../src/utils/storage';

// 必须调用此方法以确保 WebBrowser 认证后能正确关闭弹窗
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();

  // 替换为你 Zitadel 控制台里的 Client ID
  const CLIENT_ID = '361761429302373082'; 
  
  // 利用 useAutoDiscovery 自动获取你的 Zitadel OIDC 配置
  const discovery = useAutoDiscovery('https://cerami-t6ihrd.us1.zitadel.cloud');

  // 生成回跳 URI (会自动使用 app.json 里的 scheme)
  const redirectUri = makeRedirectUri({
    scheme: 'cerami-craft',
    path: 'login'
  });
  // 👇 加这一行
  console.log('🔗 Expo 真实的 Redirect URI 是:', redirectUri);

  // 配置授权请求 (Authorization Code Flow with PKCE)
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
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
          // 拿到 Authorization Code 后，去 Zitadel 换取 JWT Token
          const tokenResult = await exchangeCodeAsync(
            {
              clientId: CLIENT_ID,
              code,
              redirectUri,
              extraParams: {
                code_verifier: request?.codeVerifier || '', // PKCE 核心验证器
              },
            },
            discovery!
          );

          console.log('🎉 成功获取 JWT Access Token:', tokenResult.accessToken);
          
          // 覆盖原本的旧版 token，现在存的是 Zitadel 颁发的 JWT
          await tokenStorage.save(tokenResult.accessToken);
          
          Alert.alert('Success', 'Logged in successfully!');
          // 跳转回个人中心或首页
          router.replace('/(tabs)/profile');
          
        } catch (error) {
          console.error('Token Exchange Error:', error);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
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