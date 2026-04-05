import { Ionicons } from '@expo/vector-icons'; // Expo 自带图标库
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList, Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import type { Product } from '../../src/api/product';
import { getProductList } from '../../src/api/product';
import { MainHeader } from '../../src/components/MainHeader';
import { S3_CONFIG } from '../../src/config/api-endpoints';


const { width } = Dimensions.get('window');
// 计算卡片宽度：(屏幕宽度 - 间距) / 2
const CARD_WIDTH = (width - 48) / 2;
const defaultImg = require('../../assets/images/defaultimg.png'); 

export default function HomeScreen() {
  const router = useRouter();
  
  // === 状态管理 ===
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('0'); // '0': Newest, '1': Oldest

  // 下拉菜单控制
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // === 选项定义 ===
  const categories = [
    { value: '', label: 'All Products' },
    { value: 'ceramics', label: 'ceramics' },
    { value: 'pottery', label: 'pottery' },
    { value: 'vases', label: 'vases' }
  ];

  const sortOptions = [
    { value: '0', label: 'Newest First' },
    { value: '1', label: 'Oldest First' }
  ];

  const selectedSortLabel = sortOptions.find(o => o.value === sortOrder)?.label || 'Sort by';

  const parsePicInfo = (picInfo: string): string[] => {
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

  const getProductImage = (product: Product) => {
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

  // === API 请求 ===
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        order_by: parseInt(sortOrder)
      };
      if (searchKeyword.trim()) params.keyword = searchKeyword.trim();
      if (selectedCategory) params.category = selectedCategory;

      const res = await getProductList(params);
      
      // 兼容 Mock 数据结构 (res.data 或 res.list)
      const list = res.list || []; 
      setProducts(list);
    } catch (err: any) {
      console.error("Pinning拦截真相:", JSON.stringify(err, null, 2))
      setError(err.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  // 监听筛选条件变化，自动刷新
  useEffect(() => {
    fetchProducts();
  }, [sortOrder, selectedCategory]);

  const goToDetail = (id: string) => {
    router.push(`/product/${id}`);
  };

  // === 渲染单个商品卡片 ===
  const renderItem = ({ item }: { item: any }) => {
    const isOutOfStock = item.stock <= 0 || item.status !== 1;
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.8}
        onPress={() => goToDetail(item.id)}
      >
        <View style={styles.imgBox}>
          <Image source={getProductImage(item)} style={styles.image} resizeMode="cover" />
          {isOutOfStock && (
            <View style={styles.outStockBadge}>
              <Text style={styles.outStockText}>OUT OF STOCK</Text>
            </View>
          )}
        </View>
        
        <View style={styles.info}>
          <Text style={styles.category}>{item.category || 'ART'}</Text>
          <Text style={styles.title} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.price}>${(item.price / 100).toFixed(2)}</Text>
          <Text style={styles.stock}>Stock: {item.stock}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <MainHeader 
        keyword={searchKeyword}
        onKeywordChange={setSearchKeyword}
        onSearch={fetchProducts}
        // 首页不需要返回按钮，所以不传 showBack
      />

      {/* === 筛选控制栏 === */}
      <View style={styles.controls}>
        
        {/* Filter Button */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity 
            style={[styles.controlBtn, showCategoryDropdown && styles.activeBtn]} 
            onPress={() => {
              setShowSortDropdown(false);
              setShowCategoryDropdown(!showCategoryDropdown);
            }}
          >
            <Ionicons name="filter" size={16} color={showCategoryDropdown ? "#c75d35" : "#333"} />
            <Text style={[styles.btnText, showCategoryDropdown && styles.activeText]}>
              {categories.find(c => c.value === selectedCategory)?.label || 'Filter'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={showSortDropdown ? "#c75d35" : "#666"} />
          </TouchableOpacity>

          {/* Filter Dropdown Content (绝对定位) */}
          {showCategoryDropdown && (
            <View style={styles.dropdownMenu}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.label}
                  style={[styles.dropdownItem, selectedCategory === cat.value && styles.activeDropdownItem]}
                  onPress={() => {
                    setSelectedCategory(cat.value);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownText, selectedCategory === cat.value && styles.activeDropdownText]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Sort Button */}
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity 
            style={[styles.controlBtn, showSortDropdown && styles.activeBtn]}
            onPress={() => {
              setShowCategoryDropdown(false);
              setShowSortDropdown(!showSortDropdown);
            }}
          >
            <Ionicons name="chevron-collapse" size={16} color={showCategoryDropdown ? "#c75d35" : "#333"} />
            <Text style={[styles.btnText, showSortDropdown && styles.activeText]}>
              {selectedSortLabel}
            </Text>
            <Ionicons name="chevron-down" size={16} color={showSortDropdown ? "#c75d35" : "#666"} />
          </TouchableOpacity>

          {/* Sort Dropdown Content */}
          {showSortDropdown && (
            <View style={[styles.dropdownMenu]}>
              {sortOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.dropdownItem, sortOrder === opt.value && styles.activeDropdownItem]}
                  onPress={() => {
                    setSortOrder(opt.value);
                    setShowSortDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownText, sortOrder === opt.value && styles.activeDropdownText]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* === 主内容区域 === */}
      {loading && products.length === 0 ? (
        <View style={styles.centerBox}><ActivityIndicator size="large" color="#c75d35" /></View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchProducts}>
            <Text style={{color:'white'}}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          numColumns={2} // 双列布局
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.5}
          // 点击列表空白处关闭下拉菜单
          onTouchStart={() => {
            if(showCategoryDropdown) setShowCategoryDropdown(false);
            if(showSortDropdown) setShowSortDropdown(false);
          }}
        />
      )}
    </SafeAreaView>
  );
}

// === 样式定义 (复刻 Vue 的 CSS) ===
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // 整个页面背景白
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    height: 44,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  searchIconBtn: {
    padding: 4,
  },
  
  // Controls Section
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    zIndex: 10, // 确保下拉菜单在列表上面
  },
  dropdownWrapper: {
    position: 'relative', // 为了绝对定位下拉菜单
    width: '48%',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
    gap: 8,
  },
  activeBtn: {
    borderColor: '#c75d35',
  },
  btnText: {
    fontSize: 14,
    color: '#333',
  },
  activeText: {
    color: '#c75d35',
    fontWeight: '600',
  },
  
  // Dropdown Menu
  dropdownMenu: {
    position: 'absolute',
    top: 45, // 按钮高度下面一点
    left: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  activeDropdownItem: {
    backgroundColor: '#f8f8f8',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  activeDropdownText: {
    color: '#c75d35',
    fontWeight: '600',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  
  // Card Styles
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "rgba(0,0,0,0.04)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3, // Android 阴影
    overflow: 'hidden', // 这里的 overflow hidden 可能会切掉阴影，但在 RN 里为了圆角图片通常需要
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  imgBox: {
    width: '100%',
    height: CARD_WIDTH, // 1:1 比例
    backgroundColor: '#f7f7f7',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  outStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outStockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  info: {
    padding: 12,
  },
  category: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 6,
    height: 38, // 限制两行高度
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#c75d35',
    marginBottom: 4,
  },
  stock: {
    fontSize: 12,
    color: '#999',
  },

  // State Views
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 10,
    fontSize: 16,
  },
  retryBtn: {
    backgroundColor: '#c75d35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
});