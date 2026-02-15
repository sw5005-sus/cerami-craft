import { useEffect, useMemo, useState } from 'react';

// === 类型定义 (复刻 Vue 里的接口) ===
export interface CheckoutItem {
  id: number;
  quantity: number;
  product_info: {
    id: number;
    name: string;
    pic_info: string;
    price: number;
  };
  total_price: number;
  selected: boolean;
}

export interface PriceEstimate {
  product_price: number;
  shipping_price: number;
  tax: number;
  total: number;
}

// === 🌍 全局状态 (模拟 Vue 的 Global State) ===
// 必须定义在 Hook 外面，这样购物车页和结账页才能共享同一份数据
let globalCheckoutItems: CheckoutItem[] = [];
let globalPriceEstimate: PriceEstimate | null = null;

// 订阅者列表 (用于当数据变动时通知所有组件更新)
const listeners = new Set<() => void>();

// 通知所有组件更新
const notify = () => {
  listeners.forEach(listener => listener());
};

export const useCheckout = () => {
  // 本地状态 (用于触发 React 重渲染)
  const [checkoutItems, setItems] = useState<CheckoutItem[]>(globalCheckoutItems);
  const [checkoutPriceEstimate, setEstimate] = useState<PriceEstimate | null>(globalPriceEstimate);

  // 监听全局状态变化
  useEffect(() => {
    const listener = () => {
      setItems([...globalCheckoutItems]); // 浅拷贝触发更新
      setEstimate(globalPriceEstimate ? { ...globalPriceEstimate } : null);
    };
    
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  /**
   * 设置结账数据 (Cart 页面调用)
   */
  const setCheckoutData = (selectedItems: CheckoutItem[], priceEstimate: PriceEstimate | null) => {
    globalCheckoutItems = [...selectedItems];
    globalPriceEstimate = priceEstimate ? { ...priceEstimate } : null;
    notify(); // 广播更新
  };

  /**
   * 清空结账数据 (下单成功后调用)
   */
  const clearCheckoutData = () => {
    globalCheckoutItems = [];
    globalPriceEstimate = null;
    notify();
  };

  // === 计算属性 (对应 Vue 的 computed) ===
  
  const selectedItemsTotal = useMemo(() => {
    return checkoutItems.reduce((total, item) => total + item.total_price, 0);
  }, [checkoutItems]);

  const productPrice = useMemo(() => {
    return checkoutPriceEstimate?.product_price || selectedItemsTotal;
  }, [checkoutPriceEstimate, selectedItemsTotal]);

  const shippingPrice = useMemo(() => {
    return checkoutPriceEstimate?.shipping_price || 0;
  }, [checkoutPriceEstimate]);

  const tax = useMemo(() => {
    return checkoutPriceEstimate?.tax || 0;
  }, [checkoutPriceEstimate]);

  const totalPrice = useMemo(() => {
    return checkoutPriceEstimate?.total || selectedItemsTotal;
  }, [checkoutPriceEstimate, selectedItemsTotal]);

  /**
   * 格式化价格
   */
  const formatPrice = (price: number) => {
    // 后端如果返回的是分，这里除以 100
    // 如果已经是元，则直接显示
    // 根据你的 Vue 代码逻辑：displayPrice = price > 100 ? price / 100 : price
    const displayPrice = price > 100 ? price / 100 : price;
    return displayPrice.toFixed(2);
  };

  return {
    checkoutItems,
    checkoutPriceEstimate,
    setCheckoutData,
    clearCheckoutData,
    
    // Computed values
    productPrice,
    shippingPrice,
    tax,
    totalPrice,
    
    // Helper
    formatPrice
  };
};