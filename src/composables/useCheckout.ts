/**
 * 结账相关的状态管理
 */
import { ref, computed } from 'vue'

interface CheckoutItem {
  id: number
  quantity: number
  product_info: {
    id: number
    name: string
    pic_info: string
    price: number
  }
  total_price: number
  selected: boolean
}

interface PriceEstimate {
  product_price: number
  shipping_price: number
  tax: number
  total: number
}

// 全局状态
const checkoutItems = ref<CheckoutItem[]>([])
const checkoutPriceEstimate = ref<PriceEstimate | null>(null)

export const useCheckout = () => {
  
  /**
   * 设置结账商品数据
   */
  const setCheckoutData = (selectedItems: CheckoutItem[], priceEstimate: PriceEstimate | null) => {
    checkoutItems.value = [...selectedItems]
    checkoutPriceEstimate.value = priceEstimate ? { ...priceEstimate } : null
  }

  /**
   * 计算选中商品的总价
   */
  const selectedItemsTotal = computed(() => {
    return checkoutItems.value.reduce((total, item) => total + item.total_price, 0)
  })

  /**
   * 获取商品价格（来自价格估算或回退计算）
   */
  const productPrice = computed(() => {
    return checkoutPriceEstimate.value?.product_price || selectedItemsTotal.value
  })

  /**
   * 获取运费
   */
  const shippingPrice = computed(() => {
    return checkoutPriceEstimate.value?.shipping_price || 0
  })

  /**
   * 获取税费
   */
  const tax = computed(() => {
    return checkoutPriceEstimate.value?.tax || 0
  })

  /**
   * 获取总价
   */
  const totalPrice = computed(() => {
    return checkoutPriceEstimate.value?.total || selectedItemsTotal.value
  })

  /**
   * 格式化价格
   */
  const formatPrice = (price: number) => {
    // 如果价格是以分为单位（大于100），则转换为元
    const displayPrice = price > 100 ? price / 100 : price
    return displayPrice.toFixed(2)
  }

  /**
   * 清空结账数据
   */
  const clearCheckoutData = () => {
    checkoutItems.value = []
    checkoutPriceEstimate.value = null
  }

  return {
    checkoutItems,
    checkoutPriceEstimate,
    setCheckoutData,
    clearCheckoutData,
    productPrice,
    shippingPrice,
    tax,
    totalPrice,
    formatPrice
  }
}
