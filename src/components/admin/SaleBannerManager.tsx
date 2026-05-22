import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ImageUpload } from './ImageUpload';
import { Save, Tag } from 'lucide-react';
import { toast } from 'sonner';

export interface SaleBannerSettings {
  is_active: boolean;
  badge_text: string;
  title_prefix: string;
  highlight_text: string;
  subtitle: string;
  chip1_text: string;
  chip2_text: string;
  big_label_top: string;
  big_label_main: string;
  big_label_bottom: string;
  link_url: string;
  background_image: string;
  ends_at: string;
}

export const defaultSaleBanner: SaleBannerSettings = {
  is_active: true,
  badge_text: 'Mega Sale',
  title_prefix: 'Giảm đến',
  highlight_text: '50%',
  subtitle: 'Săn deal sốc mỗi ngày · Freeship đơn từ 299K',
  chip1_text: 'Flash Sale',
  chip2_text: 'Voucher 100K',
  big_label_top: 'Sale',
  big_label_main: '50%',
  big_label_bottom: 'Off',
  link_url: '',
  background_image: '',
  ends_at: '',
};

export function SaleBannerManager() {
  const [settings, setSettings] = useState<SaleBannerSettings>(defaultSaleBanner);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'sale_hero_banner')
        .maybeSingle();
      if (data?.value) {
        setSettings({ ...defaultSaleBanner, ...(data.value as unknown as SaleBannerSettings) });
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('settings').select('id').eq('key', 'sale_hero_banner').maybeSingle();
      if (existing) {
        await supabase.from('settings').update({ value: settings as never }).eq('key', 'sale_hero_banner');
      } else {
        await supabase.from('settings').insert([{ key: 'sale_hero_banner', value: settings as never }]);
      }
      toast.success('Đã lưu banner giảm giá');
    } catch {
      toast.error('Lỗi khi lưu');
    }
    setSaving(false);
  };

  const update = <K extends keyof SaleBannerSettings>(k: K, v: SaleBannerSettings[K]) =>
    setSettings((p) => ({ ...p, [k]: v }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Banner Giảm Giá (trang /products)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cấu hình nội dung banner sale hiển thị đầu trang sản phẩm.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Switch checked={settings.is_active} onCheckedChange={(c) => update('is_active', c)} id="sb_active" />
          <Label htmlFor="sb_active">Hiển thị banner</Label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Badge (góc trên)</Label>
            <Input value={settings.badge_text} onChange={(e) => update('badge_text', e.target.value)} placeholder="Mega Sale" />
          </div>
          <div>
            <Label>Link khi bấm vào (tuỳ chọn)</Label>
            <Input value={settings.link_url} onChange={(e) => update('link_url', e.target.value)} placeholder="/products?sale=1" />
          </div>
          <div>
            <Label>Tiêu đề trước</Label>
            <Input value={settings.title_prefix} onChange={(e) => update('title_prefix', e.target.value)} placeholder="Giảm đến" />
          </div>
          <div>
            <Label>Text nổi bật (% off)</Label>
            <Input value={settings.highlight_text} onChange={(e) => update('highlight_text', e.target.value)} placeholder="50%" />
          </div>
          <div className="md:col-span-2">
            <Label>Phụ đề</Label>
            <Input value={settings.subtitle} onChange={(e) => update('subtitle', e.target.value)} />
          </div>
          <div>
            <Label>Chip 1</Label>
            <Input value={settings.chip1_text} onChange={(e) => update('chip1_text', e.target.value)} />
          </div>
          <div>
            <Label>Chip 2</Label>
            <Input value={settings.chip2_text} onChange={(e) => update('chip2_text', e.target.value)} />
          </div>
          <div>
            <Label>Huy hiệu - dòng trên</Label>
            <Input value={settings.big_label_top} onChange={(e) => update('big_label_top', e.target.value)} />
          </div>
          <div>
            <Label>Huy hiệu - dòng chính</Label>
            <Input value={settings.big_label_main} onChange={(e) => update('big_label_main', e.target.value)} />
          </div>
          <div>
            <Label>Huy hiệu - dòng dưới</Label>
            <Input value={settings.big_label_bottom} onChange={(e) => update('big_label_bottom', e.target.value)} />
          </div>
        </div>

        <ImageUpload
          value={settings.background_image}
          onChange={(url) => update('background_image', url)}
          folder="sale-banner"
          label="Ảnh nền banner (tuỳ chọn - upload từ máy)"
        />

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Đang lưu...' : 'Lưu Banner Giảm Giá'}
        </Button>
      </CardContent>
    </Card>
  );
}
