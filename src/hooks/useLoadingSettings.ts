import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCache, setCache, subscribeCache } from '@/lib/cacheStorage';

const CACHE_KEY = 'loading_settings';

export type LoadingEffect =
  | 'spinner'
  | 'pulse'
  | 'wave'
  | 'dots'
  | 'progress-bar'
  | 'logo-breath'
  | 'particles';

export interface LoadingSettings {
  enabled: boolean;
  logo_url: string;
  tagline: string;
  effect: LoadingEffect;
  accent_color: string;
  gradient_from: string;
  gradient_to: string;
  speed: number;
  show_progress: boolean;
  show_tagline: boolean;
}

export const defaultLoadingSettings: LoadingSettings = {
  enabled: true,
  logo_url: '',
  tagline: 'Đang tải...',
  effect: 'logo-breath',
  accent_color: '#3B82F6',
  gradient_from: '#0F172A',
  gradient_to: '#1E293B',
  speed: 1,
  show_progress: true,
  show_tagline: true,
};

export function useLoadingSettings() {
  const cached = getCache<LoadingSettings>(CACHE_KEY);
  const [settings, setSettings] = useState<LoadingSettings>(
    cached ? { ...defaultLoadingSettings, ...cached } : defaultLoadingSettings,
  );
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'loading_settings')
        .maybeSingle();
      if (mounted && data?.value) {
        const merged = { ...defaultLoadingSettings, ...(data.value as Partial<LoadingSettings>) };
        setSettings(merged);
        setCache(CACHE_KEY, merged);
      }
      if (mounted) setLoading(false);
    };
    load();

    const channel = supabase
      .channel('rt:loading_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings', filter: 'key=eq.loading_settings' },
        () => load(),
      )
      .subscribe();

    const off = subscribeCache<LoadingSettings>(CACHE_KEY, (v) => {
      if (v) setSettings({ ...defaultLoadingSettings, ...v });
    });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      off();
    };
  }, []);

  const save = async (next: LoadingSettings) => {
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'loading_settings')
      .maybeSingle();
    if (existing) {
      await supabase.from('settings').update({ value: next as never }).eq('key', 'loading_settings');
    } else {
      await supabase.from('settings').insert([{ key: 'loading_settings', value: next as never }]);
    }
    setSettings(next);
    setCache(CACHE_KEY, next);
  };

  return { settings, loading, save };
}
