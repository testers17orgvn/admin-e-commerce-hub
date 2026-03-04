import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Plus, Trash2, Save, Sparkles, Eye, Link2, ExternalLink } from 'lucide-react';
import { ANIM_MAP } from '@/components/effects/CustomMascotRenderer';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import { useTheme } from '@/hooks/useTheme';

export interface CustomMascot {
  id: string;
  image_url: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-left' | 'center-right';
  size: number;
  offset_x: number;
  offset_y: number;
  pages: string[];
  persist_across_pages: boolean;
  animation: 'float' | 'bounce' | 'swing' | 'shake' | 'spin' | 'pulse' | 'tada' | 'wiggle' | 'none';
  opacity: number;
  enabled: boolean;
  link_url?: string;
  link_target?: '_self' | '_blank';
}

const POSITIONS = [
  { value: 'top-left', label: 'Trên trái' },
  { value: 'top-right', label: 'Trên phải' },
  { value: 'center-left', label: 'Giữa trái' },
  { value: 'center-right', label: 'Giữa phải' },
  { value: 'bottom-left', label: 'Dưới trái' },
  { value: 'bottom-right', label: 'Dưới phải' },
];

const ANIMATIONS = [
  { value: 'float', label: '🪂 Bay lơ lửng' },
  { value: 'bounce', label: '⬆️ Nảy' },
  { value: 'swing', label: '🔄 Lắc lư' },
  { value: 'shake', label: '📳 Rung lắc' },
  { value: 'spin', label: '🌀 Xoay tròn' },
  { value: 'pulse', label: '💓 Nhịp đập' },
  { value: 'tada', label: '🎉 Tada' },
  { value: 'wiggle', label: '🐛 Lúc lắc' },
  { value: 'none', label: '🚫 Không' },
];

const PAGE_OPTIONS = [
  { value: 'all', label: 'Tất cả trang' },
  { value: '/', label: 'Trang chủ' },
  { value: '/products', label: 'Sản phẩm' },
  { value: '/blog', label: 'Blog' },
  { value: '/cart', label: 'Giỏ hàng' },
  { value: '/contact', label: 'Liên hệ' },
];

const defaultMascot: Omit<CustomMascot, 'id'> = {
  image_url: '',
  position: 'bottom-right',
  size: 120,
  offset_x: 5,
  offset_y: 10,
  pages: ['all'],
  persist_across_pages: true,
  animation: 'float',
  opacity: 85,
  enabled: true,
  link_url: '',
  link_target: '_self',
};

// Mini preview showing a page layout with the mascot positioned
function MascotPagePreview({ mascot }: { mascot: CustomMascot }) {
  if (!mascot.image_url) return null;

  const getPreviewPos = (): React.CSSProperties => {
    const pos: React.CSSProperties = { position: 'absolute' };
    const ox = `${mascot.offset_x}%`;
    const oy = `${mascot.offset_y}%`;
    if (mascot.position.includes('left')) pos.left = ox;
    if (mascot.position.includes('right')) pos.right = ox;
    if (mascot.position.includes('top') && !mascot.position.includes('center')) pos.top = oy;
    if (mascot.position.includes('bottom')) pos.bottom = oy;
    if (mascot.position.includes('center')) { pos.top = '50%'; pos.transform = 'translateY(-50%)'; }
    return pos;
  };

  // Scale preview size proportionally (preview is ~220px tall, real page ~900px)
  const previewScale = 220 / 900;
  const previewSize = Math.max(mascot.size * previewScale, 20);

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 border-b">
        <div className="w-2 h-2 rounded-full bg-destructive/60" />
        <div className="w-2 h-2 rounded-full bg-accent/60" />
        <div className="w-2 h-2 rounded-full bg-primary/60" />
        <span className="text-[10px] text-muted-foreground ml-2 flex items-center gap-1">
          <Eye className="h-3 w-3" /> Preview trực quan — Kích thước thực: {mascot.size}px
        </span>
      </div>
      <div className="relative" style={{ height: 220 }}>
        <div className="absolute inset-0 p-3 space-y-2">
          <div className="h-3 w-1/3 bg-muted rounded" />
          <div className="h-10 w-full bg-muted/40 rounded" />
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="h-12 bg-muted/30 rounded" />
            <div className="h-12 bg-muted/30 rounded" />
            <div className="h-12 bg-muted/30 rounded" />
          </div>
          <div className="h-3 w-2/3 bg-muted/20 rounded mt-2" />
          <div className="h-3 w-1/2 bg-muted/20 rounded" />
        </div>
        <img
          src={mascot.image_url}
          alt="Preview"
          style={{
            ...getPreviewPos(),
            width: `${previewSize}px`,
            height: `${previewSize}px`,
            objectFit: 'contain',
            opacity: mascot.opacity / 100,
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))',
            zIndex: 10,
            animation: mascot.animation !== 'none' ? (ANIM_MAP[mascot.animation] || undefined) : undefined,
          }}
        />
      </div>
    </div>
  );
}

