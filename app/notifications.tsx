import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokenStorage } from '../src/utils/storage';

// === 消息数据接口 ===
export interface AppMessage {
  id: string;
  title: string; // 标题明文 (比如: "订单通知")
  encrypted_content: string; // 内容密文 (核心！)
  created_at: string;
  is_read: boolean;
}

export default function NotificationsScreen() {
  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // === 核心逻辑：获取与解密 ===
  const fetchMessages = async () => {
    try {
      const token = await tokenStorage.get();
      if (!token) return;

      // TODO: 替换为你们真实的后端接口
      // const res = await getMessageList(); 
      
      // 🚀 模拟后端返回的密文数据
      const mockData: AppMessage[] = [
        {
          id: '1',
          title: '系统安全通知',
          encrypted_content: 'U2FsdGVkX1+MockEncryptedString111', // 假装这是 AES/RSA 密文
          created_at: new Date().toISOString(),
          is_read: false,
        },
        {
          id: '2',
          title: '订单已发货',
          encrypted_content: 'U2FsdGVkX1+MockEncryptedString222', 
          created_at: new Date(Date.now() - 86400000).toISOString(), // 昨天
          is_read: true,
        }
      ];

      setMessages(mockData);
    } catch (error) {
      console.log('拉取消息失败', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  // 🛡️ 模拟本地解密引擎 (把这个换成你们真正的 decrypt 函数)
  const decryptContent = (cipherText: string) => {
    if (!cipherText) return '内容解析失败';
    // TODO: 真正的本地密钥解密逻辑写在这里
    return `(已本地解密) 您的陶瓷工艺品已出库！原密文片段: ${cipherText.slice(0, 10)}...`;
  };

  // 标记为已读
  const markAsRead = (id: string) => {
    // TODO: 调用后端接口标记已读
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  // === UI 渲染 ===
  const renderItem = ({ item }: { item: AppMessage }) => {
    // 渲染时实时解密
    const plainText = decryptContent(item.encrypted_content);

    return (
      <TouchableOpacity 
        style={[styles.messageCard, !item.is_read && styles.unreadCard]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            {/* 未读红点 */}
            {!item.is_read && <View style={styles.unreadDot} />}
            <Text style={[styles.title, !item.is_read && styles.unreadTitle]}>{item.title}</Text>
          </View>
          <Text style={styles.timeText}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.content} numberOfLines={2}>{plainText}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#c75d35" />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c75d35" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={60} color="#ddd" />
              <Text style={styles.emptyText}>No new messages</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  navBar: {
    height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee'
  },
  backBtn: { padding: 4 },
  navTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  listContent: { padding: 16, flexGrow: 1 },
  
  messageCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
    borderWidth: 1, borderColor: '#fff'
  },
  unreadCard: {
    borderColor: '#ffe6dc', backgroundColor: '#fffdfb' // 未读时给个淡淡的品牌色背景
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#c75d35', marginRight: 6 },
  title: { fontSize: 16, color: '#666', fontWeight: '500' },
  unreadTitle: { color: '#333', fontWeight: 'bold' },
  timeText: { fontSize: 12, color: '#999' },
  content: { fontSize: 14, color: '#666', lineHeight: 20, marginTop: 4 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999' }
});