import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getUserProfile, updateUserProfile } from '../api/user';
import { getUserAddresses } from '../api/address';
import type { UserProfile, UserProfileUpdate, UserAddress } from '../types/api';

export const useUserProfile = () => {
  const userProfile = ref<UserProfile | null>(null);
  const userAddresses = ref<UserAddress[]>([]);
  const loading = ref(false);
  const updating = ref(false);
  const addressLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 加载用户资料信息
   */
  const loadUserProfile = async () => {
    try {
      loading.value = true;
      error.value = null;
      
      console.log('Starting to load user profile...');
      const data = await getUserProfile();
      console.log('User profile loaded successfully:', data);
      userProfile.value = data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user profile';
      error.value = errorMessage;
      ElMessage.error('Failed to load user profile');
      console.error('Load user profile error:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 加载用户地址信息
   */
  const loadUserAddresses = async () => {
    try {
      addressLoading.value = true;
      error.value = null;
      
      console.log('Starting to load user addresses...');
      const addresses = await getUserAddresses();
      console.log('User addresses loaded successfully:', addresses);
      userAddresses.value = addresses;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user addresses';
      error.value = errorMessage;
      ElMessage.error('Failed to load user addresses');
      console.error('Load user addresses error:', err);
    } finally {
      addressLoading.value = false;
    }
  };

  /**
   * 更新用户资料信息
   */
  const updateProfile = async (profileData: UserProfileUpdate) => {
    if (!userProfile.value) {
      ElMessage.error('No user profile to update');
      return;
    }

    try {
      updating.value = true;
      error.value = null;
      
      // 合并当前用户信息和要更新的字段，发送完整的用户信息
      // 注意：排除default_address字段，因为地址现在通过单独的API管理
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { default_address: _userAddress, ...baseProfile } = userProfile.value;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { default_address: _profileAddress, ...cleanProfileData } = profileData;
      const fullProfileData = {
        ...baseProfile,
        ...cleanProfileData
      };
      
      console.log('Starting to update user profile...', fullProfileData);
      const data = await updateUserProfile(fullProfileData);
      console.log('User profile updated successfully:', data);
      
      userProfile.value = data;
      ElMessage.success('Profile updated successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user profile';
      error.value = errorMessage;
      ElMessage.error('Failed to update user profile');
      console.error('Update user profile error:', err);
    } finally {
      updating.value = false;
    }
  };

  /**
   * 组件挂载时自动加载用户资料和地址
   */
  onMounted(() => {
    loadUserProfile();
    loadUserAddresses();
  });

  return {
    userProfile,
    userAddresses,
    loading,
    updating,
    addressLoading,
    error,
    loadUserProfile,
    loadUserAddresses,
    updateProfile,
  };
};