export function CustomMascotManager() {
  const { currentTheme } = useTheme();
  const [mascots, setMascots] = useState<CustomMascot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMascots();
  }, [currentTheme]);

  const loadMascots = async () => {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', `custom_mascots_${currentTheme}`)
      .maybeSingle();

    if (data?.value && Array.isArray(data.value)) {
      setMascots(data.value as unknown as CustomMascot[]);
    } else {
      setMascots([]);
    }
    setLoading(false);
  };

  const saveMascots = async () => {
    setSaving(true);
    const key = `custom_mascots_${currentTheme}`;
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', key)
      .maybeSingle();

    if (existing) {
      await supabase.from('settings').update({ value: mascots as never }).eq('key', key);
    } else {
      await supabase.from('settings').insert([{ key, value: mascots as never }]);
    }
    setSaving(false);
    toast.success('Đã lưu nhân vật tùy chỉnh');
  };

  const addMascot = () => {
    setMascots(prev => [...prev, { ...defaultMascot, id: crypto.randomUUID() }]);
  };

  const updateMascot = (id: string, updates: Partial<CustomMascot>) => {
    setMascots(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeMascot = (id: string) => {
    setMascots(prev => prev.filter(m => m.id !== id));
  };

  const togglePage = (mascotId: string, page: string) => {
    setMascots(prev => prev.map(m => {
      if (m.id !== mascotId) return m;
      if (page === 'all') return { ...m, pages: ['all'] };
      const pages = m.pages.filter(p => p !== 'all');
      return {
        ...m,
        pages: pages.includes(page) ? pages.filter(p => p !== page) : [...pages, page],
      };
    }));
  };

  if (loading) return <div className="animate-pulse h-32 bg-muted rounded-lg" />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Nhân Vật Tùy Chỉnh
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addMascot}>
              <Plus className="h-4 w-4 mr-1" /> Thêm nhân vật
            </Button>
            <Button size="sm" onClick={saveMascots} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload ảnh nhân vật theo mùa và tùy chỉnh vị trí, hiệu ứng, liên kết
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {mascots.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Chưa có nhân vật nào. Nhấn "Thêm nhân vật" để bắt đầu!</p>
          </div>
        )}

        {mascots.map((mascot, index) => (
          <Card key={mascot.id} className="border-2">
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-start justify-between">
                <Badge variant="secondary">Nhân vật #{index + 1}</Badge>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={mascot.enabled}
                      onCheckedChange={(c) => updateMascot(mascot.id, { enabled: c })}
                    />
                    <Label className="text-xs">{mascot.enabled ? 'Bật' : 'Tắt'}</Label>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeMascot(mascot.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <ImageUpload
                value={mascot.image_url}
                onChange={(url) => updateMascot(mascot.id, { image_url: url })}
                folder="mascots"
                label="Ảnh nhân vật (PNG trong suốt khuyến nghị)"
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">Vị trí</Label>
                  <Select
                    value={mascot.position}
                    onValueChange={(v) => updateMascot(mascot.id, { position: v as CustomMascot['position'] })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Hiệu ứng</Label>
                  <Select
                    value={mascot.animation}
                    onValueChange={(v) => updateMascot(mascot.id, { animation: v as CustomMascot['animation'] })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ANIMATIONS.map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Kích thước: {mascot.size}px</Label>
                  <Slider
                    className="mt-3"
                    min={30} max={600} step={5}
                    value={[mascot.size]}
                    onValueChange={([v]) => updateMascot(mascot.id, { size: v })}
                  />
                </div>

                <div>
                  <Label className="text-xs">Độ trong suốt: {mascot.opacity}%</Label>
                  <Slider
                    className="mt-3"
                    min={20} max={100} step={5}
                    value={[mascot.opacity]}
                    onValueChange={([v]) => updateMascot(mascot.id, { opacity: v })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Dịch ngang: {mascot.offset_x}%</Label>
                  <Slider className="mt-2" min={0} max={40} step={1}
                    value={[mascot.offset_x]}
                    onValueChange={([v]) => updateMascot(mascot.id, { offset_x: v })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Dịch dọc: {mascot.offset_y}%</Label>
                  <Slider className="mt-2" min={0} max={40} step={1}
                    value={[mascot.offset_y]}
                    onValueChange={([v]) => updateMascot(mascot.id, { offset_y: v })}
                  />
                </div>
              </div>

              {/* Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Link2 className="h-3 w-3" /> Liên kết khi nhấn vào
                  </Label>
                  <Input
                    className="mt-1"
                    placeholder="/products hoặc https://example.com"
                    value={mascot.link_url || ''}
                    onChange={(e) => updateMascot(mascot.id, { link_url: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Mở liên kết
                  </Label>
                  <Select
                    value={mascot.link_target || '_self'}
                    onValueChange={(v) => updateMascot(mascot.id, { link_target: v as '_self' | '_blank' })}
                  >
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_self">Cùng trang</SelectItem>
                      <SelectItem value="_blank">Tab mới</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Pages */}
              <div>
                <Label className="text-xs mb-2 block">Hiển thị ở trang:</Label>
                <div className="flex flex-wrap gap-2">
                  {PAGE_OPTIONS.map(opt => (
                    <Badge
                      key={opt.value}
                      variant={mascot.pages.includes(opt.value) ? 'default' : 'outline'}
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => togglePage(mascot.id, opt.value)}
                    >
                      {opt.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={mascot.persist_across_pages}
                  onCheckedChange={(c) => updateMascot(mascot.id, { persist_across_pages: c })}
                />
                <Label className="text-xs">Giữ nguyên khi chuyển trang (không reset animation)</Label>
              </div>

              {/* Page-layout preview */}
              <MascotPagePreview mascot={mascot} />
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
