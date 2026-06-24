import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCache, setCache, subscribeCache } from '@/lib/cacheStorage';

const CACHE_KEY = 'contact_settings';

export interface ContactSettings {
  address: string;
  phone: string;
  email: string;
  working_hours: string;
  map_embed: string;
  map_lat: string;
  map_lng: string;
  map_place_name: string;
  facebook: string;
  zalo: string;
  intro_title: string;
  intro_description: string;
}

const defaultSettings: ContactSettings = {
  address: '',
  phone: '',
  email: '',
  working_hours: 'Thứ 2 - Thứ 7: 9:00 - 21:00\nChủ nhật: 10:00 - 18:00',
  map_embed: '',
  map_lat: '',
  map_lng: '',
  map_place_name: '',
  facebook: '',
  zalo: '',
  intro_title: 'Liên hệ',
  intro_description: 'Hãy liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào',
};

export function useContactSettings() {
  const cached = getCache<ContactSettings>(CACHE_KEY);
  const [settings, setSettings] = useState<ContactSettings>(
    cached ? { ...defaultSettings, ...cached } : defaultSettings,
  );
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('contact_settings').select('*');
      if (error) {
        console.error('Error fetching contact settings:', error);
      } else if (data) {
        const settingsMap: Partial<ContactSettings> = {};
        data.forEach((item: { key: string; value: string | null }) => {
          if (item.value != null) {
            settingsMap[item.key as keyof ContactSettings] = item.value;
          }
        });
        setSettings(prev => {
          const next = { ...prev, ...settingsMap };
          setCache(CACHE_KEY, next);
          return next;
        });
      }
      setLoading(false);
    };
    fetchSettings();

    const channel = supabase
      .channel('rt:contact_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_settings' },
        () => fetchSettings(),
      )
      .subscribe();

    const off = subscribeCache<ContactSettings>(CACHE_KEY, (v) => {
      if (v) setSettings({ ...defaultSettings, ...v });
    });

    return () => {
      supabase.removeChannel(channel);
      off();
    };
  }, []);

  return { settings, loading };
}
