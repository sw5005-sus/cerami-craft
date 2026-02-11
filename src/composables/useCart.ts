import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  toggleCartItemSelection,
  clearCart,
  getCartPriceEstimate
} from '../api/cart'
import type { CartData, CartPriceEstimate } from '../types/api'

/**
 * 购物车管理 Composable
 */
export const useCart = () => {
  // 状态管理
  const cartData = ref<CartData | null>(null)
  const priceEstimate = ref<CartPriceEstimate | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const cartItems = computed(() => cartData.value?.cart_items || [])
  const selectedItemCount = computed(() => cartData.value?.selected_item_count || 0)
  const selectedPrice = computed(() => cartData.value?.selected_price || 0)
  const totalItems = computed(() => cartItems.value.length)
  const isEmpty = computed(() => totalItems.value === 0)

  /**
   * 加载购物车数据
   */
  const loadCart = async () => {
    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const data = await getCart()
      cartData.value = data
      console.log('Cart loaded:', data)
      
      // 同时加载价格估算
      await loadPriceEstimate()
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Failed to load cart'
      error.value = errorMessage
      console.error('Failed to load cart:', err)
      
      // 只在非认证错误时显示错误消息
      if (!errorMessage.includes('401') && !errorMessage.includes('unauthorized')) {
        ElMessage.error(errorMessage)
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载价格估算
   */
  const loadPriceEstimate = async () => {
    try {
      console.log('Loading price estimate...')
      const estimate = await getCartPriceEstimate()
      priceEstimate.value = estimate
      console.log('Price estimate loaded successfully:', estimate)
      console.log('Formatted prices:', {
        product_price: formatPrice(estimate.product_price),
        shipping_price: formatPrice(estimate.shipping_price),
        tax: formatPrice(estimate.tax),
        total: formatPrice(estimate.total)
      })
    } catch (err: unknown) {
      console.error('Failed to load price estimate:', err)
      // 价格估算失败不显示错误消息，因为这不是关键功能
      priceEstimate.value = null
    }
  }

  /**
   * 添加商品到购物车
   */
  const addItemToCart = async (productId: number, quantity: number = 1) => {
    try {
      await addToCart(productId, quantity)
      ElMessage.success('Item added to cart')
      await loadCart() // 重新加载购物车
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Failed to add item to cart'
      console.error('Failed to add item to cart:', err)
      ElMessage.error(errorMessage)
      throw err
    }
  }

  /**
   * 更新购物车商品数量
   */
  const updateItemQuantity = async (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeItemFromCart(itemId)
      return
    }

    try {
      // 找到对应的购物车项目
      const item = cartItems.value.find(item => item.id === itemId)
      if (!item) {
        throw new Error('Cart item not found')
      }

      const updateData = {
        id: item.id,
        product_id: item.product_info.id,
        quantity,
        selected: item.selected,
        user_id: 0 // 将由后端从token中获取
      }

      await updateCartItem(itemId, updateData)
      await loadCart() // 重新加载购物车和价格估算
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Failed to update item quantity'
      console.error('Failed to update item quantity:', err)
      ElMessage.error(errorMessage)
      throw err
    }
  }

  /**
   * 从购物车删除商品
   */
  const removeItemFromCart = async (itemId: number) => {
    try {
      await removeFromCart(itemId)
      ElMessage.success('Item removed from cart')
      await loadCart() // 重新加载购物车
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Failed to remove item from cart'
      console.error('Failed to remove item from cart:', err)
      ElMessage.error(errorMessage)
      throw err
    }
  }

  /**
   * 切换商品选择状态
   */
  const toggleItemSelection = async (itemId: number, selected: boolean) => {
    // 找到当前的购物车项目
    const currentItem = cartItems.value.find(item => item.id === itemId)
    if (!currentItem) {
      ElMessage.error('Cart item not found')
      return
    }

    try {
      await toggleCartItemSelection(itemId, {
        id: currentItem.id,
        product_id: currentItem.product_info.id,
        quantity: currentItem.quantity,
        selected: selected,
        user_id: 0 // 这里可能需要从用户状态中获取
      })
      await loadCart() // 重新加载购物车
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Failed to toggle item selection'
      console.error('Failed to toggle item selection:', err)
      ElMessage.error(errorMessage)
      throw err
    }
  }

  /**
   * 选择所有商品
   */
  const selectAllItems = async () => {
    try {
      const promises = cartItems.value.map(item => 
        toggleCartItemSelection(item.id, {
          id: item.id,
          product_id: item.product_info.id,
          quantity: item.quantity,
          selected: true,
          user_id: 0
        })
      )
      await Promise.all(promises)
      await loadCart() // 重新加载购物车
    } catch (err: unknown) {
      console.error('Failed to select all items:', err)
      ElMessage.error('Failed to select all items')
    }
  }

  /**
   * 取消选择所有商品
   */
  const unselectAllItems = async () => {
    try {
      const promises = cartItems.value.map(item => 
        toggleCartItemSelection(item.id, {
          id: item.id,
          product_id: item.product_info.id,
          quantity: item.quantity,
          selected: false,
          user_id: 0
        })
      )
      await Promise.all(promises)
      await loadCart() // 重新加载购物车
    } catch (err: unknown) {
      console.error('Failed to unselect all items:', err)
      ElMessage.error('Failed to unselect all items')
    }
  }

  /**
   * 清空购物车
   */
  const clearCartItems = async () => {
    try {
      await clearCart()
      ElMessage.success('Cart cleared')
      await loadCart() // 重新加载购物车
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Failed to clear cart'
      console.error('Failed to clear cart:', err)
      ElMessage.error(errorMessage)
      throw err
    }
  }

  /**
   * 格式化价格显示
   */
  const formatPrice = (price: number): string => {
    return `$${(price / 100).toFixed(2)}`
  }

  // 组件挂载时自动加载
  onMounted(() => {
    loadCart()
  })

  return {
    // 状态
    cartData,
    cartItems,
    priceEstimate,
    loading,
    error,
    
    // 计算属性
    selectedItemCount,
    selectedPrice,
    totalItems,
    isEmpty,
    
    // 方法
    loadCart,
    loadPriceEstimate,
    addItemToCart,
    updateItemQuantity,
    removeItemFromCart,
    toggleItemSelection,
    selectAllItems,
    unselectAllItems,
    clearCartItems,
    formatPrice
  }
}
