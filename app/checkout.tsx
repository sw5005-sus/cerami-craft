import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert, Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text, TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Hooks
import { useCheckout } from '../src/composables/useCheckout';
import { usePaymentAccount } from '../src/composables/usePaymentAccount';

// API (✅ 从正确的文件导入)
import { getUserAddresses } from '../src/api/address'; // ✅ 从 address.ts 导入
import { removeFromCart } from '../src/api/cart';
import { createOrder, CreateOrderRequest } from '../src/api/order';
import { getUserProfile } from '../src/api/user';

// Config & Types
import { S3_CONFIG } from '../src/config/api-endpoints';
import type { UserAddress } from '../src/types/api';

export default function CheckoutScreen() {
  const router = useRouter();
  
  // 购物车/结账状态
  const { 
    checkoutItems, productPrice, shippingPrice, tax, totalPrice, formatPrice, clearCheckoutData 
  } = useCheckout();
  
  // 支付账户状态
  const { payAccount, loadPayAccount, performTopUp, topUpLoading } = usePaymentAccount();

  // 表单状态
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    state: '',
    country: '',
    phone: '',
    orderNotes: ''
  });

  // UI 状态
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');

  // === 初始化逻辑 ===
  useEffect(() => {
    if (checkoutItems.length === 0) {
      Alert.alert('Cart is Empty', 'Please select items to checkout.', [
        { text: 'Back', onPress: () => router.back() }
      ]);
      return;
    }
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    loadPayAccount();
    try {
      // 1. 获取 Profile (预填姓名)
      const profile = await getUserProfile();
      if (profile) {
        const names = profile.name ? profile.name.split(' ') : [];
        setForm(prev => ({
          ...prev,
          firstName: prev.firstName || names[0] || '',
          lastName: prev.lastName || names.slice(1).join(' ') || ''
        }));
      }

      // 2. 获取地址列表 (用于弹窗选择)
      const addrList = await getUserAddresses();
      setAddresses(addrList || []);
      
      // 3. 如果有默认地址，自动填充到表单
      const defaultAddr = addrList?.find(a => a.is_default);
      if (defaultAddr) {
        fillAddress(defaultAddr);
      }
    } catch (e) {
      console.log('Load checkout info failed', e);
    }
  };

  // 选中地址后填充表单
  const fillAddress = (addr: UserAddress) => {
    setForm(prev => ({
      ...prev,
      firstName: addr.first_name || prev.firstName,
      lastName: addr.last_name || prev.lastName,
      address: addr.detail,
      city: addr.city,
      state: addr.province,
      zipCode: addr.zip_code,
      country: addr.country,
      phone: addr.contact_phone
    }));
    setShowAddressModal(false);
  };

  // 处理 S3 图片链接
  const getImageUrl = (picInfo: string) => {
    try {
      if (!picInfo) return 'https://via.placeholder.com/60';
      if (picInfo.startsWith('[')) {
        const arr = JSON.parse(picInfo);
        return arr.length > 0 ? S3_CONFIG.BASE_URL + arr[0] : 'https://via.placeholder.com/60';
      }
      return S3_CONFIG.BASE_URL + picInfo;
    } catch { return 'https://via.placeholder.com/60'; }
  };

  // === 下单逻辑 ===
  const handlePlaceOrder = async () => {
    // 1. 简单校验
    if (!form.address || !form.phone || !form.firstName) {
      Alert.alert('Missing Info', 'Please fill in required shipping info.');
      return;
    }
    // 将 totalPrice 统一转换为美元作比较 (和你的 formatPrice 逻辑保持一致)
    const totalAmountInDollars = totalPrice > 100 ? totalPrice / 100 : totalPrice;
    
    // 如果还没加载出账户信息，或者余额小于总价，直接拦截
    if (!payAccount) {
      Alert.alert('Error', 'Payment account information is loading. Please wait.');
      return;
    }
    
    if (payAccount.balance < totalAmountInDollars) {
      Alert.alert(
        'Insufficient Balance', 
        `Your balance ($${payAccount.balance.toFixed(2)}) is less than the order total ($${totalAmountInDollars.toFixed(2)}). Please top up first.`
      );
      return; // 余额不足，直接 return，不向后端发请求
    }

    setLoading(true);
    try {
      // 2. 构造请求参数
      const orderRequest: CreateOrderRequest = {
        order_item_list: checkoutItems.map(item => ({
          product_id: item.product_info.id,
          product_name: item.product_info.name,
          price: item.product_info.price,
          quantity: item.quantity
        })),
        receiver_address: form.address,
        receiver_country: form.country,
        receiver_first_name: form.firstName,
        receiver_last_name: form.lastName,
        receiver_phone: form.phone,
        receiver_zip_code: parseInt(form.zipCode) || 0,
        remark: form.orderNotes
      };

      // 3. 调用 API
      const orderNo = await createOrder(orderRequest);

      // 4. 清理购物车 (静默处理错误)
      try { 
        await Promise.all(checkoutItems.map(item => removeFromCart(item.id))); 
      } catch (e) { 
        console.log('Cart cleanup partial fail', e); 
      }
      
      // 5. 清理本地结账状态
      clearCheckoutData();
      
      // 6. 跳转成功
      Alert.alert('Success', `Order #${orderNo} placed successfully!`, [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);

    } catch (e: any) {
      Alert.alert('Order Failed', e.err_msg || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView style={styles.content}>
        
        {/* === Shipping Address === */}
        <View style={styles.section}>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:15}}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            {/* 只有当有保存的地址时才显示选择按钮 */}
            {addresses.length > 0 && (
              <TouchableOpacity onPress={() => setShowAddressModal(true)}>
                <Text style={{color:'#c75d35'}}>Select Saved</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:10}]} placeholder="First Name" value={form.firstName} onChangeText={t=>setForm({...form, firstName:t})} />
            <TextInput style={[styles.input, {flex:1}]} placeholder="Last Name" value={form.lastName} onChangeText={t=>setForm({...form, lastName:t})} />
          </View>
          <TextInput style={styles.input} placeholder="Address Detail" value={form.address} onChangeText={t=>setForm({...form, address:t})} />
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:10}]} placeholder="City" value={form.city} onChangeText={t=>setForm({...form, city:t})} />
            <TextInput style={[styles.input, {flex:1}]} placeholder="State" value={form.state} onChangeText={t=>setForm({...form, state:t})} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, {flex:1, marginRight:10}]} placeholder="Zip Code" value={form.zipCode} onChangeText={t=>setForm({...form, zipCode:t})} keyboardType="numeric" />
            <TextInput style={[styles.input, {flex:1}]} placeholder="Country" value={form.country} onChangeText={t=>setForm({...form, country:t})} />
          </View>
          <TextInput style={styles.input} placeholder="Phone" value={form.phone} onChangeText={t=>setForm({...form, phone:t})} keyboardType="phone-pad" />
          <TextInput style={[styles.input, {height:60}]} placeholder="Order Notes" value={form.orderNotes} onChangeText={t=>setForm({...form, orderNotes:t})} multiline />
        </View>

        {/* === Payment === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.paymentCard}>
            <View>
              <Text style={{color:'#666', fontSize:12}}>Balance</Text>
              <Text style={{fontSize:20, fontWeight:'bold', color:'#c75d35'}}>
                {payAccount ? `$${payAccount.balance.toFixed(2)}` : 'Loading...'}
              </Text>
            </View>
            <TouchableOpacity style={styles.topUpBtn} onPress={() => setShowTopUp(true)}>
              <Text style={{color:'#c75d35', fontWeight:'bold'}}>Top Up</Text>
            </TouchableOpacity>
          </View>
          <Text style={{fontSize:12, color:'#999', marginTop:8}}>No fees for point card payment.</Text>
        </View>

        {/* === Summary === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          {checkoutItems.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Image source={{ uri: getImageUrl(item.product_info.pic_info) }} style={styles.itemImg} />
              <View style={{flex:1, marginHorizontal:12}}>
                <Text numberOfLines={1}>{item.product_info.name}</Text>
                <Text style={{fontSize:12, color:'#666'}}>x {item.quantity}</Text>
              </View>
              <Text style={{fontWeight:'bold'}}>${(item.total_price/100).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}><Text style={{color:'#666'}}>Total</Text><Text style={{fontWeight:'bold', color:'#c75d35'}}>${formatPrice(totalPrice)}</Text></View>
        </View>
        <View style={{height:100}}/>
      </ScrollView>

      {/* === Footer Button === */}
      <View style={styles.footer}>
        <Text style={{fontSize:18, fontWeight:'bold', color:'#c75d35'}}>${formatPrice(totalPrice)}</Text>
        <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePlaceOrder} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff"/> : <Text style={{color:'#fff', fontWeight:'bold'}}>Place Order</Text>}
        </TouchableOpacity>
      </View>

      {/* === Address Select Modal === */}
      <Modal visible={showAddressModal} animationType="slide">
        <SafeAreaView style={{flex:1}}>
          <View style={styles.modalHeader}>
            <Text style={{fontSize:18, fontWeight:'bold'}}>Select Address</Text>
            <TouchableOpacity onPress={()=>setShowAddressModal(false)}><Text style={{color:'#c75d35'}}>Close</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{padding:20}}>
            {addresses.map(addr => (
              <TouchableOpacity key={addr.id} style={styles.addrCard} onPress={()=>fillAddress(addr)}>
                <Text style={{fontWeight:'bold'}}>{addr.first_name} {addr.last_name}</Text>
                <Text>{addr.detail}</Text>
                <Text style={{color:'#666', fontSize:12}}>{addr.city}, {addr.province}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
      
      {/* === Top Up Modal === */}
      <Modal visible={showTopUp} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Top Up</Text>
            <TextInput style={styles.modalInput} placeholder="Code" value={redeemCode} onChangeText={setRedeemCode}/>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={()=>setShowTopUp(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirm} 
                onPress={async()=>{
                  try { await performTopUp(redeemCode); setShowTopUp(false); setRedeemCode(''); } catch(e){}
                }} 
                disabled={topUpLoading}
              >
                {topUpLoading ? <ActivityIndicator color="#fff"/> : <Text style={{color:'#fff'}}>Confirm</Text>}
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
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, padding: 15 },
  section: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#fff' },
  row: { flexDirection: 'row' },
  paymentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff5f2', padding: 15, borderRadius: 8, borderLeftWidth: 3, borderColor: '#c75d35' },
  topUpBtn: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#c75d35', backgroundColor: '#fff' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  itemImg: { width: 50, height: 50, borderRadius: 6, backgroundColor:'#f0f0f0' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', flexDirection:'row', justifyContent:'space-between', alignItems:'center', shadowColor: '#000', shadowOpacity: 0.1, elevation: 10 },
  placeOrderBtn: { backgroundColor: '#c75d35', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 30, alignItems: 'center' },
  
  // Modal Styles
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
  addrCard: { padding: 15, backgroundColor: '#f9f9f9', marginBottom: 10, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8 },
  modalConfirm: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#c75d35', borderRadius: 8 },
});