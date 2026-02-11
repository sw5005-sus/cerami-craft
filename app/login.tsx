import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';

// 引入 API 和 安全存储
import { activateAccount, login, register } from '../src/api/auth'; // 确保你有这个文件
import { tokenStorage } from '../src/utils/storage';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  
  // === 状态管理 ===
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  
  // 表单数据
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 注册流程状态: 'input' (输入账号密码) -> 'verification' (输入验证码)
  const [registerStep, setRegisterStep] = useState<'input' | 'verification'>('input');
  const [verificationCode, setVerificationCode] = useState('');

  // === 逻辑处理 ===

  // 1. 登录逻辑
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      // 调用你的 API
      const res = await login({ email, password });
      const token = res.data; //这可能有问题

      if (token) {
        // ✅ 关键步骤：存入 SecureStore
        await tokenStorage.save(token);
        
        Alert.alert('Success', 'Login successful!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/profile') } // 登录成功回个人中心
        ]);
      } else {
        throw new Error('No token received');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Login Failed', error.message || 'Please check your credentials.');
      
      // 🚨【开发后门】如果你想在后端挂掉时也能强制登录，取消下面这几行的注释：
      // await tokenStorage.save('fake-dev-token');
      // router.replace('/(tabs)/account');
    } finally {
      setLoading(false);
    }
  };

  // 2. 注册第一步：提交邮箱密码
  const handleRegister = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    
    setLoading(true);
    try {
      await register({ email, password });
      Alert.alert('Verification Sent', 'Please check your email for the code.');
      setRegisterStep('verification'); // 切换到输入验证码界面
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // 3. 注册第二步：激活账户
  const handleActivate = async () => {
    if (verificationCode.length !== 6) return Alert.alert('Error', 'Code must be 6 digits');

    setLoading(true);
    try {
      await activateAccount({ code: verificationCode });
      Alert.alert('Success', 'Account activated! Please login.', [
        { text: 'OK', onPress: () => {
            setRegisterStep('input');
            setActiveTab('login'); // 自动切回登录 Tab
            setVerificationCode('');
        }}
      ]);
    } catch (error: any) {
      Alert.alert('Activation Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. 重发验证码 / 重置
  const handleRetry = async () => {
    handleRegister(); // 复用注册逻辑就是重发
  };

  const handleReset = () => {
    setRegisterStep('input');
    setVerificationCode('');
  };

  // === 渲染界面 ===
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        
        {/* 1. 顶部图片区域 (对应 Vue 的 login-left) */}
        <View style={styles.headerImageContainer}>
          {/* 这里建议放一张本地图片，或者你原来的 headImage.png */}
          <Image 
            source={require('../assets/images/icon.png')} 
            style={styles.headImage}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 2. 表单区域 (对应 Vue 的 login-right) */}
        <View style={styles.formContainer}>
          
          {/* Tabs */}
          <View style={styles.tabHeader}>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'login' && styles.tabActive]}
              onPress={() => setActiveTab('login')}
            >
              <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabItem, activeTab === 'register' && styles.tabActive]}
              onPress={() => setActiveTab('register')}
            >
              <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* Login Form */}
          {activeTab === 'login' && (
            <View style={styles.formContent}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter your email" 
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />

              <Text style={styles.label}>PASSWORD</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Password" 
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <View style={styles.rowBetween}>
                <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
              </View>

              <TouchableOpacity 
                style={styles.primaryBtn} 
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>SIGN IN</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <View style={styles.formContent}>
              {/* Step 1: Input */}
              {registerStep === 'input' && (
                <>
                  <Text style={styles.label}>EMAIL ADDRESS</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Enter your email" 
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                  />

                  <Text style={styles.label}>PASSWORD</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="At least 8 chars" 
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />

                  <TouchableOpacity 
                    style={styles.primaryBtn} 
                    onPress={handleRegister}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>REGISTER</Text>}
                  </TouchableOpacity>
                </>
              )}

              {/* Step 2: Verification */}
              {registerStep === 'verification' && (
                <>
                  <Text style={styles.infoText}>Code sent to: {email}</Text>
                  
                  <Text style={styles.label}>VERIFICATION CODE</Text>
                  <View style={styles.verifyRow}>
                    <TextInput 
                      style={[styles.input, { flex: 1 }]} 
                      placeholder="6-digit code" 
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      maxLength={6}
                      keyboardType="number-pad"
                    />
                    <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                      <Text style={styles.retryText}>RETRY</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={styles.primaryBtn} 
                    onPress={handleActivate}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>ACTIVATE ACCOUNT</Text>}
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={handleReset} style={{marginTop: 15, alignItems:'center'}}>
                     <Text style={{color: '#999'}}>Start Over</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Back to Home Button (Shared) */}
          <TouchableOpacity 
             style={styles.secondaryBtn}
             onPress={() => router.replace('/(tabs)/profile')} // 或者 router.back()
          >
            <Text style={styles.secondaryBtnText}>BACK TO HOME</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // Header Image
  headerImageContainer: {
    height: height * 0.35, // 占屏幕 35%
    backgroundColor: '#f5e1d0',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headImage: { width: '100%', height: '100%' },
  closeBtn: {
    position: 'absolute', top: 50, right: 20,
    backgroundColor: 'rgba(0,0,0,0.3)', width: 30, height: 30,
    borderRadius: 15, justifyContent: 'center', alignItems: 'center'
  },
  closeText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Form
  formContainer: {
    flex: 1,
    padding: 30,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20, // 稍微盖住一点图片，增加设计感
  },
  
  // Tabs
  tabHeader: { flexDirection: 'row', marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabItem: { marginRight: 30, paddingBottom: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#c75d35' },
  tabText: { fontSize: 16, color: '#999', fontWeight: '500' },
  tabTextActive: { color: '#333', fontWeight: '600' },

  // Inputs
  formContent: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#ddd', padding: 12, fontSize: 14,
    borderRadius: 4, backgroundColor: '#fff', height: 48
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, marginBottom: 20 },
  forgotText: { fontSize: 12, color: '#c75d35', fontWeight: '600' },
  infoText: { fontSize: 14, color: '#666', marginBottom: 10, fontStyle: 'italic' },

  // Verify
  verifyRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  retryBtn: { 
    backgroundColor: '#6c757d', justifyContent: 'center', alignItems: 'center', 
    paddingHorizontal: 16, borderRadius: 4, height: 48 
  },
  retryText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  // Buttons
  primaryBtn: {
    backgroundColor: '#c75d35', height: 50, borderRadius: 4,
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
    shadowColor: '#c75d35', shadowOpacity: 0.3, shadowOffset: {width:0, height:4}
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 1 },
  
  secondaryBtn: {
    backgroundColor: '#999', height: 50, borderRadius: 4,
    justifyContent: 'center', alignItems: 'center', marginTop: 10
  },
  secondaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 1 },
});