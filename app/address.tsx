import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Switch,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 导入你之前提供的 address.ts 里的接口
import {
    createUserAddress,
    deleteUserAddress,
    getUserAddresses,
    updateUserAddress
} from '../src/api/address';

import type { UserAddress } from '../src/types/api';

export default function AddressesScreen() {
  const router = useRouter();
  
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 弹窗表单状态
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    contact_phone: '',
    country: 'Singapore', // 默认填个国家
    province: '',
    city: '',
    detail: '',
    zip_code: '',
    is_default: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  // 获取地址列表
  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await getUserAddresses();
      setAddresses(data || []);
    } catch (error: any) {
      Alert.alert('Error', error.err_msg || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingId(null);
    setForm({
      first_name: '', last_name: '', contact_phone: '', 
      country: 'Singapore', province: '', city: '', detail: '', 
      zip_code: '', is_default: false
    });
    setModalVisible(true);
  };

  // 打开编辑弹窗
  const handleEdit = (addr: UserAddress) => {
    setEditingId(addr.id);
    setForm({
      first_name: addr.first_name || '',
      last_name: addr.last_name || '',
      contact_phone: addr.contact_phone || '',
      country: addr.country || '',
      province: addr.province || '',
      city: addr.city || '',
      detail: addr.detail || '',
      zip_code: addr.zip_code || '',
      is_default: addr.is_default || false
    });
    setModalVisible(true);
  };

  // 删除地址
  const handleDelete = (id: number) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUserAddress(id);
            fetchAddresses(); // 刷新列表
          } catch (error: any) {
            Alert.alert('Error', error.err_msg || 'Failed to delete address');
          }
        }
      }
    ]);
  };

  // 提交表单 (新增或修改)
  const handleSubmit = async () => {
    if (!form.first_name || !form.contact_phone || !form.detail || !form.city || !form.zip_code) {
      Alert.alert('Missing Info', 'Please fill in all required fields, including Zip Code.');
      return;
    }

    if (!form.contact_phone.startsWith('+')) {
      // 提醒用户加上国家区号
      Alert.alert('Invalid Phone Format', 'Phone number must start with a "+" and country code (e.g., +6581234567 or +8613800000000).');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // 修改
        await updateUserAddress(editingId, {
          ...form,
          id: editingId,
          user_id: 0
        });
      } else {
        // 新增
        await createUserAddress(form);
      }
      setModalVisible(false);
      fetchAddresses(); // 刷新列表
    } catch (error: any) {
      Alert.alert('Error', error.err_msg || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染单个地址卡片
  const renderItem = ({ item }: { item: UserAddress }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.nameText}>{item.first_name} {item.last_name}</Text>
        {item.is_default && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>}
      </View>
      <Text style={styles.phoneText}>{item.contact_phone}</Text>
      <Text style={styles.addressText}>{item.detail}</Text>
      <Text style={styles.addressText}>{item.city}, {item.province} {item.zip_code}</Text>
      <Text style={styles.addressText}>{item.country}</Text>
      
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}>
          <Ionicons name="create-outline" size={18} color="#666" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={18} color="#ff4d4f" />
          <Text style={[styles.actionText, {color: '#ff4d4f'}]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <View style={{width: 24}} /> 
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#c75d35" style={{flex: 1}} />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No addresses found.</Text>
            </View>
          }
        />
      )}

      {/* 底部新增按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add New Address</Text>
        </TouchableOpacity>
      </View>

      {/* 新增/编辑地址的弹窗 */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
          <View style={styles.modalHeader}>
            <Text style={styles.headerTitle}>{editingId ? 'Edit Address' : 'New Address'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{flex: 1}}
          >
            <FlatList
              data={[]} // 这里用 FlatList 包裹是为了自带滚动和避免键盘遮挡
              renderItem={() => null}
              ListHeaderComponent={
                <View style={styles.formContainer}>
                  <View style={styles.row}>
                    <TextInput style={[styles.input, {flex: 1, marginRight: 10}]} placeholder="First Name *" value={form.first_name} onChangeText={t => setForm({...form, first_name: t})} />
                    <TextInput style={[styles.input, {flex: 1}]} placeholder="Last Name" value={form.last_name} onChangeText={t => setForm({...form, last_name: t})} />
                  </View>
                  <TextInput style={styles.input} placeholder="Phone Number *" value={form.contact_phone} onChangeText={t => setForm({...form, contact_phone: t})} keyboardType="phone-pad" />
                  <TextInput style={styles.input} placeholder="Street Address *" value={form.detail} onChangeText={t => setForm({...form, detail: t})} />
                  <View style={styles.row}>
                    <TextInput style={[styles.input, {flex: 1, marginRight: 10}]} placeholder="City *" value={form.city} onChangeText={t => setForm({...form, city: t})} />
                    <TextInput style={[styles.input, {flex: 1}]} placeholder="Province/State" value={form.province} onChangeText={t => setForm({...form, province: t})} />
                  </View>
                  <View style={styles.row}>
                    <TextInput style={[styles.input, {flex: 1, marginRight: 10}]} placeholder="Zip Code*" value={form.zip_code} onChangeText={t => setForm({...form, zip_code: t})} />
                    <TextInput style={[styles.input, {flex: 1}]} placeholder="Country" value={form.country} onChangeText={t => setForm({...form, country: t})} />
                  </View>
                  
                  <View style={styles.switchRow}>
                    <Text style={{fontSize: 16}}>Set as Default Address</Text>
                    <Switch 
                      value={form.is_default} 
                      onValueChange={v => setForm({...form, is_default: v})}
                      trackColor={{ false: "#767577", true: "#c75d35" }}
                    />
                  </View>
                </View>
              }
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Address</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  listContent: { padding: 15, paddingBottom: 100 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  nameText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  defaultBadge: { backgroundColor: '#e6f4ea', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  defaultText: { color: '#34a853', fontSize: 12, fontWeight: 'bold' },
  phoneText: { fontSize: 14, color: '#666', marginBottom: 4 },
  addressText: { fontSize: 14, color: '#666', lineHeight: 20 },
  
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderColor: '#eee', marginTop: 12, paddingTop: 12, gap: 15 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { color: '#666', fontSize: 14 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyText: { color: '#999', fontSize: 16, marginTop: 10 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  addBtn: { backgroundColor: '#c75d35', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 30, gap: 8 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Modal Styles
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  formContainer: { padding: 20 },
  row: { flexDirection: 'row', marginBottom: 15 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 15 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderColor: '#eee', marginTop: 5 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  saveBtn: { backgroundColor: '#c75d35', padding: 15, borderRadius: 30, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});