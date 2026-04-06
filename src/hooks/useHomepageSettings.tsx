import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HeroSettings {
  badge_text: string;
  title_line1: string;
  title_line2: string;
  description: string;
  button_primary_text: string;
  button_secondary_text: string;
  stats: Array<{ value: string; label: string }>;
  background_image?: string;
  show_badge?: boolean;
  show_description?: boolean;
  show_buttons?: boolean;
  show_stats?: boolean;
}

interface FeaturedSettings {
  badge_text: string;
  title: string;
  description: string;
  button_text: string;
  show_section?: boolean;
}

interface CategoriesSettings {
  title: string;
  description: string;
}

interface NewsletterSettings {
  title: string;
  description: string;
  button_text: string;
  placeholder: string;
}

export interface HomepageSettings {
  hero: HeroSettings;
  featured: FeaturedSettings;
  categories: CategoriesSettings;
  newsletter: NewsletterSettings;
}

const defaultSettings: HomepageSettings = {
  hero: {
    badge_text: 'Bộ sưu tập mới 2024',
    title_line1: 'Phong cách',
    title_line2: 'Đẳng cấp',
    description: 'Khám phá những thiết kế độc quyền, tinh tế được tuyển chọn từ các thương hiệu hàng đầu thế giới.',
    button_primary_text: 'Khám phá ngay',
    button_secondary_text: 'Liên hệ tư vấn',
    stats: [
      { value: '500+', label: 'Sản phẩm' },
      { value: '10K+', label: 'Khách hàng' },
      { value: '5★', label: 'Đánh giá' },
    ],
    show_badge: true,
    show_description: true,
    show_buttons: true,
    show_stats: true,
  },
  featured: {
    badge_text: 'Nổi bật',
    title: 'Sản phẩm nổi bật',
    description: 'Những sản phẩm được yêu thích nhất',
    button_text: 'Xem tất cả sản phẩm',
  },
  categories: {
    title: 'Danh mục sản phẩm',
    description: 'Khám phá các danh mục sản phẩm đa dạng',
  },
  newsletter: {
    title: 'Đăng ký nhận tin',
    description: 'Nhận thông tin về sản phẩm mới và ưu đãi độc quyền',
    button_text: 'Đăng ký',
    placeholder: 'Email của bạn',
  },
};

export function useHomepageSettings() {
  const [settings, setSettings] = useState<HomepageSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['homepage_hero', 'homepage_featured', 'homepage_categories', 'homepage_newsletter']);

        if (data && data.length > 0) {
          const newSettings = { ...defaultSettings };
          
          data.forEach((item) => {
            const value = item.value as Record<string, unknown>;
            if (item.key === 'homepage_hero' && value) {
              // Only merge non-empty values
              const heroValue: Record<string, unknown> = {};
              Object.entries(value).forEach(([k, v]) => {
                if (v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)) {
                  heroValue[k] = v;
                }
              });
              newSettings.hero = { ...defaultSettings.hero, ...heroValue };
            } else if (item.key === 'homepage_featured' && value) {
              const featuredValue: Record<string, unknown> = {};
              Object.entries(value).forEach(([k, v]) => {
                if (v !== '' && v !== null && v !== undefined) {
                  featuredValue[k] = v;
                }
              });
              newSettings.featured = { ...defaultSettings.featured, ...featuredValue };
            } else if (item.key === 'homepage_categories' && value) {
              const categoriesValue: Record<string, unknown> = {};
              Object.entries(value).forEach(([k, v]) => {
                if (v !== '' && v !== null && v !== undefined) {
                  categoriesValue[k] = v;
                }
              });
              newSettings.categories = { ...defaultSettings.categories, ...categoriesValue };
            } else if (item.key === 'homepage_newsletter' && value) {
              const newsletterValue: Record<string, unknown> = {};
              Object.entries(value).forEach(([k, v]) => {
                if (v !== '' && v !== null && v !== undefined) {
                  newsletterValue[k] = v;
                }
              });
              newSettings.newsletter = { ...defaultSettings.newsletter, ...newsletterValue };
            }
          });
          
          setSettings(newSettings);
        }
      } catch (error) {
        console.error('Error fetching homepage settings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return { settings, loading };
}
