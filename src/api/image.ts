import { IMAGE_ENDPOINTS } from '../config/api-endpoints';
import type { ImageUploadRequest, ImageUploadResponse } from '../types/api';
import { apiClient } from './api';

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
export const uploadImageToUrl = async (uploadUrl: string, fileUri: string): Promise<void> => {
  const blobResponse = await fetch(fileUri);
  const blob = await blobResponse.blob();
  
  const fileType = blob.type || 'image/jpeg';

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: blob, // RN 用 blob
    headers: {
      'Content-Type': fileType,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
};
