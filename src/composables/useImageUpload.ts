// src/composables/useImageUpload.ts
import { useState } from 'react';
import { Alert } from 'react-native';
// 引入刚才改好的 api
import { getImageUploadUrl, uploadImageToUrl } from '../api/image';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * 上传头像图片
   * @param fileUri React Native ImagePicker 返回的本地 URI
   */
  const uploadAvatar = async (fileUri: string): Promise<string> => {
    try {
      setUploading(true);
      setUploadProgress(0);
      console.log('📸 Original File URI:', fileUri);

      let extension = 'jpg'; // 默认值
      const parts = fileUri.split('.');
      
      if (parts.length > 1) {
        let ext = parts.pop()?.toLowerCase();
        
        // 🚨 强制修正：如果后缀是 jpeg，必须转成 jpg
        if (ext === 'jpeg') {
          console.warn('⚠️ Detected "jpeg", forcing conversion to "jpg" for backend compatibility.');
          ext = 'jpg';
        }
        
        // 只允许白名单内的后缀
        if (ext && ['jpg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
          extension = ext;
        }
      }
      
      console.log('Getting upload URL for image type:', extension);

      // 2. 获取上传URL (调用你的接口)
      const uploadInfo = await getImageUploadUrl(extension);
      console.log('Got upload info:', uploadInfo);

      setUploadProgress(40);

      // 3. 上传图片到 S3/云存储
      // 注意：这里传的是 upload_url，和你 Vue 逻辑一致
      await uploadImageToUrl(uploadInfo.upload_url, fileUri);
      console.log('Image uploaded successfully');

      setUploadProgress(100);

      // 4. 返回 image_id
      return uploadInfo.image_id;

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload image';
      Alert.alert('Upload Error', errorMessage);
      console.error('Upload avatar error:', error);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploading,
    uploadProgress,
    uploadAvatar,
  };
};