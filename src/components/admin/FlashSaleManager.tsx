import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ImageUpload } from './ImageUpload';
import { Save, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface FlashSaleSettings {
  title: string;
  end_time: string;
  banner_image: string;
  is_active: boolean;
}

const defaultSettings: FlashSaleSettings = {
  title: '⚡ Flash Sale',
  end_time: '',
  banner_image: '',
  is_active: true,
};

export function FlashSaleManager() {
  const [settings, setSettings] = useState<FlashSaleSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'flash_sale')
        .maybeSingle();
      if (data?.value) {
        setSettings({ ...defaultSettings, ...(data.value as unknown as FlashSaleSettings) });
      }
    }
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'flash_sale')
        .maybeSingle();

      if (existing) {
        await supabase.from('settings').update({ value: settings as never }).eq('key', 'flash_sale');
      } else {
        await supabase.from('settings').insert([{ key: 'flash_sale', value: settings as never }]);
      }
      toast.success('Lưu cài đặt Flash Sale thành công');
    } catch {
      toast.error('Lỗi khi lưu');
    }
    setSaving(false);
  };

  // Format datetime-local value
  const formatDateTimeLocal = (iso: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toISOString().slice(0, 16);
    } catch { return ''; }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-destructive" />
          Quản lý Flash Sale
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cấu hình chương trình Flash Sale trên trang chủ. Sản phẩm có đánh dấu "Hot" sẽ tự động hiển thị.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Switch
            id="flash_active"
            checked={settings.is_active}
            onCheckedChange={(c) => setSettings(p => ({ ...p, is_active: c }))}
          />
          <Label htmlFor="flash_active">Bật Flash Sale</Label>
        </div>

        <div>
          <label className="text-sm font-medium">Tiêu đề</label>
          <Input
            value={settings.title}
            onChange={(e) => setSettings(p => ({ ...p, title: e.target.value }))}
            placeholder="⚡ Flash Sale"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Thời gian kết thúc</label>
          <Input
            type="datetime-local"
            value={formatDateTimeLocal(settings.end_time)}
            onChange={(e) => setSettings(p => ({ ...p, end_time: new Date(e.target.value).toISOString() }))}
          />
        </div>

        <ImageUpload
          value={settings.banner_image}
          onChange={(url) => setSettings(p => ({ ...p, banner_image: url }))}
          folder="flash-sale"
          label="Banner Flash Sale"
        />

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Đang lưu...' : 'Lưu cài đặt Flash Sale'}
        </Button>
      </CardContent>
    </Card>
  );
}
