  import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

  import { isTokenValid } from '@/src/utils/auth';
import { useCart } from '../../src/composables/useCart';
import { useCheckout } from '../../src/composables/useCheckout';
import { usePaymentAccount } from '../../src/composables/usePaymentAccount';
import { S3_CONFIG } from '../../src/config/api-endpoints';
import { tokenStorage } from '../../src/utils/storage';

  export default function CartScreen() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(true);
    
    // Hooks
    const { 
      cartItems, priceEstimate, loading, isEmpty, selectedItemCount,
      loadCart, updateQuantity, toggleSelection, toggleSelectAll, handleRemove 
    } = useCart();

    const { 
      payAccount, loadPayAccount, performTopUp, topUpLoading 
    } = usePaymentAccount();

    // Local State
    const [topUpVisible, setTopUpVisible] = useState(false);
    const [redeemCode, setRedeemCode] = useState('');
    const { setCheckoutData } = useCheckout();
    const [isBalanceVisible, setIsBalanceVisible] = useState(false);

    // 每次进入页面刷新数据
    useFocusEffect(
      useCallback(() => {
        const checkAuthAndLoad = async () => {
        const token = await tokenStorage.get();
        const validToken = isTokenValid(token);
        if (!token || !validToken) {
          setIsLoggedIn(false);
          return;
        }
        setIsLoggedIn(true);
        loadCart();
        loadPayAccount();
      };
      checkAuthAndLoad();
      }, [])
    );

    // 解析图片 URL (简单版)
    const getImageUrl = (picInfo: string) => {
      try {
        // 尝试解析 JSON 数组
        if (picInfo.startsWith('[')) {
          const arr = JSON.parse(picInfo);
          if (arr.length > 0) return S3_CONFIG.BASE_URL + arr[0];
        }
        // 否则直接拼接
        return S3_CONFIG.BASE_URL + picInfo;
      } catch (e) {
        return 'https://via.placeholder.com/150'; // 兜底图
      }
    };

    const handleCheckout = () => {
      if (selectedItemCount === 0) {
        Alert.alert('Oops', 'Please select at least one item');
        return;
      }
      const selectedItems = cartItems.filter(item => item.selected);
      setCheckoutData(selectedItems, priceEstimate || null);
      router.push('/checkout');
    };

    const onTopUpSubmit = async () => {
      try {
        await performTopUp(redeemCode);
        setTopUpVisible(false);
        setRedeemCode('');
      } catch (e) {
        // 错误已经在 hook 里 alert 了
      }
    };

    // 全选状态判断
    const isAllSelected = cartItems.length > 0 && cartItems.every(i => i.selected);
    
    if (!isLoggedIn) {
      return (
        <SafeAreaView style={styles.container} edges={['top']}>
          <Text style={styles.pageTitle}>Shopping Cart</Text>
          <View style={styles.emptyContainer}>
            <Ionicons name="lock-closed-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>Please Log In</Text>
            <Text style={{color: '#999', marginTop: 10, marginBottom: 20}}>You need to log in to view your cart.</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/login')}>
              <Text style={styles.shopBtnText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    // === 渲染空状态 ===
    if (!loading && isEmpty) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView 
            contentContainerStyle={styles.emptyContainer}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCart} />}
          >
            <Ionicons name="cart-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/')}>
              <Text style={styles.shopBtnText}>Go Shopping</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.pageTitle}>Shopping Cart</Text>

        <ScrollView 
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCart} />}
        >
          {/* 全选栏 */}
          <View style={styles.actionHeader}>
            <TouchableOpacity 
              style={styles.selectAllRow} 
              onPress={() => toggleSelectAll(!isAllSelected)}
            >
              <Ionicons 
                name={isAllSelected ? "checkbox" : "square-outline"} 
                size={24} 
                color={isAllSelected ? "#c75d35" : "#666"} 
              />
              <Text style={styles.selectAllText}>Select All ({cartItems.length})</Text>
            </TouchableOpacity>
          </View>

          {/* 商品列表 */}
          <View style={styles.cartList}>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                {/* Checkbox */}
                <TouchableOpacity onPress={() => toggleSelection(item)} style={styles.checkboxContainer}>
                  <Ionicons 
                    name={item.selected ? "checkbox" : "square-outline"} 
                    size={24} 
                    color={item.selected ? "#c75d35" : "#ccc"} 
                  />
                </TouchableOpacity>

                {/* Image */}
                <Image 
                  source={{ uri: getImageUrl(item.product_info.pic_info) }} 
                  style={styles.productImage} 
                />

                {/* Info */}
                <View style={styles.itemInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{item.product_info.name}</Text>
                  <Text style={styles.productPrice}>${(item.product_info.price / 100).toFixed(2)}</Text>
                  
                  {/* Quantity & Delete Row */}
                  <View style={styles.qtyRow}>
                    <View style={styles.qtyControl}>
                      <TouchableOpacity 
                        onPress={() => updateQuantity(item, item.quantity - 1)}
                        style={styles.qtyBtn}
                      >
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity 
                        onPress={() => updateQuantity(item, item.quantity + 1)}
                        style={styles.qtyBtn}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => handleRemove(item.id)}>
                      <Ionicons name="trash-outline" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* 支付账户卡片 */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Payment Account</Text>
              <TouchableOpacity onPress={() => setTopUpVisible(true)}>
                <Text style={styles.topUpLink}>Top Up</Text>
              </TouchableOpacity>
            </View>
            {payAccount ? (
              <View>
                <Text style={styles.accountLabel}>Balance</Text>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceText}>
                    {isBalanceVisible ? `$${(payAccount.balance || 0).toFixed(2)}` : '****'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.eyeBtn} 
                    onPress={() => setIsBalanceVisible(!isBalanceVisible)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // 增加点击区域，手残党福音
                  >
                    <Ionicons 
                      name={isBalanceVisible ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.accountNo}>No: {payAccount.account_no}</Text>
              </View>
            ) : (
              <Text style={{color:'#999'}}>Loading account...</Text>
            )}
          </View>

          {/* 价格汇总 */}
          <View style={[styles.card, {marginBottom: 40}]}>
            <Text style={styles.cardTitle}>Order Summary</Text>
            {priceEstimate ? (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${(priceEstimate.product_price / 100).toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping</Text>
                  <Text style={styles.summaryValue}>${(priceEstimate.shipping_price / 100).toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax</Text>
                  <Text style={styles.summaryValue}>${(priceEstimate.tax / 100).toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>${(priceEstimate.total / 100).toFixed(2)}</Text>
                </View>
              </>
            ) : (
              <Text style={{color:'#999', marginVertical:10}}>Select items to see total</Text>
            )}
          </View>

        </ScrollView>

        {/* 底部结算按钮 (固定在底部) */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerTotalLabel}>Total:</Text>
            <Text style={styles.footerTotalValue}>
              ${priceEstimate ? (priceEstimate.total / 100).toFixed(2) : '0.00'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.checkoutBtn, selectedItemCount === 0 && styles.disabledBtn]} 
            onPress={handleCheckout}
            disabled={selectedItemCount === 0}
          >
            <Text style={styles.checkoutBtnText}>Checkout ({selectedItemCount})</Text>
          </TouchableOpacity>
        </View>

        {/* Top Up Modal */}
        <Modal visible={topUpVisible} transparent animationType="fade">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Top Up Balance</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter Redeem Code" 
                value={redeemCode}
                onChangeText={setRedeemCode}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setTopUpVisible(false)}>
                  <Text style={{color: '#666'}}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirm} onPress={onTopUpSubmit} disabled={topUpLoading}>
                  {topUpLoading ? <ActivityIndicator color="#fff"/> : <Text style={{color: '#fff', fontWeight:'bold'}}>Top Up</Text>}
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
    pageTitle: { fontSize: 24, fontWeight: 'bold', padding: 20, backgroundColor: '#fff' },
    scrollView: { flex: 1 },
    
    // Empty State
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
    emptyText: { fontSize: 18, color: '#666', marginTop: 20 },
    shopBtn: { marginTop: 20, backgroundColor: '#c75d35', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
    shopBtnText: { color: '#fff', fontWeight: 'bold' },

    // List
    actionHeader: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
    selectAllRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    selectAllText: { fontSize: 16, color: '#333' },

    cartList: { padding: 15 },
    cartItem: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, alignItems: 'center' },
    checkboxContainer: { marginRight: 10 },
    productImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f0f0f0' },
    itemInfo: { flex: 1, marginLeft: 15 },
    productName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5 },
    productPrice: { fontSize: 16, fontWeight: 'bold', color: '#c75d35', marginBottom: 10 },
    
    qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    qtyControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee', borderRadius: 4 },
    qtyBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9' },
    qtyBtnText: { fontSize: 18, color: '#666' },
    qtyText: { width: 30, textAlign: 'center' },

    // Cards
    card: { backgroundColor: '#fff', marginHorizontal: 15, padding: 15, borderRadius: 12, marginBottom: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    topUpLink: { color: '#c75d35', fontWeight: 'bold' },
    
    accountLabel: { fontSize: 12, color: '#999', textTransform: 'uppercase' },
    balanceRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 }, 
    balanceText: { fontSize: 24, fontWeight: 'bold', color: '#c75d35' }, 
    eyeBtn: { marginLeft: 10, padding: 4 },
    accountNo: { fontSize: 12, color: '#666' },

    // Summary
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { color: '#666' },
    summaryValue: { color: '#333' },
    totalRow: { borderTopWidth: 1, borderColor: '#eee', paddingTop: 10, marginTop: 5 },
    totalLabel: { fontSize: 16, fontWeight: 'bold' },
    totalValue: { fontSize: 16, fontWeight: 'bold', color: '#c75d35' },

    // Footer
    footer: { backgroundColor: '#fff', padding: 15, paddingBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOpacity: 0.05, elevation: 5 },
    footerTotalLabel: { fontSize: 12, color: '#999' },
    footerTotalValue: { fontSize: 20, fontWeight: 'bold', color: '#c75d35' },
    checkoutBtn: { backgroundColor: '#c75d35', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
    disabledBtn: { backgroundColor: '#ccc' },
    checkoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 20 },
    modalButtons: { flexDirection: 'row', gap: 10 },
    modalCancel: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8 },
    modalConfirm: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#c75d35', borderRadius: 8 },
  });