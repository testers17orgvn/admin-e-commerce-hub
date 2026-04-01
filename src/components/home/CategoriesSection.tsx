import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/lib/types';
import { useHomepageSettings } from '@/hooks/useHomepageSettings';
import { ScrollReveal } from './ScrollReveal';
import { ChevronRight, Package } from 'lucide-react';

export function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useHomepageSettings();
  const categoriesSettings = settings.categories;

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .limit(12);
      
      setCategories((data as Category[]) || []);
      setLoading(false);
    }
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-6 md:py-10">
        <div className="container">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-muted animate-pulse rounded-xl" />
                <div className="w-12 h-3 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-6 md:py-10">
      <div className="container">
        {/* Header */}
        <ScrollReveal direction="up">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg md:text-xl font-bold text-foreground">
              {categoriesSettings.title}
            </h2>
            <Link
              to="/products"
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              Xem tất cả
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Categories Grid - compact Shopee-style */}
        <ScrollReveal direction="up" delay={0.1}>
          <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-2 gap-y-4">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.slug}`}
                  className="group flex flex-col items-center gap-2 text-center hover:scale-105 transition-transform duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-muted/50 border border-border/50 group-hover:border-primary/30 group-hover:shadow-md transition-all duration-200 flex items-center justify-center">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <span className="text-xs md:text-sm text-muted-foreground group-hover:text-primary font-medium leading-tight line-clamp-2 max-w-[80px] transition-colors">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
