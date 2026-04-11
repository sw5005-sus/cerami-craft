import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import {
    addToCart,
    clearCart,
    getCart,
    getCartPriceEstimate,
    removeFromCart,
    updateCartItem
} from '../api/cart';
import type { CartData, CartItem, CartPriceEstimate, UpdateCartItemRequest } from '../types/api';

export const useCart = () => {
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [priceEstimate, setPriceEstimate] = useState<CartPriceEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 计算属性
  const cartItems = cartData?.cart_items || [];
  const selectedItemCount = cartData?.selected_item_count || 0;
  const isEmpty = cartItems.length === 0;

  // 加载购物车
  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCart();
      setCartData(data);
      
      // 只有当购物车有东西时，才去拉取价格估算，避免空购物车报错
      if (data.cart_items && data.cart_items.length > 0) {
        try {
          const estimate = await getCartPriceEstimate();
          setPriceEstimate(estimate);
        } catch {
          console.log('Price estimate failed (non-critical)');
          setPriceEstimate(null);
        }
      } else {
        setPriceEstimate(null);
      }
    } catch (error: any) {
      console.warn(' Load cart failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 添加商品到购物车 (包装一层，方便 UI 调用)
  const addItem = async (productId: number, quantity: number = 1) => {
    try {
      await addToCart(productId, quantity);
      Alert.alert('Success', 'Added to cart');
      // 添加成功后刷新购物车
      loadCart();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add to cart');
    }
  };

  // 更新数量
  const updateQuantity = async (item: CartItem, newQty: number) => {
    if (newQty <= 0) {
      Alert.alert('Remove Item', 'Remove this item from cart?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => handleRemove(item.id) }
      ]);
      return;
    }
    
    try {
      // ✅ 严格构造 UpdateCartItemRequest
      const requestData: UpdateCartItemRequest = {
        id: item.id,
        product_id: item.product_info.id,
        quantity: newQty,
        selected: item.selected,
        user_id: 0 // 占位符
      };

      await updateCartItem(item.id, requestData);
      loadCart(); 
    } catch (error) {
      //Alert.alert('Error', 'Failed to update quantity');
      console.warn('error Failed to update quantity, ', error)
    }
  };

  // 切换选中状态
  const toggleSelection = async (item: CartItem) => {
    try {
      // ✅ 严格构造 UpdateCartItemRequest
      const requestData: UpdateCartItemRequest = {
        id: item.id,
        product_id: item.product_info.id,
        quantity: item.quantity,
        selected: !item.selected,
        user_id: 0
      };

      await updateCartItem(item.id, requestData);
      loadCart();
    } catch {
      Alert.alert('Error', 'Failed to toggle selection');
    }
  };

  // 全选/反选
  const toggleSelectAll = async (selectAll: boolean) => {
    try {
      // 并发请求所有更新 (如果购物车很大，后端可能会压力大，但 Demo 没问题)
      const promises = cartItems.map(item => {
        const requestData: UpdateCartItemRequest = {
          id: item.id,
          product_id: item.product_info.id,
          quantity: item.quantity,
          selected: selectAll,
          user_id: 0
        };
        return updateCartItem(item.id, requestData);
      });

      await Promise.all(promises);
      loadCart();
    } catch {
      Alert.alert('Error', 'Failed to update selection');
    }
  };

  // 删除
  const handleRemove = async (itemId: number) => {
    try {
      await removeFromCart(itemId);
      loadCart();
    } catch {
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  return {
    cartData,
    cartItems,
    priceEstimate,
    loading,
    isEmpty,
    selectedItemCount,
    loadCart,
    addItem,        // 导出这个给商品详情页用
    updateQuantity,
    toggleSelection,
    toggleSelectAll,
    handleRemove,
    clearCart
  };
};