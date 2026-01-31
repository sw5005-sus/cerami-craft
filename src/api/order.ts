/**
 * 订单相关 API 函数
 */
import { request } from './api'

// 订单项接口
export interface OrderItem {
  price: number
  product_id: number
  product_name: string
  quantity: number
}

// 创建订单请求接口
export interface CreateOrderRequest {
  order_item_list: OrderItem[]
  receiver_address: string
  receiver_country: string
  receiver_first_name: string
  receiver_last_name: string
  receiver_phone: string
  receiver_zip_code: number
  remark?: string
}

// 创建订单响应接口
export interface CreateOrderResponse {
  status: number
  data: string // 订单号
  msg: string
  error: string
}

// 订单列表请求接口
export interface OrderListRequest {
  end_time?: string
  limit: number
  offset: number
  start_time?: string
}

// 订单列表项接口
export interface Order {
  create_time: string
  order_no: string
  receiver_first_name: string
  receiver_last_name: string
  receiver_phone: string
  status: string
  total_amount: number
}

// 订单列表响应接口
export interface OrderListResponse {
  status: number
  data: {
    orders: Order[]
    total: number
  }
  msg: string
  error: string
}

// 订单详情商品项接口
export interface OrderDetailItem {
  create_time: string
  id: number
  pic_info?: string // 商品图片信息
  price: number
  product_id: number
  product_name: string
  quantity: number
  total_price: number
  update_time: string
}

// 订单状态日志接口
export interface OrderStatusLog {
  create_time: string
  current_status: number
  id: number
  remark: string
  status_name: string
}

// 订单详情接口
export interface OrderDetail {
  confirm_time: string
  create_time: string
  delivery_time: string
  logistics_no: string
  order_items: OrderDetailItem[]
  order_no: string
  pay_amount: number
  pay_time: string
  receiver_address: string
  receiver_country: string
  receiver_first_name: string
  receiver_last_name: string
  receiver_phone: string
  receiver_zip_code: number
  remark: string
  shipping_fee: number
  status: number
  status_logs: OrderStatusLog[]
  status_name: string
  tax: number
  total_amount: number
  update_time: string
  user_id: number
}

// 订单详情响应接口
export interface OrderDetailResponse {
  status: number
  data: OrderDetail
  msg: string
  error: string
}

// 确认收货请求接口
export interface ConfirmDeliveryRequest {
  order_no: string
}

// 确认收货响应接口
export interface ConfirmDeliveryResponse {
  status: number
  msg: string
  error: string
  data: {}
}

/**
 * 创建订单
 */
export const createOrder = async (orderData: CreateOrderRequest): Promise<string> => {
  try {
    console.log('Creating order with data:', orderData)
    
    const response = await request.post<CreateOrderResponse>('/order-ms/v1/customer/orders', orderData)
    
    console.log('Order created successfully:', response)
    
    if (response.status === 0) {
      return response.data // 返回订单号
    } else {
      throw new Error(response.msg || response.error || 'Failed to create order')
    }
  } catch (error) {
    console.error('Create order API error:', error)
    throw error
  }
}

/**
 * 获取订单列表
 */
export const getOrderList = async (params: OrderListRequest): Promise<{ orders: Order[], total: number }> => {
  try {
    console.log('Getting order list with params:', params)
    
    const response = await request.post<OrderListResponse>('/order-ms/v1/customer/orders/list', params)
    
    console.log('Order list fetched successfully:', response)
    
    if (response.status === 0) {
      return response.data
    } else {
      throw new Error(response.msg || response.error || 'Failed to get order list')
    }
  } catch (error) {
    console.error('Get order list API error:', error)
    throw error
  }
}

/**
 * 获取订单详情
 */
export const getOrderDetail = async (orderNo: string): Promise<OrderDetail> => {
  try {
    console.log('Getting order detail for order:', orderNo)
    
    const response = await request.get<OrderDetailResponse>(`/order-ms/v1/customer/orders/${orderNo}`)
    
    console.log('Order detail fetched successfully:', response)
    
    if (response.status === 0) {
      return response.data
    } else {
      throw new Error(response.msg || response.error || 'Failed to get order detail')
    }
  } catch (error) {
    console.error('Get order detail API error:', error)
    throw error
  }
}

/**
 * 确认收货
 */
export const confirmDelivery = async (orderNo: string): Promise<void> => {
  try {
    console.log('Confirming delivery for order:', orderNo)
    
    const response = await request.patch<ConfirmDeliveryResponse>(`/order-ms/v1/customer/orders/${orderNo}/confirm`)
    
    console.log('Delivery confirmed successfully:', response)
    
    if (response.status !== 0) {
      throw new Error(response.msg || response.error || 'Failed to confirm delivery')
    }
  } catch (error) {
    console.error('Confirm delivery API error:', error)
    throw error
  }
}
