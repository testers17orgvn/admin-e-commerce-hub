import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductFilters } from '@/components/products/ProductFilters';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid3X3, LayoutGrid, List, X, Package, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollReveal } from '@/components/home/ScrollReveal';
import { SaleHeroBanner } from '@/components/products/SaleHeroBanner';

interface FilterState {
  colors: string[];
  sizes: string[];
  tags: string[];
  priceRange: [number, number];
  isHot: boolean;
  hasDiscount: boolean;
  categoryId: string;
}

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categorySlug = searchParams.get('category');
  const sortBy = searchParams.get('sort') || 'newest';
  const searchQuery = searchParams.get('search') || '';

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
    categoryId: '',
  });

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
      const { data: catData } = await supabase.from('categories').select('*');
      setCategories((catData as Category[]) || []);

      let query = supabase.from('products').select('*').eq('is_active', true);
      if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
      if (categorySlug) {
        const category = catData?.find(c => c.slug === categorySlug);
        if (category) query = query.eq('category_id', category.id);
      }

      switch (sortBy) {
        case 'price-asc': query = query.order('price', { ascending: true }); break;
        case 'price-desc': query = query.order('price', { ascending: false }); break;
        case 'name': query = query.order('name', { ascending: true }); break;
        default: query = query.order('created_at', { ascending: false });
      }

      const { data: prodData } = await query;
      setProducts((prodData as Product[]) || []);
      setLoading(false);
    }
    fetchData();
  }, [categorySlug, sortBy, searchQuery]);

  const clearSearch = () => {
    searchParams.delete('search');
    setSearchParams(searchParams);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (filters.categoryId && product.category_id !== filters.categoryId) return false;
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) return false;
      if (filters.colors.length > 0 && !product.colors?.some(c => filters.colors.includes(c))) return false;
      if (filters.sizes.length > 0 && !product.sizes?.some(s => filters.sizes.includes(s))) return false;
      if (filters.tags.length > 0 && !product.tags?.some(t => filters.tags.includes(t))) return false;
      if (filters.isHot && !product.is_hot) return false;
      if (filters.hasDiscount && (!product.original_price || product.original_price <= product.price)) return false;
      return true;
    });
  }, [products, filters]);

  const handleCategoryChange = (slug: string) => {
    if (slug === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
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
      categoryId: '',
    });
  };

  const selectedCategory = categories.find(c => c.slug === categorySlug);

  return (
    <Layout>
      <div className="container py-6 md:py-10">
        {/* Sale Hero Banner */}
        <ScrollReveal direction="up">
          <SaleHeroBanner />
        </ScrollReveal>

        {/* Category Icons - Shopee style */}
        {categories.length > 0 && (
          <ScrollReveal direction="up">
            <div className="bg-card border border-border rounded-2xl p-4 md:p-5 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Danh mục</h2>
                {categorySlug && (
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Bỏ chọn
                  </button>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className="group flex flex-col items-center gap-1.5 flex-shrink-0"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl overflow-hidden border-2 flex items-center justify-center transition-all duration-200",
                    !categorySlug
                      ? "bg-primary/10 border-primary shadow-md shadow-primary/20"
                      : "bg-muted/40 border-transparent group-hover:border-primary/30 group-hover:shadow-sm"
                  )}>
                    <LayoutGrid className={cn("w-6 h-6 transition-colors", !categorySlug ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                  </div>
                  <span className={cn(
                    "text-[11px] font-medium leading-tight text-center w-16 line-clamp-2",
                    !categorySlug ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    Tất cả
                  </span>
                </button>
                {categories.map((cat) => {
                  const isActive = categorySlug === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.slug)}
                      className="group flex flex-col items-center gap-1.5 flex-shrink-0"
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-2xl overflow-hidden border-2 flex items-center justify-center transition-all duration-200",
                        isActive
                          ? "bg-primary/10 border-primary shadow-md shadow-primary/20"
                          : "bg-muted/40 border-transparent group-hover:border-primary/30 group-hover:shadow-sm"
                      )}>
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <Package className={cn("w-6 h-6 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                        )}
                      </div>
                      <span className={cn(
                        "text-[11px] font-medium leading-tight text-center w-16 line-clamp-2",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Page Title */}
        <ScrollReveal direction="up" delay={0.05}>
          <div className="mb-6">
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              {searchQuery 
                ? <>Tìm kiếm: <span className="text-primary">"{searchQuery}"</span></>
                : selectedCategory 
                  ? selectedCategory.name 
                  : 'Tất cả sản phẩm'
              }
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {filteredProducts.length} sản phẩm
              {searchQuery && (
                <Button variant="link" size="sm" className="ml-2 h-auto p-0 text-primary" onClick={clearSearch}>
                  Xóa tìm kiếm
                </Button>
              )}
            </p>
          </div>
        </ScrollReveal>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="lg:hidden">
              <ProductFilters
                availableColors={availableColors}
                availableSizes={availableSizes}
                availableTags={availableTags}
                categories={categories}
                maxPrice={maxPrice}
                filters={filters}
                onFiltersChange={setFilters}
                onReset={resetFilters}
                isMobileOnly
              />
            </div>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[160px] h-9 rounded-full text-sm">
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

          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <ProductFilters
              availableColors={availableColors}
              availableSizes={availableSizes}
              availableTags={availableTags}
              categories={categories}
              maxPrice={maxPrice}
              filters={filters}
              onFiltersChange={setFilters}
              onReset={resetFilters}
              isDesktopOnly
            />
          </div>

          {/* Products */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={cn(
                'grid gap-4 md:gap-6',
                viewMode === 'grid' 
                  ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3' 
                  : 'grid-cols-1 md:grid-cols-2'
              )}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Không tìm thấy sản phẩm nào.</p>
                <Button variant="outline" onClick={resetFilters} className="rounded-full">
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
