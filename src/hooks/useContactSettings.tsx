import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ContactSettings {
  address: string;
  phone: string;
  email: string;
  working_hours: string;
  map_embed: string;
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
  facebook: '',
  zalo: '',
  intro_title: 'Liên hệ',
  intro_description: 'Hãy liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào',
};

export function useContactSettings() {
  const [settings, setSettings] = useState<ContactSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('contact_settings').select('*');
      
      if (error) {
        console.error('Error fetching contact settings:', error);
      } else if (data) {
        const settingsMap: Partial<ContactSettings> = {};
        data.forEach((item: { key: string; value: string | null }) => {
          if (item.value) {
            settingsMap[item.key as keyof ContactSettings] = item.value;
          }
        });
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
      setLoading(false);
    };

    fetchSettings();
  }, []);

  return { settings, loading };
}
