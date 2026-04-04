import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/lib/types';
import { Heart, ShoppingBag, Trash2, Grid3X3, LayoutList, Search, SlidersHorizontal, ArrowUpDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'name';

export default function Wishlist() {
  const { user } = useAuth();
  const { items, isLoading: wishlistLoading, removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (items.length > 0) {
      fetchProducts();
    } else {
      setProducts([]);
      setIsLoading(false);
    }
  }, [items]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const productIds = items.map(item => item.product_id);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('is_active', true);
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching wishlist products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = products
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'name') return a.name.localeCompare(b.name);
      // newest - by wishlist added order
      const aIdx = items.findIndex(i => i.product_id === a.id);
      const bIdx = items.findIndex(i => i.product_id === b.id);
      return aIdx - bIdx;
    });

  const handleRemoveAll = async () => {
    if (!confirm('Xóa tất cả sản phẩm khỏi danh sách yêu thích?')) return;
    for (const item of items) {
      await removeFromWishlist(item.product_id);
    }
    toast.success('Đã xóa tất cả');
  };

  const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + '₫';

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-full" />
              <Heart className="absolute inset-0 m-auto h-10 w-10 text-pink-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Danh sách yêu thích</h1>
            <p className="text-muted-foreground mb-6">
              Đăng nhập để lưu và quản lý sản phẩm yêu thích của bạn.
            </p>
            <Button asChild className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white border-0">
              <Link to="/auth">Đăng nhập ngay</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Header */}
        <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500/10 via-red-500/5 to-orange-500/10 p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-pink-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl shadow-lg">
                <Heart className="h-7 w-7 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  Yêu thích
                  <Sparkles className="h-5 w-5 text-amber-500" />
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {products.length > 0
                    ? `${products.length} sản phẩm đang chờ bạn`
                    : 'Khám phá và lưu sản phẩm yêu thích'}
                </p>
              </div>
            </div>
            {products.length > 1 && (
              <Button variant="outline" size="sm" onClick={handleRemoveAll} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-1" /> Xóa tất cả
              </Button>
            )}
          </div>
        </div>

        {isLoading || wishlistLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative mx-auto w-28 h-28 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-full" />
              <Heart className="absolute inset-0 m-auto h-12 w-12 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-bold mb-2">Chưa có sản phẩm yêu thích</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Nhấn vào biểu tượng ❤️ trên sản phẩm để thêm vào danh sách yêu thích.
            </p>
            <Button asChild className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white border-0">
              <Link to="/products">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Khám phá sản phẩm
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm trong yêu thích..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sort} onValueChange={(v: SortOption) => setSort(v)}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mới thêm nhất</SelectItem>
                  <SelectItem value="price_asc">Giá thấp → cao</SelectItem>
                  <SelectItem value="price_desc">Giá cao → thấp</SelectItem>
                  <SelectItem value="name">Tên A-Z</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}>
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}>
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-3">
                {filtered.map((product) => {
                  const discount = product.original_price && product.original_price > product.price
                    ? Math.round((1 - product.price / product.original_price) * 100) : null;
                  return (
                    <div key={product.id} className="flex items-center gap-4 p-4 rounded-xl border hover:shadow-md transition-all group bg-card">
                      <Link to={`/products/${product.slug}`} className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        {discount && (
                          <Badge className="absolute top-1 left-1 bg-destructive text-destructive-foreground text-[10px] px-1 py-0">
                            -{discount}%
                          </Badge>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/products/${product.slug}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors truncate">{product.name}</h3>
                        </Link>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="font-bold text-primary">{formatPrice(product.price)}</span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
                          )}
                        </div>
                        <div className="flex gap-1 mt-1.5">
                          {product.colors && product.colors.length > 0 && (
                            <Badge variant="outline" className="text-[10px]">{product.colors.length} màu</Badge>
                          )}
                          {product.sizes && product.sizes.length > 0 && (
                            <Badge variant="outline" className="text-[10px]">{product.sizes.length} size</Badge>
                          )}
                          {product.stock <= 5 && product.stock > 0 && (
                            <Badge variant="destructive" className="text-[10px]">Sắp hết</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/products/${product.slug}`}>Xem</Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeFromWishlist(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filtered.length === 0 && search && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Không tìm thấy sản phẩm "{search}"</p>
              </div>
            )}

            {/* Summary */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Hiển thị {filtered.length}/{products.length} sản phẩm yêu thích
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
