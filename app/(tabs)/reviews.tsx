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
import { getUserComments, likeComment, type Comment } from '../../src/api/comment';
import { S3_CONFIG } from '../../src/config/api-endpoints';
import { tokenStorage } from '../../src/utils/storage';

export default function MyReviewsScreen() {
  const router = useRouter();
  
  const [reviews, setReviews] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

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
          
          // 2. 拉取评论数据
          const res = await getUserComments();
          if (res.status === 0) {
            setReviews(res.data || []);
          } else {
            Alert.alert('Error', res.msg || 'Failed to fetch reviews');
          }
        } catch (error: any) {
          if (error.code === 401 || error?.response?.status === 401) {
            //setIsLoggedIn(false);
          } else {
            Alert.alert('Error', error.message || 'Failed to load reviews');
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

  // 处理点赞逻辑 (乐观更新 UI)
  const handleLike = async (comment: Comment) => {
    // 先在前端更新 UI，让用户立刻看到变化
    const originalLiked = comment.current_user_liked;
    
    setReviews(prevReviews => 
      prevReviews.map(r => {
        if (r.id === comment.id) {
          return {
            ...r,
            current_user_liked: !originalLiked,
            likes: r.likes + (originalLiked ? -1 : 1)
          };
        }
        return r;
      })
    );

    // 发起请求
    const success = await likeComment(comment.id);
    if (!success) {
      // 如果后端点赞失败，回滚 UI 状态
      setReviews(prevReviews => 
        prevReviews.map(r => {
          if (r.id === comment.id) {
            return {
              ...r,
              current_user_liked: originalLiked,
              likes: r.likes + (originalLiked ? 1 : -1)
            };
          }
          return r;
        })
      );
      Alert.alert('Error', 'Failed to like the review.');
    }
  };

  // 点击跳转到商品详情页
  const goToProduct = (productId: number) => {
    // 请根据你实际的商品详情页路由路径进行调整
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
              <View style={styles.reviewHeader}>
                <View style={styles.authorRow}>
                  <Text style={styles.authorName}>
                    {item.is_anonymous ? 'Anonymous' : `User ${item.user_id}`}
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

              {/* 点赞按钮 */}
              <View style={styles.reviewFooter}>
                <TouchableOpacity 
                  style={styles.likeBtn}
                  onPress={() => handleLike(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name={item.current_user_liked ? "heart" : "heart-outline"} 
                    size={18} 
                    color={item.current_user_liked ? "#c75d35" : "#666"} 
                  />
                  <Text style={[styles.likeCount, item.current_user_liked && styles.likeCountActive]}>
                    {item.likes}
                  </Text>
                </TouchableOpacity>
              </View>
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
  backBtn: { padding: 5 },
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
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorName: { fontSize: 15, fontWeight: '600', color: '#333' },
  starsContainer: { flexDirection: 'row' },
  dateText: { fontSize: 12, color: '#888' },
  
  contentText: { fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 12 },
  
  imageGallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  reviewImage: { width: 70, height: 70, borderRadius: 6, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#eee' },
  
  reviewFooter: { flexDirection: 'row', justifyContent: 'flex-start', borderTopWidth: 1, borderColor: '#f8f9fa', paddingTop: 10 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeCount: { fontSize: 14, color: '#666' },
  likeCountActive: { color: '#c75d35', fontWeight: 'bold' },
});