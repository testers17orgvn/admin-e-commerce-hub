import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [settings, setSettings] = useState<AIChatbotSettings>(defaultAIChatbot);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'ai_chatbot_settings')
        .maybeSingle();
      if (mounted && data?.value) {
        setSettings({ ...defaultAIChatbot, ...(data.value as Partial<AIChatbotSettings>) });
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return { settings, loading };
}
