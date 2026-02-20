import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'; // 👈 1. 引入 Stack
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getOrderDetail, type OrderDetail } from '../../src/api/order';
import { getProductDetail } from '../../src/api/product';
import { S3_CONFIG } from '../../src/config/api-endpoints';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const data = await getOrderDetail(id!);
      const updatedItems = await Promise.all(
        data.order_items.map(async (item) => {
          if (!item.pic_info) {
            try {
              const productInfo = await getProductDetail(item.product_id);
              if (productInfo && productInfo.pic_info) {
                return { ...item, pic_info: productInfo.pic_info };
              }
            } catch (err) {
              console.warn(`❌ Failed to fetch product ${item.product_id} details:`, err);
            }
          }
          return item; // 原样返回
        })
      );

      data.order_items = updatedItems;
      setOrder(data);
    } catch (error: any) {
      Alert.alert('Error', error.err_msg || error.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (price: number) => `$${(price / 100).toFixed(2)}`;

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getImageUrl = (picInfo?: string) => {
    if (!picInfo) return 'https://via.placeholder.com/80';
    if (picInfo.startsWith('http')) return picInfo;
    try {
      if (picInfo.startsWith('[')) {
        const arr = JSON.parse(picInfo);
        return arr.length > 0 ? S3_CONFIG.BASE_URL + arr[0] : 'https://via.placeholder.com/80';
      }
      return S3_CONFIG.BASE_URL + picInfo;
    } catch {
      return 'https://via.placeholder.com/80';
    }
  };

  const getStatusStyle = (statusName: string) => {
    switch (statusName) {
      case 'Shipped': case '已发货':
      case 'Delivered': case '已完成':
        return { bg: '#dcfce7', text: '#16a34a' };
      case 'Processing': case '处理中':
        return { bg: '#dbeafe', text: '#2563eb' };
      case 'Pending': case '待支付':
        return { bg: '#fef3e2', text: '#d97706' };
      case 'Cancelled': case '已取消':
        return { bg: '#fef2f2', text: '#dc2626' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const handleWriteReview = () => {
    Alert.alert('Notice', 'Review feature is coming soon!');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#c75d35" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="warning-outline" size={48} color="#dc2626" />
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.back()}>
          <Text style={styles.btnPrimaryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusStyle = getStatusStyle(order.status_name);
  const isDelivered = order.status_name === 'Delivered' || order.status_name === '已完成';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 👈 2. 隐藏原生导航栏 */}
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* 自定义导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* 订单基本信息 */}
        <View style={styles.sectionCard}>
          <View style={styles.orderHeaderTop}>
            <View>
              <Text style={styles.orderNo}>Order #{order.order_no}</Text>
              <Text style={styles.orderDate}>Placed on {formatDate(order.create_time)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{order.status_name}</Text>
            </View>
          </View>
        </View>

        {/* 配送信息 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.infoSubtitle}>Shipping Address</Text>
            <Text style={styles.addressText}><Text style={{fontWeight:'bold'}}>{order.receiver_first_name} {order.receiver_last_name}</Text></Text>
            <Text style={styles.addressText}>{order.receiver_address}</Text>
            <Text style={styles.addressText}>{order.receiver_country}, {order.receiver_zip_code}</Text>
            <Text style={styles.addressText}>{order.receiver_phone}</Text>
          </View>

          {order.logistics_no && (
            <View style={styles.deliveryDetails}>
              <Text style={styles.infoSubtitle}>Delivery Details</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>Carrier:</Text>
                <Text style={styles.value}>Express Delivery</Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>Tracking No:</Text>
                <Text style={styles.value}>{order.logistics_no}</Text>
              </View>
              {order.delivery_time && (
                <View style={styles.rowBetween}>
                  <Text style={styles.label}>Delivery Time:</Text>
                  <Text style={styles.value}>{formatDate(order.delivery_time)}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 商品列表 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Items in Your Order</Text>
          {order.order_items.map((item, index) => (
            <View key={item.id} style={[styles.itemRow, index > 0 && styles.itemBorder]}>
              <Image source={{ uri: getImageUrl(item.pic_info) }} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
                <View style={styles.itemPriceQty}>
                  <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                  <Text style={styles.itemQty}>x {item.quantity}</Text>
                </View>
                {isDelivered && (
                  <TouchableOpacity style={styles.reviewBtn} onPress={handleWriteReview}>
                    <Text style={styles.reviewBtnText}>Write a Review</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.itemTotal}>{formatCurrency(item.total_price)}</Text>
            </View>
          ))}
        </View>

        {/* 支付总结 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.infoSubtitle}>Payment Method</Text>
            <Text style={styles.addressText}>Point Card Wallet</Text>
          </View>
          
          <View style={styles.summaryBlock}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Subtotal:</Text>
              <Text style={styles.value}>{formatCurrency(order.total_amount - order.shipping_fee - order.tax)}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Shipping:</Text>
              <Text style={styles.value}>{formatCurrency(order.shipping_fee)}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Tax:</Text>
              <Text style={styles.value}>{formatCurrency(order.tax)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.total_amount)}</Text>
            </View>
            <Text style={styles.paymentNote}>No fees for point card payment. 1 Point = $1</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' },
  loadingText: { marginTop: 12, color: '#666' },
  errorText: { marginTop: 12, fontSize: 16, color: '#666', marginBottom: 20 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  content: { padding: 15 },
  
  sectionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  
  orderHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNo: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  orderDate: { fontSize: 13, color: '#6b7280' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  
  infoBlock: { marginBottom: 10 },
  infoSubtitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  addressText: { fontSize: 14, color: '#444', lineHeight: 22 },
  deliveryDetails: { borderTopWidth: 1, borderColor: '#eee', paddingTop: 12, marginTop: 12 },
  
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14, color: '#6b7280' },
  value: { fontSize: 14, color: '#1a1a1a', fontWeight: '500' },
  
  // 👈 3. 修复了这里的样式错误 (删除了 py: 12)
  itemRow: { flexDirection: 'row', paddingVertical: 12 },
  itemBorder: { borderTopWidth: 1, borderColor: '#f1f5f9' },
  itemImage: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#f0f0f0', marginRight: 12 },
  itemDetails: { flex: 1, justifyContent: 'center', paddingRight: 10 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 6 },
  itemPriceQty: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  itemPrice: { fontSize: 14, color: '#c75d35', fontWeight: '600' },
  itemQty: { fontSize: 13, color: '#6b7280' },
  itemTotal: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', alignSelf: 'center' },
  
  reviewBtn: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#c75d35', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  reviewBtnText: { color: '#c75d35', fontSize: 12, fontWeight: '500' },
  
  summaryBlock: { borderTopWidth: 1, borderColor: '#eee', paddingTop: 16, marginTop: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderColor: '#f1f5f9' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#c75d35' },
  paymentNote: { fontSize: 12, color: '#999', marginTop: 12, textAlign: 'center' },
  
  btnPrimary: { backgroundColor: '#c75d35', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 20 },
  btnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});