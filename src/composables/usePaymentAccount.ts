import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { getPayAccountSelf, topUpAccount, type PayAccountInfo } from '../api/payment';

export const usePaymentAccount = () => {
  const [payAccount, setPayAccount] = useState<PayAccountInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);
  // React 不需要 error state 来控制 UI 显示，通常直接 Alert，但保留也行
  const [error, setError] = useState<string | null>(null);

  const loadPayAccount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPayAccountSelf();
      setPayAccount(data);
      console.log('Payment account loaded:', data);
    } catch (err: any) {
      console.warn('error Failed to load payment account:', err);
      
      // ✅ 复刻原版的错误处理逻辑
      let errorMsg = 'Failed to load payment account';
      
      // 检查 err.response (Axios 错误结构)
      const status = err.response?.status;
      const serverCode = err.response?.data?.code; // 或者是后端返回的 code

      if (status === 500 || serverCode === 500) {
        errorMsg = 'Payment service is currently unavailable.';
      } else if (status === 401) {
        errorMsg = 'Authentication required.';
      } else if (err.message === 'Network Error') { // RN 的网络错误通常叫这个
        errorMsg = 'Network connection failed.';
      } else {
        errorMsg = err.message || errorMsg;
      }
      
      setError(errorMsg);
      // 401 通常会被全局拦截器处理，这里只弹非 401 错误
      if (status !== 401) {
        // 这里的 console.log 是为了调试，你可以决定是否 Alert
        console.log('Payment Error:', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const performTopUp = async (redeemCode: string) => {
    if (!redeemCode.trim()) {
      Alert.alert('Error', 'Redeem code is required');
      return;
    }

    try {
      setTopUpLoading(true);
      const result = await topUpAccount(redeemCode.trim());
      
      // 充值成功后，立即更新本地状态，提升体验
      if (payAccount) {
        setPayAccount({
          ...payAccount,
          balance: result.current_balance
        });
      }
      
      Alert.alert('Success', `Successfully topped up $${result.top_up_amount.toFixed(2)}!`);
      return result;
    } catch (err: any) {
      const msg = err.message || 'Failed to top up account';
      Alert.alert('Top Up Failed', msg);
      throw err;
    } finally {
      setTopUpLoading(false);
    }
  };

  // 格式化辅助函数 (如果你需要的话，也可以直接在组件里写)
  const formatBalance = (balance: number) => `$${balance.toFixed(2)}`;
  
  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    // 注意：后端如果返回秒级时间戳，需 * 1000
    // 原版 Vue 代码里乘了 1000，这里保持一致
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return {
    payAccount,
    loading,
    topUpLoading,
    error,
    loadPayAccount,
    performTopUp,
    formatBalance,
    formatDate
  };
};