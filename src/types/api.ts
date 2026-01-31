// 用户登录相关类型
export interface LoginRequest {
  email: string;
  password: string;
  id?: number;
}

// 登录响应格式
export interface LoginResponse {
  code: number;
  data: string;
}

// 用户注册相关类型
export interface RegisterRequest {
  email: string;
  password: string;
  id?: number;
}

// 注册响应格式
export interface RegisterResponse {
  message: string;
}

// 验证码激活请求
export interface ActivateRequest {
  code: string;
}

// 激活响应格式
export interface ActivateResponse {
  message: string;
}

// 用户地址信息类型
export interface UserAddress {
  city: string;
  contact_phone: string;
  country: string;
  created_at: number;
  detail: string;
  first_name: string;
  id: number;
  is_default: boolean;
  last_name: string;
  province: string;
  updated_at: number;
  user_id: number;
  zip_code: string;
}

// 新增用户地址请求类型
export interface CreateAddressRequest {
  city: string;
  contact_phone: string;
  country: string;
  detail: string;
  first_name: string;
  is_default: boolean;
  last_name: string;
  province: string;
  zip_code: string;
}

// 更新用户地址请求类型
export interface UpdateAddressRequest {
  city: string;
  contact_phone: string;
  country: string;
  detail: string;
  first_name: string;
  id: number;
  is_default: boolean;
  last_name: string;
  province: string;
  user_id: number;
  zip_code: string;
}

// 用户信息类型
export interface UserProfile {
  avatar: string;
  default_address?: UserAddress; // 可选，因为API可能不返回
  email: string;
  id: number;
  name: string;
}

// API通用响应格式
export interface ApiResponse<T> {
  code: number;
  data: T;
}

// 用户更新请求类型（只包含可修改的字段）
export interface UserProfileUpdate {
  name?: string;
  avatar?: string;
  email?: string;
  default_address?: Partial<UserAddress>;
}

// 图片上传相关类型
export interface ImageUploadRequest {
  image_type: string;
}

export interface ImageUploadResponse {
  image_id: string;
  upload_url: string;
}

// 商品信息类型
export interface ProductInfo {
  id: number;
  name: string;
  category: string;
  price: number;
  desc: string;
  stock: number;
  pic_info: string;
  status: number;
}

// 购物车商品项类型
export interface CartItem {
  id: number;
  product_info: ProductInfo;
  quantity: number;
  total_price: number;
  status: number;
  selected: boolean;
}

// 添加商品到购物车的请求类型
export interface AddToCartRequest {
  id?: number;
  product_id: number;
  quantity: number;
  selected: boolean;
  user_id?: number;
}

// 添加商品到购物车的响应类型
export interface AddToCartResponse {
  code: number;
  data: unknown; // 根据错误信息，实际返回的data可能是商品详情或其他格式
  err_msg: string;
}

// 更新购物车项目的请求类型
export interface UpdateCartItemRequest {
  id: number;
  product_id: number;
  quantity: number;
  selected: boolean;
  user_id: number;
}

// 更新购物车项目的响应类型
export interface UpdateCartItemResponse {
  code: number;
  data: {
    id: number;
    product_id: number;
    quantity: number;
    selected: boolean;
    user_id: number;
  };
  err_msg: string;
}

// 删除购物车商品的响应类型
export interface RemoveCartItemResponse {
  code: number;
  data: string;
  err_msg: string;
}

// 购物车价格估算数据类型
export interface CartPriceEstimate {
  product_price: number;
  shipping_price: number;
  tax: number;
  total: number;
}

// 购物车价格估算响应类型
export interface CartPriceEstimateResponse {
  code: number;
  data: CartPriceEstimate;
  err_msg: string;
}

// 购物车数据类型
export interface CartData {
  cart_items: CartItem[];
  selected_item_count: number;
  selected_price: number;
}

// 购物车API响应类型
export interface CartResponse {
  code: number;
  err_msg: string;
  data: CartData;
}

// 错误响应类型
export interface ApiError {
  code: number;
  data?: string;	
  err_msg: string;
}
