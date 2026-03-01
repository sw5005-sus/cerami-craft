// 你的后端 HTTPS 地址
export const BASE_URL = 'http://18.140.49.89:30090';

/**
 * API 端点配置文件
 * 集中管理所有 API 路径，避免路径错误
 */

// 基础服务路径
export const SERVICE_PATHS = {
  USER_MS: '/user-ms/v1/customer',
  PRODUCT_MS: '/product-ms/v1/customer',
  PRODUCT_MS_MERCHANT: '/product-ms/v1/merchant',
  PAYMENT_MS: '/payment-ms/v1/customer',
  // 后续可以添加其他微服务路径
  // ORDER_MS: '/order-ms/v1',
} as const;

// 用户服务相关端点
export const USER_ENDPOINTS = {
  // 用户认证
  LOGIN: `${SERVICE_PATHS.USER_MS}/login`,
  LOGOUT: `${SERVICE_PATHS.USER_MS}/logout`,
  OAUTH_CALLBACK: `${SERVICE_PATHS.USER_MS}/oauth-callback`,
  
  // 用户注册和激活
  REGISTER: `${SERVICE_PATHS.USER_MS}/users`,
  ACTIVATE: `${SERVICE_PATHS.USER_MS}/users/activate`,
  
  // 用户信息管理
  PROFILE: `${SERVICE_PATHS.USER_MS}/profile`,
  USER_SELF: `${SERVICE_PATHS.USER_MS}/users/self`,
  
  // 地址管理
  USER_ADDRESSES: `${SERVICE_PATHS.USER_MS}/users/self/addresses`,
  
  // 密码管理
  CHANGE_PASSWORD: `${SERVICE_PATHS.USER_MS}/password`,
  RESET_PASSWORD: `${SERVICE_PATHS.USER_MS}/password/reset`,
} as const;

// 商品服务相关端点
export const PRODUCT_ENDPOINTS = {
  // 商品列表
  LIST: `${SERVICE_PATHS.PRODUCT_MS}/products`,
  
  // 商品详情
  DETAIL: `${SERVICE_PATHS.PRODUCT_MS}/product`,
  
  // 购物车相关
  CART: `${SERVICE_PATHS.PRODUCT_MS}/cart`,
  CART_ITEMS: `${SERVICE_PATHS.PRODUCT_MS}/cart/items`,
  CART_PRICE_ESTIMATE: `${SERVICE_PATHS.PRODUCT_MS}/cart/price-estimate`,
  
  // 后续可以添加其他商品相关端点
  // CATEGORIES: `${SERVICE_PATHS.PRODUCT_MS}/categories`,
} as const;

// 图片上传相关端点
export const IMAGE_ENDPOINTS = {
  // 获取图片上传URL
  UPLOAD_URL: `${SERVICE_PATHS.PRODUCT_MS_MERCHANT}/images/upload-urls`,
} as const;

// 支付服务相关端点
export const PAYMENT_ENDPOINTS = {
  // 支付账户信息
  PAY_ACCOUNT_SELF: `${SERVICE_PATHS.PAYMENT_MS}/pay-accounts/self`,
  // 账户充值
  TOP_UP: `${SERVICE_PATHS.PAYMENT_MS}/pay-accounts/self/top-ups`,
} as const;

// S3存储配置
export const S3_CONFIG = {
  BASE_URL: 'https://ceramicraft.s3.ap-southeast-1.amazonaws.com/',
} as const;

// 导出所有端点供使用
export const API_ENDPOINTS = {
  USER: USER_ENDPOINTS,
  PRODUCT: PRODUCT_ENDPOINTS,
  PAYMENT: PAYMENT_ENDPOINTS,
  // 后续可以添加其他服务的端点
  // ORDER: ORDER_ENDPOINTS,
} as const;
