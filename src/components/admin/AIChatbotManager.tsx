import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from './ImageUpload';
import { Bot, Save, Sparkles, BookOpen, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { defaultAIChatbot, AIChatbotSettings } from '@/hooks/useAIChatbotSettings';
import { ChatbotKnowledgeManager } from './ChatbotKnowledgeManager';

const MODELS = [
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (nhanh, miễn phí)' },
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (siêu nhanh)' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (thông minh nhất)' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini (cân bằng)' },
  { value: 'openai/gpt-5', label: 'GPT-5 (mạnh nhất, đắt)' },
];

export function AIChatbotManager() {
  const [s, setS] = useState<AIChatbotSettings>(defaultAIChatbot);
  const [suggestionsText, setSuggestionsText] = useState(defaultAIChatbot.suggestions.join('\n'));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'ai_chatbot_settings')
        .maybeSingle();
      if (data?.value) {
        const merged = { ...defaultAIChatbot, ...(data.value as Partial<AIChatbotSettings>) };
        setS(merged);
        setSuggestionsText((merged.suggestions || []).join('\n'));
      }
      setLoading(false);
    })();
  }, []);

  const set = <K extends keyof AIChatbotSettings>(k: K, v: AIChatbotSettings[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload: AIChatbotSettings = {
      ...s,
      suggestions: suggestionsText.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 6),
    };
    const { data: existing } = await supabase.from('settings').select('id').eq('key', 'ai_chatbot_settings').maybeSingle();
    const op = existing
      ? supabase.from('settings').update({ value: payload as never }).eq('key', 'ai_chatbot_settings')
      : supabase.from('settings').insert([{ key: 'ai_chatbot_settings', value: payload as never }]);
    const { error } = await op;
    setSaving(false);
    if (error) toast.error('Lỗi lưu: ' + error.message);
    else toast.success('Đã lưu cấu hình chatbot');
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> Chatbot AI</CardTitle>
            <div className="flex items-center gap-2">
              <Switch id="bot-enabled" checked={s.enabled} onCheckedChange={(v) => set('enabled', v)} />
              <Label htmlFor="bot-enabled">Hiển thị</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Tên trợ lý</Label>
              <Input value={s.name} onChange={(e) => set('name', e.target.value)} placeholder="Trợ lý VSM" />
            </div>
            <div>
              <Label>Màu chủ đạo</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={s.accent_color}
                  onChange={(e) => set('accent_color', e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input value={s.accent_color} onChange={(e) => set('accent_color', e.target.value)} />
              </div>
            </div>
          </div>

          <ImageUpload
            value={s.avatar_url}
            onChange={(url) => set('avatar_url', url)}
            folder="chatbot"
            label="Ảnh đại diện chatbot"
          />

          <div>
            <Label>Model AI</Label>
            <Select value={s.model} onValueChange={(v) => set('model', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Nội dung hội thoại</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Lời chào mở đầu</Label>
            <Textarea value={s.welcome_message} onChange={(e) => set('welcome_message', e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Placeholder ô nhập</Label>
            <Input value={s.placeholder} onChange={(e) => set('placeholder', e.target.value)} />
          </div>
          <div>
            <Label>Câu hỏi gợi ý (mỗi dòng 1 câu, tối đa 6)</Label>
            <Textarea
              value={suggestionsText}
              onChange={(e) => setSuggestionsText(e.target.value)}
              rows={4}
              placeholder={'Có khuyến mãi gì không?\nCách đặt hàng?'}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Huấn luyện (System Prompt)</CardTitle>
          <p className="text-sm text-muted-foreground">Hướng dẫn cách bot trả lời: vai trò, giọng điệu, giới hạn.</p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={s.system_prompt}
            onChange={(e) => set('system_prompt', e.target.value)}
            rows={6}
            placeholder="Bạn là trợ lý ảo của VSM..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Kiến thức chung (tuỳ chọn)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Văn bản tự do bổ sung. Dùng cho thông tin ngắn — để FAQ chi tiết hãy dùng phần "Quản lý FAQ" bên dưới.
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={s.knowledge_base}
            onChange={(e) => set('knowledge_base', e.target.value)}
            rows={6}
            placeholder={'VD: Giờ làm việc 8h-22h, hotline 0123 456 789...'}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Đang lưu...' : 'Lưu cấu hình chatbot'}
        </Button>
      </div>

      <div className="pt-4 border-t">
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Quản lý FAQ / Knowledge Base
          </h3>
          <p className="text-sm text-muted-foreground">Thêm, sửa, xoá từng mục theo danh mục. Bot sẽ tự động tham khảo.</p>
        </div>
        <ChatbotKnowledgeManager />
      </div>
    </div>
  );
}
