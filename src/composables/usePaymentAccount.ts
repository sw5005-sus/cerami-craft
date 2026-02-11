import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPayAccountSelf, topUpAccount, type PayAccountInfo, type TopUpData } from '../api/payment'

// 错误对象类型定义
interface ApiError {
  code?: number
  message?: string
  err_msg?: string
}

/**
 * 支付账户管理 Composable
 */
export const usePaymentAccount = () => {
  // 状态管理
  const payAccount = ref<PayAccountInfo | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const topUpLoading = ref(false)

  /**
   * 加载支付账户信息
   */
  const loadPayAccount = async () => {
    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const accountData = await getPayAccountSelf()
      payAccount.value = accountData
      console.log('Payment account loaded:', accountData)
    } catch (err: unknown) {
      console.error('Failed to load payment account:', err)
      
      // 根据错误类型设置不同的错误消息
      const errorObj = err as ApiError
      if (errorObj?.code === 500) {
        error.value = 'Payment service is currently unavailable. Please try again later.'
      } else if (errorObj?.code === 401) {
        error.value = 'Authentication required. Please login again.'
      } else if (errorObj?.code === -1) {
        error.value = 'Network connection failed. Please check your internet connection.'
      } else {
        error.value = errorObj?.err_msg || errorObj?.message || 'Failed to load payment account'
      }
      
      // 只在非认证错误时显示错误消息
      if (errorObj?.code !== 401 && error.value) {
        ElMessage.error(error.value)
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 格式化余额显示
   */
  const formatBalance = (balance: number): string => {
    return `$${balance.toFixed(2)}`
  }

  /**
   * 格式化日期显示
   */
  const formatDate = (timestamp: number): string => {
    if (!timestamp) return 'N/A'
    const date = new Date(timestamp * 1000)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  }

  /**
   * 充值账户余额
   */
  const performTopUp = async (redeemCode: string): Promise<TopUpData> => {
    if (!redeemCode || !redeemCode.trim()) {
      throw new Error('Redeem code is required')
    }

    topUpLoading.value = true
    
    try {
      const result = await topUpAccount(redeemCode.trim())
      
      // 充值成功后更新账户信息
      if (payAccount.value) {
        payAccount.value.balance = result.current_balance
      }
      
      ElMessage.success(`Successfully topped up $${result.top_up_amount.toFixed(2)}!`)
      console.log('Top-up successful:', result)
      
      return result
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || 'Failed to top up account'
      console.error('Top-up failed:', err)
      ElMessage.error(errorMessage)
      throw err
    } finally {
      topUpLoading.value = false
    }
  }

  // 组件挂载时自动加载
  onMounted(() => {
    loadPayAccount()
  })

  return {
    payAccount,
    loading,
    error,
    topUpLoading,
    loadPayAccount,
    formatBalance,
    formatDate,
    performTopUp
  }
}
