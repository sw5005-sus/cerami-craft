import { isTokenValid } from '@/src/utils/auth';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { confirmDelivery, getOrderList, type Order } from '../../src/api/order';
import { tokenStorage } from '../../src/utils/storage';

export default function OrdersScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 获取订单列表的函数
  const fetchOrders = async () => {
    try {
      const token = await tokenStorage.get();
      const validToken = await isTokenValid(token);
      if (!token || !validToken) {
        setIsLoggedIn(false);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setIsLoggedIn(true);
      const response = await getOrderList({ limit: 20, offset: 0 });
      setOrders(response.orders || []);
    } catch (error: any) {
      console.warn('error Failed to fetch orders:', error);
      if (error.code === 401 || error?.response?.status === 401) {
        //setIsLoggedIn(false);
      } else {
        Alert.alert('Error', error.err_msg || error.message || 'Failed to load orders');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 使用 useFocusEffect：每次切到这个 Tab 时都会静默刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  // 下拉刷新
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // 确认收货
  const handleConfirmDelivery = (orderNo: string) => {
    Alert.alert(
      'Confirm Receipt',
      'Are you sure you have received this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              await confirmDelivery(orderNo);
              Alert.alert('Success', 'Delivery confirmed successfully');
              fetchOrders(); // 刷新列表
            } catch (error: any) {
              Alert.alert('Error', error.err_msg || 'Failed to confirm delivery');
            }
          }
        }
      ]
    );
  };

  // 跳转到订单详情 (我们下一步再建这个页面)
  const goToDetail = (orderNo: string) => {
    router.push(`/order/${orderNo}`);
  };

  // 格式化价格
  const formatCurrency = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 状态样式映射 (复刻 Vue 的样式)
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Paid':
        return { bg: '#dbeafe', text: '#2563eb' };
      case 'Shipped':
      case '已发货':
        return { bg: '#f0f9ff', text: '#0369a1' };
      case 'Delivered':
      case '已完成':
        return { bg: '#dcfce7', text: '#16a34a' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  // 渲染单个订单卡片
  const renderItem = ({ item }: { item: Order }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <View style={styles.card}>
        {/* 卡片头部 */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNo}>Order #{item.order_no}</Text>
            <Text style={styles.orderDate}>{formatDate(item.create_time)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* 卡片主体：配送信息 */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Receiver:</Text>
            <Text style={styles.infoValue}>{item.receiver_first_name} {item.receiver_last_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{item.receiver_phone}</Text>
          </View>
        </View>

        {/* 卡片底部：金额与操作 */}
        <View style={styles.cardFooter}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total: </Text>
            <Text style={styles.totalAmount}>{formatCurrency(item.total_amount)}</Text>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnOutline} onPress={() => goToDetail(item.order_no)}>
              <Text style={styles.btnOutlineText}>View Details</Text>
            </TouchableOpacity>
            
            {/* 仅在状态为 Shipped / 已发货 时显示确认收货按钮 */}
            {(item.status === 'Shipped' || item.status === '已发货') && (
              <TouchableOpacity style={styles.btnPrimary} onPress={() => handleConfirmDelivery(item.order_no)}>
                <Text style={styles.btnPrimaryText}>Confirm</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}><Text style={styles.headerTitle}>My Orders</Text></View>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Please Log In</Text>
          <Text style={styles.emptyText}>You need to log in to view your orders.</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/login')}>
            <Text style={styles.shopBtnText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#c75d35" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.order_no}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#c75d35']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptyText}>You have not placed any orders yet.</Text>
              <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/')}>
                <Text style={styles.shopBtnText}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6b7280' },
  
  listContent: { padding: 15, paddingBottom: 30 },
  
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderColor: '#f1f5f9', paddingBottom: 12, marginBottom: 12 },
  orderNo: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  orderDate: { fontSize: 12, color: '#6b7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  
  cardBody: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  infoLabel: { fontSize: 13, color: '#6b7280' },
  infoValue: { fontSize: 13, color: '#1a1a1a', fontWeight: '500' },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  totalContainer: { flexDirection: 'row', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#6b7280' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#c75d35' },
  
  actions: { flexDirection: 'row', gap: 8 },
  btnOutline: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#c75d35' },
  btnOutlineText: { color: '#c75d35', fontSize: 13, fontWeight: '500' },
  btnPrimary: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#c75d35' },
  btnPrimaryText: { color: '#fff', fontSize: 13, fontWeight: '500' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, color: '#374151', fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptyText: { color: '#6b7280', marginBottom: 24 },
  shopBtn: { backgroundColor: '#c75d35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
  shopBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});