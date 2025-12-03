import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(8);
      
      setProducts((data as Product[]) || []);
      setLoading(false);
    }
    fetchFeatured();
  }, []);

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 rounded-full text-accent text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Nổi bật
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Sản phẩm nổi bật
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Những sản phẩm được yêu thích nhất tại LuxeShop
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Chưa có sản phẩm nổi bật. Hãy thêm sản phẩm từ trang Admin.</p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/products">
            <Button variant="elegant-outline" size="lg" className="group">
              Xem tất cả sản phẩm
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
