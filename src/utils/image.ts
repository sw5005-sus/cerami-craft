import { S3_CONFIG } from '../config/api-endpoints';

/**
 * 获取完整的头像URL
 * @param avatar - 从API返回的头像文件名（如：186b876d891fe642.jpg）
 * @returns 完整的S3 URL 或空字符串
 */
export const getAvatarUrl = (avatar: string | null | undefined): string => {
  if (!avatar || !avatar.trim()) {
    return '';
  }
  
  // 如果已经是完整URL，直接返回
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar;
  }
  
  // 拼接S3前缀
  return `${S3_CONFIG.BASE_URL}${avatar}`;
};

/**
 * 从完整URL中提取文件名
 * @param fullUrl - 完整的S3 URL
 * @returns 文件名
 */
export const getImageFileName = (fullUrl: string): string => {
  if (!fullUrl) return '';
  
  // 如果不是完整URL，直接返回
  if (!fullUrl.startsWith('http')) {
    return fullUrl;
  }
  
  // 从URL中提取文件名
  return fullUrl.replace(S3_CONFIG.BASE_URL, '');
};
