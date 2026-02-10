import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 引入工具
import { tokenStorage } from '../../src/utils/storage';
// 引入 API (假设你已经定义了这些API，如果没有先注释掉)
// import { getUserProfile } from '../../src/api/user'; 

// 引入登录组件 (为了省事，我们直接把刚才的 LoginScreen 逻辑作为子组件引入，或者跳转)
// 这里演示“跳转模式”，更符合移动端习惯

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 检查登录状态
  const checkLogin = async () => {
    setLoading(true);
    const token = await tokenStorage.get();
    
    if (!token) {
      // 没登录，停止加载，页面会显示"未登录"状态
      setUser(null);
      setLoading(false);
      
      // 🚀【关键】直接跳转到独立登录页
      // setTimeout 是为了防止路由冲突
      setTimeout(() => router.push('/login'), 100); 
      return;
    }

    // 有 Token，尝试获取用户信息 (模拟 API 请求)
    try {
      // const res = await getUserProfile(); 
      // setUser(res.data);
      
      // 🚧 临时模拟数据 (等你后端API好了再换真的)
      setUser({
        id: 10086,
        name: 'Ceramic Lover',
        email: 'user@example.com',
        avatar: '', // 后面处理图片
        balance: 5000 // $50.00
      });
      
    } catch (error) {
      console.log('Get profile failed', error);
      // Token 过期处理
      await tokenStorage.remove();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 每次页面获得焦点时，都检查一次 (防止登录后返回不刷新)
  useFocusEffect(
    useCallback(() => {
      checkLogin();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await checkLogin();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Confirm', 
        style: 'destructive',
        onPress: async () => {
          await tokenStorage.remove();
          // try { await logout(); } catch(e) {} // 尝试调后端登出
          setUser(null);
          router.replace('/login'); // 踢回登录页
        }
      }
    ]);
  };

  // === 渲染逻辑 ===

  // 1. 加载中
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#c75d35" />
      </View>
    );
  }

  // 2. 未登录 (虽然会跳走，但留个底以防万一)
  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={{marginBottom: 20, color: '#666'}}>You are not logged in.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
          <Text style={styles.loginBtnText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. 已登录 (显示 Profile 内容 - 复刻你的 Vue 结构)
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.pageTitle}>My Profile</Text>

        {/* --- 用户信息卡片 --- */}
        <View style={styles.card}>
          <View style={styles.userInfoRow}>
            {/* 头像 */}
            <View style={styles.avatarContainer}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Ionicons name="person" size={40} color="#ccc" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </View>

            {/* 名字和邮箱 */}
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name || 'Set your name'}</Text>
              <Text style={styles.userId}>ID: {user.id}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>
        </View>

        {/* --- 支付账户 (Payment Account) --- */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Payment Account</Text>
            <TouchableOpacity onPress={onRefresh}>
              <Ionicons name="refresh" size={18} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.paymentBox}>
            <View style={styles.paymentRow}>
               <View>
                 <Text style={styles.label}>Balance</Text>
                 <Text style={styles.balanceText}>${(user.balance / 100).toFixed(2)}</Text>
               </View>
               <TouchableOpacity style={styles.topUpBtn} onPress={() => Alert.alert('Top Up', 'Open Dialog here')}>
                 <Text style={styles.topUpText}>Top Up</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* --- 地址管理 (My Addresses) --- */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>My Addresses</Text>
          </View>
          
          {/* 这里暂时放个空状态，后续加列表 */}
          <View style={styles.emptyState}>
             <Ionicons name="location-outline" size={40} color="#ddd" />
             <Text style={styles.emptyText}>No address found</Text>
             <TouchableOpacity style={styles.addBtn}>
               <Text style={styles.addBtnText}>+ Add Address</Text>
             </TouchableOpacity>
          </View>
        </View>

        {/* --- 退出按钮 --- */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 20 },

  // Cards
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:5, elevation:2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#333' },

  // User Info
  userInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative', marginRight: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  defaultAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f2f5', justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  userDetails: { flex: 1 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  userId: { fontSize: 12, color: '#999', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#666' },

  // Payment
  paymentBox: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 15, borderWidth: 1, borderColor: '#eee' },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, color: '#666', textTransform: 'uppercase' },
  balanceText: { fontSize: 24, fontWeight: 'bold', color: '#c75d35', marginTop: 4 },
  topUpBtn: { backgroundColor: '#c75d35', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  topUpText: { color: '#fff', fontWeight: 'bold' },

  // Address
  emptyState: { alignItems: 'center', padding: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  emptyText: { color: '#999', marginVertical: 10 },
  addBtn: { marginTop: 10 },
  addBtnText: { color: '#c75d35', fontWeight: '600' },

  // Buttons
  loginBtn: { backgroundColor: '#c75d35', padding: 15, borderRadius: 8, width: 200, alignItems: 'center' },
  loginBtnText: { color: '#fff', fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e74c3c', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  logoutText: { color: '#e74c3c', fontWeight: 'bold' },
});