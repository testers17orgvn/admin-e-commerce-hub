import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/lib/types';
import { useHomepageSettings } from '@/hooks/useHomepageSettings';

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
        .limit(6);
      
      setCategories((data as Category[]) || []);
      setLoading(false);
    }
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
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
    <section className="py-20">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            {categoriesSettings.title}
          </h2>
          <p className="text-muted-foreground">
            {categoriesSettings.description}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="group relative aspect-square overflow-hidden rounded-lg animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-charcoal to-charcoal-light" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
              <div className="absolute inset-0 flex items-end p-6">
                <div>
                  <h3 className="font-display text-xl md:text-2xl font-bold text-cream mb-1">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-cream/70 text-sm line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
