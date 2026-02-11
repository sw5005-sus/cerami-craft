import { ref, computed } from 'vue';
import { getProductList } from '../api/product';
import type { Product, ProductListParams } from '../api/product';
import { S3_CONFIG } from '../config/api-endpoints';

export function useProductList() {
  const products = ref<Product[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const total = ref(0);

  const searchParams = ref<ProductListParams>({
    keyword: '',
    category: '',
    offset: 0,
    order_by: 0,
    status: ''
  });

  // 解析 pic_info 字符串为数组
  const parsePicInfo = (picInfo: string): string[] => {
    if (!picInfo) return [];
    
    try {
      // 尝试解析为 JSON 数组
      const parsed = JSON.parse(picInfo);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string');
      }
    } catch {
      // 如果解析失败，当作单个文件名处理
    }
    
    // 如果不是 JSON 数组格式，当作单个文件名
    return [picInfo];
  };

  // 获取第一个图片
  const getFirstImage = (picInfo: string): string => {
    const images = parsePicInfo(picInfo);
    return images.length > 0 ? images[0] : '';
  };

  // 获取第一个图片的完整 S3 URL
  const getFirstImageUrl = (picInfo: string): string => {
    const firstImage = getFirstImage(picInfo);
    if (!firstImage) return '';
    if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) return firstImage;
    return `${S3_CONFIG.BASE_URL}${firstImage}`;
  };

  const fetchProducts = async (params: ProductListParams = {}) => {
    loading.value = true;
    error.value = null;
    
    try {
      const result = await getProductList(params);
      products.value = result.list;
      total.value = result.total;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取商品列表失败';
      console.error('Fetch products error:', err);
    } finally {
      loading.value = false;
    }
  };

  const searchProductsByKeyword = async (keyword: string) => {
    searchParams.value.keyword = keyword;
    searchParams.value.offset = 0;
    await fetchProducts(searchParams.value);
  };

  const filterByCategory = async (category: string) => {
    searchParams.value.category = category;
    searchParams.value.offset = 0;
    await fetchProducts(searchParams.value);
  };

  const sortProducts = async (orderBy: number) => {
    searchParams.value.order_by = orderBy;
    searchParams.value.offset = 0;
    await fetchProducts(searchParams.value);
  };

  const loadMore = async () => {
    if (loading.value) return;
    
    const currentOffset = searchParams.value.offset || 0;
    const newOffset = currentOffset + 10;
    
    loading.value = true;
    try {
      const result = await getProductList({
        ...searchParams.value,
        offset: newOffset
      });
      
      products.value.push(...result.list);
      searchParams.value.offset = newOffset;
      total.value = result.total;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载更多失败';
    } finally {
      loading.value = false;
    }
  };

  const resetSearch = async () => {
    searchParams.value = {
      keyword: '',
      category: '',
      offset: 0,
      order_by: 0,
      status: ''
    };
    await fetchProducts();
  };

  const hasMore = computed(() => {
    return products.value.length < total.value;
  });

  return {
    products,
    loading,
    error,
    total,
    searchParams,
    hasMore,
    fetchProducts,
    searchProductsByKeyword,
    filterByCategory,
    sortProducts,
    loadMore,
    resetSearch,
    getFirstImage,
    getFirstImageUrl
  };
}
