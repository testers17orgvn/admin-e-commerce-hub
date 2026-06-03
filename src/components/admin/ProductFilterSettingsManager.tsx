import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save, SlidersHorizontal, LayoutGrid, Rows, Columns } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  defaultProductFilterSettings,
  ProductFilterSettings,
  FilterLayout,
  FilterStyle,
  FilterAccent,
  ACCENT_CLASSES,
} from '@/hooks/useProductFilterSettings';

const LAYOUTS: { value: FilterLayout; label: string; icon: typeof Rows; desc: string }[] = [
  { value: 'vertical', label: 'Dọc (Sidebar)', icon: Columns, desc: 'Cột bên trái cho desktop' },
  { value: 'horizontal', label: 'Ngang (Thanh trên)', icon: Rows, desc: 'Thanh ngang phía trên grid' },
  { value: 'both', label: 'Cả hai', icon: LayoutGrid, desc: 'Cả sidebar + thanh ngang' },
];

const STYLES: { value: FilterStyle; label: string }[] = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
  { value: 'glass', label: 'Glass' },
  { value: 'neon', label: 'Neon' },
  { value: 'card', label: 'Card' },
];

const ACCENTS: FilterAccent[] = ['primary', 'rose', 'emerald', 'amber', 'violet', 'sky'];

export function ProductFilterSettingsManager() {
  const [s, setS] = useState<ProductFilterSettings>(defaultProductFilterSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('settings').select('value').eq('key', 'product_filter_settings').maybeSingle();
      if (data?.value) setS({ ...defaultProductFilterSettings, ...(data.value as unknown as ProductFilterSettings) });
    })();
  }, []);

  const upd = <K extends keyof ProductFilterSettings>(k: K, v: ProductFilterSettings[K]) =>
    setS(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('settings').select('id').eq('key', 'product_filter_settings').maybeSingle();
      if (existing) {
        await supabase.from('settings').update({ value: s as never }).eq('key', 'product_filter_settings');
      } else {
        await supabase.from('settings').insert([{ key: 'product_filter_settings', value: s as never }]);
      }
      toast.success('Đã lưu cấu hình bộ lọc');
    } catch {
      toast.error('Lỗi khi lưu');
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          Cấu hình bộ lọc /products
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tuỳ chỉnh giao diện hiển thị bộ lọc cho khách hàng (ngang, dọc, cả hai và mẫu thiết kế).
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Layout */}
        <div>
          <Label className="mb-3 block font-semibold">Kiểu hiển thị</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {LAYOUTS.map((l) => {
              const active = s.layout === l.value;
              return (
                <button
                  key={l.value}
                  onClick={() => upd('layout', l.value)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40'
                  )}
                >
                  <l.icon className={cn('h-5 w-5 mb-2', active ? 'text-primary' : 'text-muted-foreground')} />
                  <p className="font-medium text-sm">{l.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{l.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Style */}
        <div>
          <Label className="mb-3 block font-semibold">Mẫu giao diện</Label>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {STYLES.map((st) => {
              const active = s.style === st.value;
              return (
                <button
                  key={st.value}
                  onClick={() => upd('style', st.value)}
                  className={cn(
                    'p-3 rounded-lg border text-sm font-medium transition-all',
                    active
                      ? 'border-primary bg-primary text-primary-foreground shadow'
                      : 'border-border hover:border-primary/40 hover:bg-muted'
                  )}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent */}
        <div>
          <Label className="mb-3 block font-semibold">Màu nhấn</Label>
          <div className="flex gap-2 flex-wrap">
            {ACCENTS.map((a) => {
              const active = s.accent === a;
              return (
                <button
                  key={a}
                  onClick={() => upd('accent', a)}
                  className={cn(
                    'h-10 w-10 rounded-full transition-all border-2',
                    ACCENT_CLASSES[a].bg,
                    active ? 'ring-2 ring-offset-2 ring-foreground/40 scale-110' : 'border-transparent'
                  )}
                  title={a}
                />
              );
            })}
          </div>
        </div>

        {/* Toggles */}
        <div>
          <Label className="mb-3 block font-semibold">Mục hiển thị</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { k: 'sticky', label: 'Sidebar dính (sticky)' },
              { k: 'show_price', label: 'Khoảng giá' },
              { k: 'show_colors', label: 'Màu sắc' },
              { k: 'show_sizes', label: 'Kích thước' },
              { k: 'show_tags', label: 'Tags' },
              { k: 'show_special', label: 'Lọc đặc biệt (Hot, Giảm giá)' },
              { k: 'show_active_chips', label: 'Hiển thị chip lọc đang chọn' },
            ].map((t) => (
              <div key={t.k} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <Label htmlFor={t.k} className="cursor-pointer text-sm">{t.label}</Label>
                <Switch
                  id={t.k}
                  checked={!!(s as unknown as Record<string, boolean>)[t.k]}
                  onCheckedChange={(c) => upd(t.k as keyof ProductFilterSettings, c as never)}
                />
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Đang lưu...' : 'Lưu cấu hình bộ lọc'}
        </Button>
      </CardContent>
    </Card>
  );
}
