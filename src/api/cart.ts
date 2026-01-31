import apiClient from './api'
import { PRODUCT_ENDPOINTS } from '../config/api-endpoints'
import type { CartResponse, CartData, AddToCartRequest, AddToCartResponse, UpdateCartItemRequest, UpdateCartItemResponse, RemoveCartItemResponse, CartPriceEstimate, CartPriceEstimateResponse } from '../types/api'

/**
 * 获取购物车内容
 */
export const getCart = async (): Promise<CartData> => {
  try {
    const response = await apiClient.get<CartResponse>(PRODUCT_ENDPOINTS.CART)
    
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.err_msg || 'Failed to get cart data')
    }
  } catch (error) {
    console.error('Get cart failed:', error)
    throw error
  }
}

/**
 * 添加商品到购物车
 */
export const addToCart = async (productId: number, quantity: number = 1): Promise<void> => {
  try {
    const requestData: AddToCartRequest = {
      id: 0,
      product_id: productId,
      quantity,
      selected: true,
      user_id: 0
    }
    
    console.log('Adding to cart with data:', requestData)
    
    const response = await apiClient.post<AddToCartResponse>(PRODUCT_ENDPOINTS.CART_ITEMS, requestData)
    
    console.log('Add to cart response:', response.data)
    
    // 检查响应码，添加购物车API返回200表示成功
    if (response.data.code === 200) {
      // 成功添加到购物车，不需要返回数据
      return
    } else {
      throw new Error(response.data.err_msg || 'Failed to add item to cart')
    }
  } catch (error) {
    console.error('Add to cart failed:', error)
    throw error
  }
}

/**
 * 更新购物车商品信息
 */
export const updateCartItem = async (itemId: number, updateData: UpdateCartItemRequest): Promise<void> => {
  try {
    const response = await apiClient.put<UpdateCartItemResponse>(`${PRODUCT_ENDPOINTS.CART}/items/${itemId}`, updateData)
    
    if (response.data.code !== 200) {
      throw new Error(response.data.err_msg || 'Failed to update cart item')
    }
  } catch (error) {
    console.error('Update cart item failed:', error)
    throw error
  }
}

/**
 * 从购物车删除商品
 */
export const removeFromCart = async (itemId: number): Promise<void> => {
  try {
    const response = await apiClient.delete<RemoveCartItemResponse>(`${PRODUCT_ENDPOINTS.CART}/items/${itemId}`)
    
    if (response.data.code !== 200) {
      throw new Error(response.data.err_msg || 'Failed to remove item from cart')
    }
  } catch (error) {
    console.error('Remove from cart failed:', error)
    throw error
  }
}

/**
 * 选择/取消选择购物车商品
 */
export const toggleCartItemSelection = async (itemId: number, updateData: UpdateCartItemRequest): Promise<void> => {
  try {
    const response = await apiClient.put<UpdateCartItemResponse>(`${PRODUCT_ENDPOINTS.CART}/items/${itemId}`, updateData)
    
    if (response.data.code !== 200) {
      throw new Error(response.data.err_msg || 'Failed to toggle item selection')
    }
  } catch (error) {
    console.error('Toggle cart item selection failed:', error)
    throw error
  }
}

/**
 * 清空购物车
 */
export const clearCart = async (): Promise<void> => {
  try {
    const response = await apiClient.delete(PRODUCT_ENDPOINTS.CART)
    
    if (response.data.code !== 200) {
      throw new Error(response.data.err_msg || 'Failed to clear cart')
    }
  } catch (error) {
    console.error('Clear cart failed:', error)
    throw error
  }
}

/**
 * 获取购物车价格估算
 */
export const getCartPriceEstimate = async (): Promise<CartPriceEstimate> => {
  try {
    const response = await apiClient.get<CartPriceEstimateResponse>(PRODUCT_ENDPOINTS.CART_PRICE_ESTIMATE)
    
    if (response.data.code === 200) {
      return response.data.data
    } else {
      throw new Error(response.data.err_msg || 'Failed to get cart price estimate')
    }
  } catch (error) {
    console.error('Get cart price estimate failed:', error)
    throw error
  }
}
