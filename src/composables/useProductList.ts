import { useCallback, useMemo, useState } from 'react';
import type { Product, ProductListParams } from '../api/product';
import { getProductList } from '../api/product';
import { S3_CONFIG } from '../config/api-endpoints';

export function useProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [searchParams, setSearchParams] = useState<ProductListParams>({
    keyword: '',
    category: '',
    offset: 0,
    order_by: 0,
    status: ''
  });

  // 解析 pic_info 字符串为数组
  const parsePicInfo = useCallback((picInfo: string): string[] => {
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
  }, []);

  // 获取第一个图片
  const getFirstImage = useCallback((picInfo: string): string => {
    const images = parsePicInfo(picInfo);
    return images.length > 0 ? images[0] : '';
  }, [parsePicInfo]);

  // 获取第一个图片的完整 S3 URL
  const getFirstImageUrl = useCallback((picInfo: string): string => {
    const firstImage = getFirstImage(picInfo);
    if (!firstImage) return '';
    if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) return firstImage;
    return `${S3_CONFIG.BASE_URL}${firstImage}`;
  }, [getFirstImage]);

  const fetchProducts = useCallback(async (params: ProductListParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getProductList(params);
      setProducts(result.list);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取商品列表失败');
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProductsByKeyword = useCallback(async (keyword: string) => {
    setSearchParams(prev => ({ ...prev, keyword, offset: 0 }));
    await fetchProducts({ ...searchParams, keyword, offset: 0 });
  }, [fetchProducts, searchParams]);

  const filterByCategory = useCallback(async (category: string) => {
    setSearchParams(prev => ({ ...prev, category, offset: 0 }));
    await fetchProducts({ ...searchParams, category, offset: 0 });
  }, [fetchProducts, searchParams]);

  const sortProducts = useCallback(async (orderBy: number) => {
    setSearchParams(prev => ({ ...prev, order_by: orderBy, offset: 0 }));
    await fetchProducts({ ...searchParams, order_by: orderBy, offset: 0 });
  }, [fetchProducts, searchParams]);

  const loadMore = useCallback(async () => {
    if (loading) return;
    
    const currentOffset = searchParams.offset || 0;
    const newOffset = currentOffset + 10;
    
    setLoading(true);
    try {
      const result = await getProductList({
        ...searchParams,
        offset: newOffset
      });
      
      setProducts(prev => [...prev, ...result.list]);
      setSearchParams(prev => ({ ...prev, offset: newOffset }));
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载更多失败');
    } finally {
      setLoading(false);
    }
  }, [loading, searchParams]);

  const resetSearch = useCallback(async () => {
    const defaultParams = {
      keyword: '',
      category: '',
      offset: 0,
      order_by: 0,
      status: ''
    };
    setSearchParams(defaultParams);
    await fetchProducts();
  }, [fetchProducts]);

  const hasMore = useMemo(() => {
    return products.length < total;
  }, [products.length, total]);

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
