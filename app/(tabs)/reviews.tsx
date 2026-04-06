import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isTokenValid } from '@/src/utils/auth';
import { getUserComments, type Comment } from '../../src/api/comment'; // 移除了 likeComment
import { getProductDetail } from '../../src/api/product'; // 引入拉取商品详情接口
import { getUserProfile } from '../../src/api/user'; // 引入拉取用户信息接口
import { S3_CONFIG } from '../../src/config/api-endpoints';
import { tokenStorage } from '../../src/utils/storage';

// 扩展原始的 Comment 类型，加上我们拉取到的产品数据
interface ReviewWithProduct extends Comment {
  product_data?: any;
}

export default function MyReviewsScreen() {
  const router = useRouter();
  
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userName, setUserName] = useState<string>(''); // 存储当前用户的真实名字

  // 获取数据与未登录拦截
  useFocusEffect(
    useCallback(() => {
      const checkAuthAndLoad = async () => {
        setLoading(true);
        try {
          // 1. 验证 Token
          const token = await tokenStorage.get();
          const validToken = isTokenValid(token);
          if (!token || !validToken) {
            setIsLoggedIn(false);
            setLoading(false);
            return;
          }
          
          setIsLoggedIn(true);

          // 2. 并行拉取用户信息 和 评论列表
          const [profileRes, commentsRes] = await Promise.all([
            getUserProfile(),
            getUserComments()
          ]);

          // 设置用户名
          if (profileRes.name) {
            setUserName(profileRes.name);
          }
          
          // 3. 处理评论列表并拉取每个评论对应的商品信息
          if (commentsRes.status === 0) {
            const fetchedReviews = commentsRes.data || [];
            
            // 使用 Promise.all 并发获取所有相关的商品详情
            const reviewsWithProducts = await Promise.all(
              fetchedReviews.map(async (review: Comment) => {
                try {
                  const productRes = await getProductDetail(review.product_id);
                  return {
                    ...review,
                    // 假设 productRes.data 里面包含商品信息，你可以根据实际接口返回结构调整
                    product_data: productRes
                  };
                } catch (e) {
                  // 如果单个商品信息拉取失败，不影响其他评论展示
                  console.warn(`获取商品详情失败 productId: ${review.product_id}`);
                  return { ...review, product_data: null };
                }
              })
            );
            
            setReviews(reviewsWithProducts);
          } else {
            Alert.alert('Error', commentsRes.msg || 'Failed to fetch reviews');
          }
        } catch (error: any) {
          if (error.code === 401 || error?.response?.status === 401) {
            setIsLoggedIn(false);
          } else {
            Alert.alert('Error', error.message || 'Failed to load data');
          }
        } finally {
          setLoading(false);
        }
      };

      checkAuthAndLoad();
    }, [])
  );

  // 解析图片 URL
  const getImageUrl = (picInfo?: string) => {
    if (!picInfo) return '';
    if (picInfo.startsWith('http')) return picInfo;
    return `${S3_CONFIG.BASE_URL}${picInfo}`;
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // 点击跳转到商品详情页
  const goToProduct = (productId: number) => {
    router.push(`/product/${productId}`);
  };

  // 渲染五角星
  const renderStars = (stars: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(i => (
          <Ionicons 
            key={i} 
            name={i <= stars ? "star" : "star-outline"} 
            size={14} 
            color="#c75d35" 
          />
        ))}
      </View>
    );
  };

  // === 1. 渲染未登录状态 ===
  if (!loading && !isLoggedIn) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Reviews</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Please Log In</Text>
          <Text style={styles.emptyText}>You need to log in to view your reviews.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/login')}>
            <Text style={styles.primaryBtnText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // === 2. 正常渲染 ===
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <Text style={styles.reviewCount}>{reviews.length} reviews</Text>
      </View>

      {/* 列表与加载状态 */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#c75d35" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptyText}>You have not written any reviews.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.reviewCard} 
              activeOpacity={0.8}
              onPress={() => goToProduct(item.product_id)}
            >
              {/* 商品信息条 (如果拉取到了商品数据) */}
              {item.product_data && (
                <View style={styles.productRow}>
                  <Ionicons name="pricetag-outline" size={14} color="#666" />
                  <Text style={styles.productName} numberOfLines={1}>
                    {/* 根据你实际商品数据里的字段修改，通常是 name 或 title */}
                    {item.product_data.name || `Product #${item.product_id}`}
                  </Text>
                  <Ionicons name="chevron-forward-outline" size={14} color="#ccc" style={{ marginLeft: 'auto' }}/>
                </View>
              )}

              <View style={styles.reviewHeader}>
                <View style={styles.authorRow}>
                  <Text style={styles.authorName}>
                    {item.is_anonymous ? 'Anonymous' : (userName || `User ${item.user_id}`)}
                  </Text>
                  {renderStars(item.stars)}
                </View>
                <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
              </View>

              <Text style={styles.contentText}>{item.content}</Text>

              {/* 渲染图片 */}
              {item.pic_info && item.pic_info.length > 0 && (
                <View style={styles.imageGallery}>
                  {item.pic_info.map((pic, index) => {
                    if (!pic) return null;
                    return (
                      <Image 
                        key={index} 
                        source={{ uri: getImageUrl(pic) }} 
                        style={styles.reviewImage} 
                      />
                    );
                  })}
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  reviewCount: { fontSize: 16, color: '#666' },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#666' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  
  primaryBtn: { backgroundColor: '#c75d35', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  listContent: { padding: 15, paddingBottom: 40 },
  
  reviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  
  // 新增的商品展示条样式
  productRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginBottom: 12, gap: 6 },
  productName: { fontSize: 13, color: '#555', fontWeight: '500', flex: 1 },

  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorName: { fontSize: 15, fontWeight: '600', color: '#333' },
  starsContainer: { flexDirection: 'row' },
  dateText: { fontSize: 12, color: '#888' },
  
  contentText: { fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 12 },
  
  imageGallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  reviewImage: { width: 70, height: 70, borderRadius: 6, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#eee' },
});