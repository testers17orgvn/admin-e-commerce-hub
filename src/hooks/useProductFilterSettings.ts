import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FilterLayout = 'vertical' | 'horizontal' | 'both';
export type FilterStyle = 'minimal' | 'rounded' | 'pill' | 'glass' | 'neon' | 'card';
export type FilterAccent = 'primary' | 'rose' | 'emerald' | 'amber' | 'violet' | 'sky';

export interface ProductFilterSettings {
  layout: FilterLayout;
  style: FilterStyle;
  accent: FilterAccent;
  sticky: boolean;
  show_price: boolean;
  show_colors: boolean;
  show_sizes: boolean;
  show_tags: boolean;
  show_special: boolean;
  show_active_chips: boolean;
}

export const defaultProductFilterSettings: ProductFilterSettings = {
  layout: 'vertical',
  style: 'rounded',
  accent: 'primary',
  sticky: true,
  show_price: true,
  show_colors: true,
  show_sizes: true,
  show_tags: true,
  show_special: true,
  show_active_chips: true,
};

export function useProductFilterSettings() {
  const [settings, setSettings] = useState<ProductFilterSettings>(defaultProductFilterSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'product_filter_settings')
        .maybeSingle();
      if (data?.value) {
        setSettings({ ...defaultProductFilterSettings, ...(data.value as unknown as ProductFilterSettings) });
      }
      setLoaded(true);
    })();
  }, []);

  return { settings, loaded };
}

export const ACCENT_CLASSES: Record<FilterAccent, { ring: string; bg: string; text: string; border: string; soft: string }> = {
  primary: { ring: 'ring-primary/30', bg: 'bg-primary', text: 'text-primary', border: 'border-primary', soft: 'bg-primary/10' },
  rose: { ring: 'ring-rose-300/40', bg: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-500', soft: 'bg-rose-500/10' },
  emerald: { ring: 'ring-emerald-300/40', bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-500', soft: 'bg-emerald-500/10' },
  amber: { ring: 'ring-amber-300/40', bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-500', soft: 'bg-amber-500/10' },
  violet: { ring: 'ring-violet-300/40', bg: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-500', soft: 'bg-violet-500/10' },
  sky: { ring: 'ring-sky-300/40', bg: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-500', soft: 'bg-sky-500/10' },
};
