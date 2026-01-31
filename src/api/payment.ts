import apiClient from './api'
import { PAYMENT_ENDPOINTS } from '../config/api-endpoints'

/**
 * 支付账户信息接口
 */
export interface PayAccountInfo {
  account_no: string
  balance: number
  created_at: number
  updated_at: number
  user_id: number
}

/**
 * 支付账户API响应
 */
export interface PayAccountResponse {
  code: number
  data: PayAccountInfo
  err_msg: string
}

/**
 * Top-up充值请求
 */
export interface TopUpRequest {
  redeem_code: string
}

/**
 * Top-up充值响应数据
 */
export interface TopUpData {
  current_balance: number
  top_up_amount: number
}

/**
 * Top-up充值API响应
 */
export interface TopUpResponse {
  code: number
  data: TopUpData
  err_msg: string
}

/**
 * 获取当前用户的支付账户信息
 * 需要带 authtoken
 */
export const getPayAccountSelf = async (): Promise<PayAccountInfo> => {
  try {
    const response = await apiClient.get<PayAccountResponse>(PAYMENT_ENDPOINTS.PAY_ACCOUNT_SELF)
    
    if (response.data.code === 0) {
      // 处理balance字段，将最后两位作为小数点后的数字
      const accountInfo = response.data.data
      accountInfo.balance = accountInfo.balance / 100
      
      return accountInfo
    } else {
      throw new Error(response.data.err_msg || 'Failed to get payment account info')
    }
  } catch (error) {
    console.error('Get payment account failed:', error)
    throw error
  }
}

/**
 * 充值账户余额
 * 需要带 authtoken
 */
export const topUpAccount = async (redeemCode: string): Promise<TopUpData> => {
  try {
    const requestData: TopUpRequest = {
      redeem_code: redeemCode
    }
    
    console.log('Top-up request:', requestData)
    
    const response = await apiClient.post<TopUpResponse>(PAYMENT_ENDPOINTS.TOP_UP, requestData)
    
    console.log('Top-up response:', response.data)
    
    if (response.data.code === 0) {
      // 处理balance字段，将最后两位作为小数点后的数字
      const topUpData = response.data.data
      topUpData.current_balance = topUpData.current_balance / 100
      
      return topUpData
    } else {
      throw new Error(response.data.err_msg || 'Failed to top up account')
    }
  } catch (error) {
    console.error('Top-up failed:', error)
    throw error
  }
}
