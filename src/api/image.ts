import { apiClient } from './api';
import { IMAGE_ENDPOINTS } from '../config/api-endpoints';
import type { ImageUploadRequest, ImageUploadResponse } from '../types/api';

/**
 * 获取图片上传URL
 */
export const getImageUploadUrl = async (imageType: string): Promise<ImageUploadResponse> => {
  const requestData: ImageUploadRequest = {
    image_type: imageType
  };
  
  const response = await apiClient.post<ImageUploadResponse>(
    IMAGE_ENDPOINTS.UPLOAD_URL, 
    requestData
  );
  
  return response.data;
};

/**
 * 上传图片到指定URL
 */
export const uploadImageToUrl = async (uploadUrl: string, file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // 直接上传到返回的URL，不使用apiClient（因为这是第三方存储服务）
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
};
