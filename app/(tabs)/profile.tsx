import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tokenStorage } from '../../src/utils/storage';
// 假设 S3 配置还在，没有就用空字符串
import { S3_CONFIG } from '../../src/config/api-endpoints';

// ✅ 正确引用 User API (只有这两个)
import { getUserProfile, updateUserProfile } from '../../src/api/user';
// ✅ 正确引用 Payment API
import { getPayAccountSelf, PayAccountInfo, topUpAccount } from '../../src/api/payment';
// ✅ 正确引用 Image Hook
import { useImageUpload } from '../../src/composables/useImageUpload';
import type { UserProfile } from '../../src/types/api';

export default function ProfileScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [payment, setPayment] = useState<PayAccountInfo | null>(null);

  // ✅ 使用上传 Hook
  const { uploadAvatar, uploading: uploadingImage } = useImageUpload();

  // 交互状态
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [newName, setNewName] = useState('');

  // 🛡️ 加载数据
  const loadData = async () => {
    try {
      const token = await tokenStorage.get();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const [userData, payData] = await Promise.all([
        getUserProfile(),
        getPayAccountSelf()
      ]);
      setUser(userData);
      setPayment(payData);
    } catch (error: any) {
      if (error?.code === 401 || error?.response?.status === 401) {
         await tokenStorage.remove();
         setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePickImage = async () => {
    console.log('👆 [Account] User clicked Avatar');
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Need access to photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    console.log('📦 Picker Result:', result.canceled);
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      console.log('🖼️ Got URI:', uri);
      try {
        const imageId = await uploadAvatar(uri);
        
        if (user) {
           // ✅✅✅ [关键修复] 严格适配你的 UserProfile 接口
           // 既然 avatar 是 string 必填，我们用 || '' 兜底，防止 undefined 报错
           const updatedProfile: UserProfile = { 
             ...user, 
             avatar: imageId || '' 
           };
           await updateUserProfile(updatedProfile);
        }
        
        Alert.alert('Success', 'Avatar updated!');
        onRefresh();
      } catch (e) {
        console.log('Avatar update flow failed');
      }
    }
  };

  // === ✏️ 修改名字 ===
  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    try {
      if (user) {
        // ✅✅✅ [关键修复] 同上，确保类型安全
        const updatedProfile: UserProfile = { 
          ...user, 
          name: newName,
          avatar: user.avatar || '' // 强制给一个 string
        };
        await updateUserProfile(updatedProfile);
      }
      Alert.alert('Success', 'Name updated successfully');
      setEditNameVisible(false);
      onRefresh();
    } catch (e) {
      Alert.alert('Error', 'Failed to update name');
    }
  };
  // === 💰 功能: 充值 ===
  const handleTopUp = async () => {
    if (!redeemCode) return Alert.alert('Error', 'Please enter a code');
    setTopUpLoading(true);
    try {
      // 现在的 API 不需要再处理返回值的 code，因为 API 层已经处理了 throw error
      await topUpAccount(redeemCode);
      
      Alert.alert('Success', 'Top up successful!');
      setTopUpVisible(false);
      setRedeemCode('');
      onRefresh(); // 刷新余额
    } catch (e: any) {
      Alert.alert('Failed', e.message || 'Invalid redeem code');
    } finally {
      setTopUpLoading(false);
    }
  };

  // === 🚪 登出 ===
  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Confirm', 
        style: 'destructive',
        onPress: async () => {
          await tokenStorage.remove();
          setUser(null);
          // 登出后保留在当前页，显示 Guest UI
        }
      }
    ]);
  };

  // --- 辅助：获取头像 URL ---
  const getAvatarUri = () => {
    if (user?.avatar) {
      // 如果已经是完整链接
      if (user.avatar.startsWith('http')) return { uri: user.avatar };
      // 如果只是 ID，拼接 S3 地址 (确保 api-endpoints.ts 里导出了 S3_CONFIG)
      // 如果你没有 S3_CONFIG，请替换为你的实际图片前缀字符串
      return { uri: `${S3_CONFIG?.BASE_URL || 'http://YOUR_IMAGE_SERVER/'}${user.avatar}` };
    }
    return null; 
  };

  // ================= 渲染 UI =================

  // 1. Guest Mode (未登录)
  if (!loading && !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
             <Ionicons name="person" size={60} color="#e0e0e0" />
          </View>
          <Text style={styles.guestTitle}>Welcome to CeramiCraft</Text>
          <Text style={styles.guestSubtitle}>Please login to manage your account.</Text>
          <TouchableOpacity style={styles.guestLoginBtn} onPress={() => router.push('/login')}>
            <Text style={styles.guestLoginText}>Login / Register</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Member Mode (已登录)
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
            {/* 头像 (点击上传) */}
            <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
              {getAvatarUri() ? (
                <Image source={getAvatarUri()!} style={styles.avatar} />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Ionicons name="person" size={40} color="#ccc" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* 名字 (点击修改) */}
            <View style={styles.userDetails}>
              <TouchableOpacity onPress={() => { setNewName(user?.name || ''); setEditNameVisible(true); }}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.userName}>{user?.name || 'Set Name'}</Text>
                  <Ionicons name="pencil" size={16} color="#999" style={{marginLeft: 8}} />
                </View>
              </TouchableOpacity>
              <Text style={styles.userEmail}>{user?.email}</Text>
              
              {/* ID Display */}
              <Text style={styles.userId}>ID: {user?.id}</Text>
            </View>
          </View>
        </View>

        {/* --- 钱包卡片 --- */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>My Wallet</Text>
            {/* 🚨 注意：balance 已经在 API 层除以 100 了，这里直接显示 */}
            <Text style={styles.balanceText}>${(payment?.balance || 0).toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.menuItem} onPress={() => setTopUpVisible(true)}>
            <View style={styles.menuLeft}>
               <Ionicons name="wallet-outline" size={22} color="#666" />
               <Text style={styles.menuText}>Top Up Balance</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* --- 菜单列表 --- */}
        <View style={styles.card}>
           {/* 地址管理：跳转 */}
           <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/address')}>
            <View style={styles.menuLeft}>
               <Ionicons name="location-outline" size={22} color="#666" />
               <Text style={styles.menuText}>Shipping Addresses</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <View style={styles.menuDivider} />

          {/* 订单管理：跳转 */}
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/orders')}>
            <View style={styles.menuLeft}>
               <Ionicons name="list-outline" size={22} color="#666" />
               <Text style={styles.menuText}>My Orders</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* 登出 */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* === 弹窗 1: Top Up === */}
      <Modal animationType="slide" transparent={true} visible={topUpVisible} onRequestClose={() => setTopUpVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Top Up Account</Text>
            <Text style={styles.modalSubtitle}>Enter redeem code</Text>
            
            <TextInput 
              style={styles.modalInput} 
              placeholder="Enter Code" 
              value={redeemCode} 
              onChangeText={setRedeemCode}
            />
            
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setTopUpVisible(false)}>
                <Text style={{color: '#666'}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleTopUp} disabled={topUpLoading}>
                {topUpLoading ? <ActivityIndicator color="#fff"/> : <Text style={{color: '#fff', fontWeight: 'bold'}}>Top Up</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* === 弹窗 2: Edit Name === */}
      <Modal animationType="fade" transparent={true} visible={editNameVisible} onRequestClose={() => setEditNameVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="Enter new name" 
              value={newName} 
              onChangeText={setNewName}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setEditNameVisible(false)}>
                <Text style={{color: '#666'}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnConfirm} onPress={handleUpdateName}>
                <Text style={{color: '#fff', fontWeight: 'bold'}}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scrollContent: { padding: 20 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 20 },
  
  // Guest
  guestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 60 },
  guestIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  guestTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  guestSubtitle: { fontSize: 14, color: '#888', marginBottom: 40, textAlign: 'center' },
  guestLoginBtn: { backgroundColor: '#c75d35', width: '100%', paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
  guestLoginText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Member
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  
  // User Info
  userInfoRow: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { marginRight: 16, position: 'relative' },
  avatar: { width: 70, height: 70, borderRadius: 35 },
  defaultAvatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#f0f2f5', justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#c75d35', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  userDetails: { flex: 1 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 14, color: '#888', marginTop: 4 },
  userId: { fontSize: 12, color: '#ccc', marginTop: 2 },

  balanceText: { fontSize: 20, fontWeight: 'bold', color: '#c75d35' },

  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuText: { fontSize: 15, color: '#333' },
  menuDivider: { height: 1, backgroundColor: '#f5f5f5', marginLeft: 34 },

  logoutBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  logoutText: { color: '#e74c3c', fontWeight: 'bold' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
  modalBtnRow: { flexDirection: 'row', gap: 12 },
  modalBtnCancel: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#f5f5f5', alignItems: 'center' },
  modalBtnConfirm: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#c75d35', alignItems: 'center' },
});