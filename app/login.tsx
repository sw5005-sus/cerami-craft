import { useRouter } from 'expo-router'; // <--- 关键改变
import React, { useState } from 'react';
import {
    Alert, KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';

// 假设你有这个图，没有的话暂时注释掉
// const HEAD_IMAGE = require('../assets/images/adaptive-icon.png'); 

export default function LoginScreen() {
  const router = useRouter(); // <--- 获取路由对象
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // ... (这里保留之前的 state: email, password, loading 等)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // 模拟登录
    Alert.alert('Success', 'Logged in!');
    router.back(); // <--- 返回上一页 (相当于 navigation.goBack())
  };

  const handleBackToHome = () => {
    router.replace('/'); // <--- 替换路由回首页 (不留历史记录)
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 图片区域 */}
        <View style={styles.imageContainer}>
           <Text style={{fontSize: 50}}>🔒</Text> 
           {/* 先用 Emoji 代替图片，保证你能跑起来 */}
        </View>

        <View style={styles.formContainer}>
          {/* TABS */}
          <View style={styles.tabHeader}>
            <TouchableOpacity onPress={() => setActiveTab('login')} style={[styles.tabItem, activeTab === 'login' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('register')} style={[styles.tabItem, activeTab === 'register' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>Register</Text>
            </TouchableOpacity>
          </View>

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <View>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="admin@nus.edu" autoCapitalize="none"/>
              
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
              
              <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                <Text style={styles.primaryButtonText}>SIGN IN</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 游客模式按钮 */}
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToHome}>
            <Text style={styles.secondaryButtonText}>CONTINUE AS GUEST</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5e1d0' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  imageContainer: { height: 200, justifyContent: 'center', alignItems: 'center' },
  formContainer: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, minHeight: 500 },
  tabHeader: { flexDirection: 'row', marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabItem: { marginRight: 30, paddingBottom: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#333' },
  tabText: { fontSize: 16, color: '#999' },
  activeTabText: { color: '#333', fontWeight: 'bold' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 15, fontSize: 16, marginBottom: 10 },
  primaryButton: { backgroundColor: '#333', padding: 15, alignItems: 'center', marginTop: 20 },
  primaryButtonText: { color: 'white', fontWeight: 'bold' },
  secondaryButton: { backgroundColor: '#999', padding: 15, alignItems: 'center', marginTop: 10 },
  secondaryButtonText: { color: 'white', fontWeight: 'bold' },
});