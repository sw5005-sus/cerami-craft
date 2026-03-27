import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
// 1. 引入安全区域库（Expo 默认自带）
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokenStorage } from '../../src/utils/storage';

interface MainHeaderProps {
  keyword: string;
  onKeywordChange: (text: string) => void;
  onSearch: () => void;
  showBack?: boolean;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ 
  keyword, onKeywordChange, onSearch, showBack = false 
}) => {
  const router = useRouter();
  // 2. 获取当前设备的安全区域距离（比如刘海屏高度）
  const insets = useSafeAreaInsets();

  const handleNotificationPress = async () => {
    const token = await tokenStorage.get();
    console.log('token', token)
    if (!token) {
      Alert.alert(
        'Hint', 
        'Please login first to view messages.', 
        [
          { text: 'Cancel', style: 'cancel' }, // 点取消就留在原页，什么都不做
          { text: 'Login', onPress: () => router.push('/login') } // 点登录才跳转
        ]
      );
      return;
    }

    // 有登录：直接放行，跳转到消息页
    router.push('/notifications');
  };

  return (
    <View style={[
      styles.headerWrapper, 
      // 3. 动态设置顶部内边距，保证不遮挡时间
      { paddingTop: insets.top } 
    ]}>
      <View style={styles.headerContent}>
        
        {/* 返回按钮 */}
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}

        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#999"
            value={keyword}
            onChangeText={onKeywordChange}
            onSubmitEditing={onSearch}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={onSearch} style={styles.searchIconBtn}>
            <Ionicons name="search" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 消息通知*/}
        <TouchableOpacity style={styles.iconBtn} onPress={handleNotificationPress}>
           <Ionicons name="notifications-outline" size={24} color="#333" />
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 10, // 稍微给点内部呼吸空间
    gap: 12,
  },
  backBtn: { paddingRight: 4 },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8, // 圆角稍微大一点更现代
    height: 40,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#333', height: '100%' },
  searchIconBtn: { padding: 4 },
  iconBtn: { padding: 4 },
});