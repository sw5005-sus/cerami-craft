import type { Product } from '../../src/api/product';
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


export  const parsePicInfo = (picInfo: string): string[] => {
  if (!picInfo) {
    console.log('parsePicInfo: empty input, returning []');
    return [];
  }
  
  try {
    // 尝试解析为 JSON 数组
    const parsed = JSON.parse(picInfo);
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter(item => typeof item === 'string');
      return filtered;
    } else {
      console.log('parsePicInfo: parsed is not array');
    }
  } catch (error) {
    console.log('parsePicInfo: JSON.parse failed:', error);
  }
  return [picInfo];
}
const getFirstImage = (picInfo: string): string => {
  const images = parsePicInfo(picInfo);
  const first = images.length > 0 ? images[0] : '';
  return first;
}
export const getProductImage = (product: Product) => {
  const defaultImg = require('../../assets/images/defaultimg.png'); 
  if (product.pic_info && product.pic_info.trim()) {
    // 解析 pic_info 获取第一个图片
    const firstImage = getFirstImage(product.pic_info)
    if (firstImage) {
      // 如果已经是完整的URL，直接返回
      if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
        return { uri: firstImage };
      }
      // 否则拼接S3基础URL
      return { uri:`${S3_CONFIG.BASE_URL}${firstImage}`}
    }
  }
  return defaultImg
}
