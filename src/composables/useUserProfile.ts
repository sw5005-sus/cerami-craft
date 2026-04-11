import { useCallback, useEffect, useState } from 'react';
import { getUserAddresses } from '../api/address';
import { getUserProfile, updateUserProfile } from '../api/user';
import type { UserAddress, UserProfile, UserProfileUpdate } from '../types/api';

export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载用户资料信息
   */
  const loadUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting to load user profile...');
      const data = await getUserProfile();
      console.log('User profile loaded successfully:', data);
      setUserProfile(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user profile';
      setError(errorMessage);
      console.error('Load user profile error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 加载用户地址信息
   */
  const loadUserAddresses = useCallback(async () => {
    try {
      setAddressLoading(true);
      setError(null);
      
      console.log('Starting to load user addresses...');
      const addresses = await getUserAddresses();
      console.log('User addresses loaded successfully:', addresses);
      setUserAddresses(addresses);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user addresses';
      setError(errorMessage);
      console.error('Load user addresses error:', err);
    } finally {
      setAddressLoading(false);
    }
  }, []);

  /**
   * 更新用户资料信息
   */
  const updateProfile = useCallback(async (profileData: UserProfileUpdate) => {
    if (!userProfile) {
      console.error('No user profile to update');
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      
      // 合并当前用户信息和要更新的字段，发送完整的用户信息
      // 注意：排除default_address字段，因为地址现在通过单独的API管理
      const { default_address: _userAddress, ...baseProfile } = userProfile;
      const { default_address: _profileAddress, ...cleanProfileData } = profileData;
      const fullProfileData = {
        ...baseProfile,
        ...cleanProfileData
      };
      
      console.log('Starting to update user profile...', fullProfileData);
      const data = await updateUserProfile(fullProfileData);
      console.log('User profile updated successfully:', data);
      
      setUserProfile(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user profile';
      setError(errorMessage);
      console.error('Update user profile error:', err);
    } finally {
      setUpdating(false);
    }
  }, [userProfile]);

  /**
   * 组件挂载时自动加载用户资料和地址
   */
  useEffect(() => {
    loadUserProfile();
    loadUserAddresses();
  }, [loadUserProfile, loadUserAddresses]);

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
