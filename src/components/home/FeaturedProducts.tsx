import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useHomepageSettings } from '@/hooks/useHomepageSettings';
import { ScrollReveal } from './ScrollReveal';

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useHomepageSettings();
  const featured = settings.featured;

  useEffect(() => {
    if (featured.show_section === false) { setLoading(false); return; }
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

  if (featured.show_section === false) return null;

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-secondary/30">
      <div className="container">
        {/* Header */}
        <ScrollReveal direction="up">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 rounded-full text-accent text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              {featured.badge_text}
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              {featured.title}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {featured.description}
            </p>
          </div>
        </ScrollReveal>

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
              <ScrollReveal key={product.id} direction="up" delay={index * 0.08} distance={30}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Chưa có sản phẩm nổi bật. Hãy thêm sản phẩm từ trang Admin.</p>
          </div>
        )}

        {/* CTA */}
        <ScrollReveal direction="up" delay={0.2}>
          <div className="text-center mt-12">
            <Link to="/products">
              <Button variant="elegant-outline" size="lg" className="group">
                {featured.button_text}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
