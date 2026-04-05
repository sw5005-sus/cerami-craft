import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// === 引入 API 和 工具 ===
import { SafeAreaView } from 'react-native-safe-area-context';
import { addToCart as addToCartAPI } from '../../src/api/cart';
import { getProductComments } from '../../src/api/comment'; // 假设你有这个
import { getProductDetail } from '../../src/api/product';
import { S3_CONFIG } from '../../src/config/api-endpoints';
import { getProductImage, parsePicInfo } from '../../src/utils/image';
import { tokenStorage } from '../../src/utils/storage';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const productId = Array.isArray(id) ? id[0] : id; // 确保 ID 是字符串

  // === 状态定义 ===
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // 评论状态
  const [comments, setComments] = useState<any[]>([]);
  const [pinnedReview, setPinnedReview] = useState<any>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // === 初始化 ===
  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchComments();
    }
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const res = await getProductDetail(productId);
      setProduct(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const hasToken = await tokenStorage.get();
      if (!hasToken) {
        console.log('🔒 [Dev Mode] No token logic yet, defaulting to Guest view.');
        setCommentsLoading(false);
        return; 
      }
      // @ts-ignore
      const res = await getProductComments(parseInt(productId));
      setComments(res.comments || []);
      setPinnedReview(res.pinnedReview || null);
    } catch (err) {
      console.log('Comments error', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  // === 辅助逻辑 ===
  const images = product ? parsePicInfo(product.pic_info) : [];

  const rootComments = comments.filter(c => !c.parent_id || c.parent_id === '0' || c.parent_id === '');
  
  // 构造大图 URL
  const getMainImageUrl = () => {
    if (images.length === 0) return getProductImage(product); // 用默认图
    const filename = images[activeImageIndex];
    if (filename.startsWith('http')) return { uri: filename };
    return { uri: `${S3_CONFIG.BASE_URL}${filename}` };
  };

  // 构造缩略图 URL
  const getThumbnailUrl = (filename: string) => {
    if (filename.startsWith('http')) return { uri: filename };
    return { uri: `${S3_CONFIG.BASE_URL}${filename}` };
  };

  // 数量控制
  const handleQuantity = (type: 'inc' | 'dec') => {
    if (type === 'inc') {
      if (quantity < (product?.stock || 0)) setQuantity(q => q + 1);
    } else {
      if (quantity > 1) setQuantity(q => q - 1);
    }
  };

  // 加入购物车
  const handleAddToCart = async () => {
    if (addingToCart) return;
    setAddingToCart(true);
    try {
      // @ts-ignore
      await addToCartAPI(parseInt(productId), quantity);
      Alert.alert('Success', `Added ${quantity} item(s) to cart`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add to cart. Please login first.');
      console.log(error)
    } finally {
      setAddingToCart(false);
    }
  };

  // 渲染星星
  const renderStars = (rating: number, size = 14) => {
    return (
      <View style={{ flexDirection: 'row' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons 
            key={star} 
            name={star <= rating ? "star" : "star-outline"} 
            size={size} 
            color="#c75d35" 
          />
        ))}
      </View>
    );
  };
  // 递归查找并渲染评论
  const renderComment = (comment: any, isReply = false) => {
    const replies = comments.filter((c: any) => c.parent_id === comment.id);
    
    // 🛡️ 终极图片数据清洗：兼容后端的各种奇葩格式
    let validImages: string[] = [];
    if (Array.isArray(comment.pic_info)) {
      validImages = comment.pic_info;
    } else if (typeof comment.pic_info === 'string' && comment.pic_info.trim() !== '') {
      try {
        // 尝试解析 "[...]" 格式的 JSON 字符串
        validImages = JSON.parse(comment.pic_info);
      } catch (e) {
        // 如果解析失败，说明它可能就是一个单张图片的普通字符串
        validImages = [comment.pic_info];
      }
    }
    // 过滤掉所有不是字符串、或者是空字符串的脏数据 (比如 null, [])
    validImages = validImages.filter((img: any) => typeof img === 'string' && img.trim() !== '');

    return (
      <View key={comment.id} style={[styles.reviewItem, isReply && styles.replyItem]}>
        <View style={styles.reviewHeaderRow}>
          <Text style={styles.reviewerName}>
            {comment.is_anonymous ? 'Anonymous' : `User ${comment.user_id}`}
            {isReply && <Text style={styles.replyBadge}> (From Sellers)</Text>}
          </Text>
          {!isReply && renderStars(comment.stars)}
        </View>
        <Text style={styles.reviewDate}>{new Date(comment.created_at).toLocaleDateString()}</Text>
        <Text style={styles.reviewContent}>{comment.content}</Text>
        
        {/* 📸 修复后的图片渲染 */}
        {validImages.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.commentImageScroll}>
            {validImages.map((img: string, idx: number) => {
              const imgUrl = img.startsWith('http') ? img : `${S3_CONFIG.BASE_URL}${img}`;
              return (
                <Image 
                  key={idx} 
                  source={{ uri: imgUrl }} 
                  style={styles.commentImage} 
                  resizeMode="cover"
                />
              );
            })}
          </ScrollView>
        )}
        
        {/* 递归渲染子回复 */}
        {replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {replies.map(reply => renderComment(reply, true))}
          </View>
        )}
      </View>
    );
  };

  // === 页面渲染 ===
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#c75d35" /></View>;
  if (error || !product) return <View style={styles.center}><Text>{error || 'Product not found'}</Text></View>;

  const isOutOfStock = product.stock <= 0 || product.status !== 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部导航栏 (浮动返回按钮) */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{product.name}</Text>
        <View style={{width: 32}} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 1. 图片区域 */}
        <View style={styles.imageSection}>
          <Image source={getMainImageUrl()} style={styles.mainImage} resizeMode="cover" />
          {isOutOfStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
            </View>
          )}
        </View>

        {/* 缩略图条 */}
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
            {images.map((img, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => setActiveImageIndex(index)}
                style={[styles.thumbItem, activeImageIndex === index && styles.thumbActive]}
              >
                <Image source={getThumbnailUrl(img)} style={styles.thumbImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* 2. 商品基本信息 */}
        <View style={styles.infoSection}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.price}>${(product.price / 100).toFixed(2)}</Text>
          
          <View style={styles.stockRow}>
            <Text style={styles.stockText}>Stock: {product.stock}</Text>
            {product.stock > 0 && product.stock < 10 && (
              <Text style={styles.lowStockText}>Only {product.stock} left!</Text>
            )}
          </View>
        </View>

        {/* 3. 描述与参数 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{product.desc || 'No description available.'}</Text>
          
          <View style={styles.detailsList}>
             {product.material && <Text style={styles.detailItem}>• Material: {product.material}</Text>}
             {product.dimensions && <Text style={styles.detailItem}>• Dimensions: {product.dimensions}</Text>}
             {product.weight && <Text style={styles.detailItem}>• Weight: {product.weight}</Text>}
          </View>
        </View>

        {/* 4. 评论区 */}
        <View style={styles.section}>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionTitle}>Reviews ({rootComments.length})</Text>
            {/* 可以在这里显示平均分 */}
          </View>

          {/* 置顶评论 */}
          {pinnedReview && (
            <View style={styles.pinnedReview}>
              <View style={styles.pinnedLabelRow}>
                <Ionicons name="pin" size={14} color="#c75d35" />
                <Text style={styles.pinnedLabel}>PINNED REVIEW</Text>
              </View>
              <View style={styles.reviewHeaderRow}>
                 <Text style={styles.reviewerName}>User {pinnedReview.user_id}</Text>
                 {renderStars(pinnedReview.stars)}
              </View>
              <Text style={styles.reviewContent}>{pinnedReview.content}</Text>
            </View>
          )}

          {/* 普通评论列表 (展示层级) */}
          {comments
            .filter(c => !c.parent_id || c.parent_id === '0' || c.parent_id === '')
            .map((rootComment) => renderComment(rootComment))}
          
          {comments.length === 0 && !pinnedReview && (
            <Text style={styles.emptyText}>No reviews yet.</Text>
          )}
        </View>
        
        {/* 底部留白，防止被按钮遮挡 */}
        <View style={{height: 100}} />
      </ScrollView>

      {/* 5. 底部固定操作栏 */}
      <View style={styles.footer}>
        {/* 数量选择器 */}
        <View style={styles.qtyControl}>
           <TouchableOpacity onPress={() => handleQuantity('dec')} style={styles.qtyBtn}>
             <Text style={styles.qtyBtnText}>-</Text>
           </TouchableOpacity>
           <Text style={styles.qtyValue}>{quantity}</Text>
           <TouchableOpacity onPress={() => handleQuantity('inc')} style={styles.qtyBtn}>
             <Text style={styles.qtyBtnText}>+</Text>
           </TouchableOpacity>
        </View>

        {/* 按钮组 */}
        <View style={styles.actionBtns}>
          <TouchableOpacity 
            style={[styles.cartBtn, isOutOfStock && styles.disabledBtn]} 
            onPress={handleAddToCart}
            disabled={isOutOfStock}
          >
            <Text style={styles.cartBtnText}>Add</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.buyBtn, isOutOfStock && styles.disabledBtn]}
            onPress={() => Alert.alert('TODO', 'Go to Checkout')}
            disabled={isOutOfStock}
          >
            <Text style={styles.buyBtnText}>Buy Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Nav
  navBar: {
    height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff'
  },
  backBtn: { padding: 4 },
  navTitle: { fontSize: 16, fontWeight: '600', maxWidth: '70%' },

  scrollContent: { paddingBottom: 20 },

  // Images
  imageSection: { width: width, height: width, position: 'relative', backgroundColor: '#f9f9f9' },
  mainImage: { width: '100%', height: '100%' },
  outOfStockBadge: {
    position: 'absolute', top: '45%', left: '25%', right: '25%',
    backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, alignItems: 'center', borderRadius: 4
  },
  outOfStockText: { color: '#fff', fontWeight: 'bold' },
  
  thumbScroll: { paddingHorizontal: 16, marginTop: 12, height: 70 },
  thumbItem: { 
    width: 60, height: 60, marginRight: 10, borderRadius: 6, borderWidth: 1, borderColor: 'transparent',
    overflow: 'hidden'
  },
  thumbActive: { borderColor: '#c75d35' },
  thumbImage: { width: '100%', height: '100%' },

  // Info
  infoSection: { padding: 20 },
  category: { color: '#c75d35', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#222', marginBottom: 8 },
  price: { fontSize: 22, fontWeight: '700', color: '#c75d35' },
  stockRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  stockText: { color: '#888', fontSize: 14 },
  lowStockText: { color: '#e74c3c', fontSize: 12, marginLeft: 10, fontWeight: 'bold' },

  // Section
  section: { padding: 20, borderTopWidth: 8, borderTopColor: '#f9f9f9' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  descriptionText: { fontSize: 15, lineHeight: 24, color: '#555', marginBottom: 16 },
  detailItem: { fontSize: 14, color: '#666', marginBottom: 4 },
  detailsList: { backgroundColor: '#fdfdfd', padding: 12, borderRadius: 8 },

  // Reviews
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pinnedReview: { 
    backgroundColor: '#fff8f0', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ffecd6', marginBottom: 16 
  },
  pinnedLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  pinnedLabel: { color: '#c75d35', fontSize: 12, fontWeight: 'bold' },
  
  reviewItem: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 16 },
  reviewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewerName: { fontWeight: '600', fontSize: 14, color: '#333' },
  reviewDate: { fontSize: 12, color: '#999', marginBottom: 8 },
  reviewContent: { fontSize: 14, color: '#444', lineHeight: 20 },
  emptyText: { color: '#999', fontStyle: 'italic' },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', 
    flexDirection: 'row', padding: 12, 
    borderTopWidth: 1, borderTopColor: '#eee',
    elevation: 10, shadowColor: '#000', shadowOffset: {width:0, height:-2}, shadowOpacity: 0.1, shadowRadius: 4
  },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 4, marginRight: 12
  },
  qtyBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9' },
  qtyBtnText: { fontSize: 18, fontWeight: 'bold', color: '#666' },
  qtyValue: { width: 40, textAlign: 'center', fontSize: 16, fontWeight: '600' },

  actionBtns: { flex: 1, flexDirection: 'row', gap: 10 },
  cartBtn: { 
    flex: 1, backgroundColor: '#333', borderRadius: 4, justifyContent: 'center', alignItems: 'center', height: 44 
  },
  buyBtn: { 
    flex: 1, backgroundColor: '#c75d35', borderRadius: 4, justifyContent: 'center', alignItems: 'center', height: 44 
  },
  cartBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  buyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  disabledBtn: { backgroundColor: '#ccc' },
  //评论层级样式
  repliesContainer: { 
    marginTop: 12, 
    paddingLeft: 12, 
    borderLeftWidth: 2, 
    borderLeftColor: '#f0f0f0',
    backgroundColor: '#fafafa',
    paddingTop: 8,
    borderRadius: 4
  },
  replyItem: { 
    borderBottomWidth: 0, 
    paddingBottom: 4, 
    marginBottom: 8 
  },
  replyBadge: {
    color: '#c75d35',
    fontSize: 12,
    fontWeight: 'normal'
  },
  commentImageScroll: { 
    flexDirection: 'row', 
    marginTop: 8, 
    marginBottom: 4 
  },
  commentImage: { 
    width: 80, 
    height: 80, 
    borderRadius: 6, 
    marginRight: 10, 
    backgroundColor: '#f5f5f5', // 图片加载前的占位底色
    borderWidth: 1,
    borderColor: '#eee'
  },
});
