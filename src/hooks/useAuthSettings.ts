import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuthPageSettings {
  auth_banner_url?: string;
  auth_welcome_title?: string;
  auth_welcome_subtitle?: string;
  auth_features?: string[];
  logo_url?: string;
  site_name?: string;
}

const DEFAULTS: AuthPageSettings = {
  auth_welcome_title: 'Mua sắm thông minh',
  auth_welcome_subtitle: 'Trải nghiệm mua sắm trực tuyến hiện đại với hàng ngàn sản phẩm chất lượng',
  auth_features: [
    'Giao hàng nhanh chóng toàn quốc',
    'Thanh toán an toàn & bảo mật',
    'Ưu đãi độc quyền mỗi ngày',
    'Hỗ trợ khách hàng 24/7',
  ],
};

export function useAuthSettings() {
  const [settings, setSettings] = useState<AuthPageSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const keys = ['auth_banner_url', 'auth_welcome_title', 'auth_welcome_subtitle', 'auth_features', 'logo_url', 'site_name'];
    supabase
      .from('settings')
      .select('key, value')
      .in('key', keys)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, unknown> = {};
          data.forEach((r: { key: string; value: unknown }) => {
            map[r.key] = r.value;
          });
          setSettings(prev => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(map).filter(([, v]) => v != null && v !== '')
            ),
          }));
        }
        setLoading(false);
      });
  }, []);

  return { settings, loading };
}
