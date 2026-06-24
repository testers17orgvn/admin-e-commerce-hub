import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCache, setCache, subscribeCache } from '@/lib/cacheStorage';

const CACHE_KEY = 'ai_chatbot_settings';

export interface AIChatbotSettings {
  enabled: boolean;
  name: string;
  avatar_url: string;
  welcome_message: string;
  system_prompt: string;
  knowledge_base: string;
  accent_color: string;
  model: string;
  placeholder: string;
  suggestions: string[];
}

export const defaultAIChatbot: AIChatbotSettings = {
  enabled: true,
  name: 'Trợ lý VSM',
  avatar_url: '',
  welcome_message: 'Xin chào 👋 Mình có thể giúp gì cho bạn hôm nay?',
  system_prompt:
    'Bạn là trợ lý ảo thân thiện của cửa hàng VSM. Trả lời ngắn gọn, lịch sự, hữu ích bằng tiếng Việt. Khi không biết, hãy đề xuất khách liên hệ hotline.',
  knowledge_base: '',
  accent_color: '#3B82F6',
  model: 'google/gemini-2.5-flash',
  placeholder: 'Nhập câu hỏi của bạn...',
  suggestions: ['Có khuyến mãi gì không?', 'Cách đặt hàng?', 'Phí vận chuyển bao nhiêu?'],
};

export function useAIChatbotSettings() {
  const cached = getCache<AIChatbotSettings>(CACHE_KEY);
  const [settings, setSettings] = useState<AIChatbotSettings>(
    cached ? { ...defaultAIChatbot, ...cached } : defaultAIChatbot,
  );
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'ai_chatbot_settings')
        .maybeSingle();
      if (mounted && data?.value) {
        const merged = { ...defaultAIChatbot, ...(data.value as Partial<AIChatbotSettings>) };
        setSettings(merged);
        setCache(CACHE_KEY, merged);
      }
      if (mounted) setLoading(false);
    };
    load();

    const channel = supabase
      .channel('rt:ai_chatbot_settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings', filter: 'key=eq.ai_chatbot_settings' },
        () => load(),
      )
      .subscribe();

    const off = subscribeCache<AIChatbotSettings>(CACHE_KEY, (v) => {
      if (v) setSettings({ ...defaultAIChatbot, ...v });
    });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      off();
    };
  }, []);

  return { settings, loading };
}
