import axios from 'axios'
/**
 * 获取当前用户发布的评论
 */
export async function getUserComments() {
  const token = localStorage.getItem('userToken')
  const res = await axios.get('/api/comment-ms/v1/customer/reviews/user', {
    headers: {
      'accept': 'application/json',
      'authtoken': token || ''
    }
  })
  return res.data
}
/**
 * 点赞评论
 */
export const likeComment = async (review_id: string): Promise<boolean> => {
  const token = localStorage.getItem('userToken') || '';
  try {
    const response = await request.post<{ status: number }>(
      `/api/comment-ms/v1/customer/reviews/${review_id}/like`,
      {},
      {
        headers: {
          'auth-token': token,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
      }
    );
    return response.status === 0;
  } catch (error) {
    console.error('Like comment API error:', error);
    return false;
  }
};
/**
 * 评论相关 API 函数
 */
import { request } from './api'

// 评论接口
export interface Comment {
  id: string
  content: string
  user_id: number
  product_id: number
  parent_id: string
  stars: number
  is_anonymous: boolean
  pic_info: string[]
  created_at: string
  likes: number
  current_user_liked: boolean
}

// 获取商品评论列表请求接口
export interface GetProductCommentsRequest {
  product_id: number
  limit?: number
  offset?: number
}

// 获取商品评论列表响应接口
export interface GetProductCommentsResponse {
  status: number
  data: {
    review_list: Comment[]
    pinned_review: Comment | null
  }
  msg: string
  error: string
}

// 创建评论请求接口
export interface CreateCommentRequest {
  content: string
  is_anonymous: boolean
  parentID?: string
  pic_info?: string[]
  productID: number
  stars: number
}

// 创建评论响应接口
export interface CreateCommentResponse {
  status: number
  data: string
  msg: string
  error: string
}

/**
 * 根据商品ID获取评论列表
 */
export const getProductComments = async (productId: number): Promise<{ comments: Comment[], total: number, pinnedReview: Comment | null }> => {
  try {
    console.log('Getting product comments for product ID:', productId)
    
    const response = await request.get<GetProductCommentsResponse>(`/comment-ms/v1/customer/reviews/product/${productId}`)
    
    console.log('Product comments fetched successfully:', response)
    
    if (response.status === 0) {
      // 将 review_list 转换为 comments，并计算总数
      const comments = response.data.review_list || []
      const total = comments.length
      const pinnedReview = response.data.pinned_review || null
      return { comments, total, pinnedReview }
    } else {
      throw new Error(response.msg || response.error || 'Failed to get product comments')
    }
  } catch (error) {
    console.error('Get product comments API error:', error)
    throw error
  }
}

/**
 * 创建商品评论
 */
export const createComment = async (commentData: CreateCommentRequest): Promise<string> => {
  try {
    console.log('Creating comment with data:', commentData)
    
    const response = await request.post<CreateCommentResponse>('/comment-ms/v1/customer/reviews', commentData)
    
    console.log('Comment created successfully:', response)
    
    if (response.status === 0) {
      return response.data
    } else {
      throw new Error(response.msg || response.error || 'Failed to create comment')
    }
  } catch (error) {
    console.error('Create comment API error:', error)
    throw error
  }
}
