import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/lib/types';
import { Heart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Wishlist() {
  const { user } = useAuth();
  const { items, isLoading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Danh sách yêu thích</h1>
            <p className="text-muted-foreground mb-6">
              Vui lòng đăng nhập để xem và quản lý danh sách sản phẩm yêu thích của bạn.
            </p>
            <Button asChild>
              <Link to="/auth">Đăng nhập</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Danh sách yêu thích</h1>
          <p className="text-muted-foreground">
            {products.length > 0 
              ? `Bạn có ${products.length} sản phẩm trong danh sách yêu thích`
              : 'Lưu những sản phẩm bạn yêu thích để xem lại sau'}
          </p>
        </div>

        {isLoading || wishlistLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/4] rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Chưa có sản phẩm yêu thích</h2>
            <p className="text-muted-foreground mb-6">
              Khám phá các sản phẩm và nhấn vào biểu tượng trái tim để thêm vào danh sách yêu thích.
            </p>
            <Button asChild>
              <Link to="/products">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Khám phá sản phẩm
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
