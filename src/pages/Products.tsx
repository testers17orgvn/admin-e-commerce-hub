import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductFilters } from '@/components/products/ProductFilters';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid3X3, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterState {
  colors: string[];
  sizes: string[];
  tags: string[];
  priceRange: [number, number];
  isHot: boolean;
  hasDiscount: boolean;
}

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categorySlug = searchParams.get('category');
  const sortBy = searchParams.get('sort') || 'newest';

  // Extract all available filter options from products
  const { availableColors, availableSizes, availableTags, maxPrice } = useMemo(() => {
    const colors = new Set<string>();
    const sizes = new Set<string>();
    const tags = new Set<string>();
    let max = 10000000;

    products.forEach(product => {
      product.colors?.forEach(c => colors.add(c));
      product.sizes?.forEach(s => sizes.add(s));
      product.tags?.forEach(t => tags.add(t));
      if (product.price > max) max = product.price;
    });

    return {
      availableColors: Array.from(colors),
      availableSizes: Array.from(sizes),
      availableTags: Array.from(tags),
      maxPrice: max,
    };
  }, [products]);

  const [filters, setFilters] = useState<FilterState>({
    colors: [],
    sizes: [],
    tags: [],
    priceRange: [0, 10000000],
    isHot: false,
    hasDiscount: false,
  });

  // Update price range when maxPrice changes
  useEffect(() => {
    if (maxPrice > 0) {
      setFilters(prev => ({
        ...prev,
        priceRange: [prev.priceRange[0], Math.min(prev.priceRange[1], maxPrice) || maxPrice]
      }));
    }
  }, [maxPrice]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Fetch categories
      const { data: catData } = await supabase.from('categories').select('*');
      setCategories((catData as Category[]) || []);

      // Build product query
      let query = supabase.from('products').select('*').eq('is_active', true);

      if (categorySlug) {
        const category = catData?.find(c => c.slug === categorySlug);
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      switch (sortBy) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data: prodData } = await query;
      setProducts((prodData as Product[]) || []);
      setLoading(false);
    }
    fetchData();
  }, [categorySlug, sortBy]);

  // Apply client-side filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Price filter
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false;
      }

      // Color filter
      if (filters.colors.length > 0) {
        if (!product.colors?.some(c => filters.colors.includes(c))) {
          return false;
        }
      }

      // Size filter
      if (filters.sizes.length > 0) {
        if (!product.sizes?.some(s => filters.sizes.includes(s))) {
          return false;
        }
      }

      // Tag filter
      if (filters.tags.length > 0) {
        if (!product.tags?.some(t => filters.tags.includes(t))) {
          return false;
        }
      }

      // Hot filter
      if (filters.isHot && !product.is_hot) {
        return false;
      }

      // Discount filter
      if (filters.hasDiscount && (!product.original_price || product.original_price <= product.price)) {
        return false;
      }

      return true;
    });
  }, [products, filters]);

  const handleCategoryChange = (value: string) => {
    if (value === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', value);
    }
    setSearchParams(searchParams);
  };

  const handleSortChange = (value: string) => {
    searchParams.set('sort', value);
    setSearchParams(searchParams);
  };

  const resetFilters = () => {
    setFilters({
      colors: [],
      sizes: [],
      tags: [],
      priceRange: [0, maxPrice],
      isHot: false,
      hasDiscount: false,
    });
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Bộ sưu tập
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Khám phá các sản phẩm cao cấp được tuyển chọn kỹ lưỡng
          </p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 pb-6 border-b">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Mobile Filters */}
            <ProductFilters
              availableColors={availableColors}
              availableSizes={availableSizes}
              availableTags={availableTags}
              maxPrice={maxPrice}
              filters={filters}
              onFiltersChange={setFilters}
              onReset={resetFilters}
            />

            <Select value={categorySlug || 'all'} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                <SelectItem value="name">Tên A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {filteredProducts.length} sản phẩm
            </span>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block">
            <ProductFilters
              availableColors={availableColors}
              availableSizes={availableSizes}
              availableTags={availableTags}
              maxPrice={maxPrice}
              filters={filters}
              onFiltersChange={setFilters}
              onReset={resetFilters}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={cn(
                'grid gap-6',
                viewMode === 'grid' 
                  ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1 md:grid-cols-2'
              )}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground mb-4">Không tìm thấy sản phẩm nào.</p>
                <Button variant="outline" onClick={resetFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
