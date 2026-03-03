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
import { Plus, Trash2, Move, Save, Sparkles, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import { useTheme, ThemeEvent } from '@/hooks/useTheme';

export interface CustomMascot {
  id: string;
  image_url: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-left' | 'center-right';
  size: number; // px
  offset_x: number; // %
  offset_y: number; // %
  pages: string[]; // ['all'] or ['/','products','/blog']
  persist_across_pages: boolean;
  animation: 'float' | 'bounce' | 'swing' | 'none';
  opacity: number;
  enabled: boolean;
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
  size: 80,
  offset_x: 5,
  offset_y: 10,
  pages: ['all'],
  persist_across_pages: true,
  animation: 'float',
  opacity: 85,
  enabled: true,
};

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
          Upload ảnh nhân vật theo mùa (ông già Noel, tuần lộc, bí ngô...) và tùy chỉnh vị trí, hiệu ứng
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

              {/* Image Upload */}
              <ImageUpload
                value={mascot.image_url}
                onChange={(url) => updateMascot(mascot.id, { image_url: url })}
                folder="mascots"
                label="Ảnh nhân vật (PNG trong suốt khuyến nghị)"
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Position */}
                <div>
                  <Label className="text-xs">Vị trí</Label>
                  <Select
                    value={mascot.position}
                    onValueChange={(v) => updateMascot(mascot.id, { position: v as CustomMascot['position'] })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSITIONS.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Animation */}
                <div>
                  <Label className="text-xs">Hiệu ứng</Label>
                  <Select
                    value={mascot.animation}
                    onValueChange={(v) => updateMascot(mascot.id, { animation: v as CustomMascot['animation'] })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANIMATIONS.map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Size */}
                <div>
                  <Label className="text-xs">Kích thước: {mascot.size}px</Label>
                  <Slider
                    className="mt-3"
                    min={40}
                    max={200}
                    step={5}
                    value={[mascot.size]}
                    onValueChange={([v]) => updateMascot(mascot.id, { size: v })}
                  />
                </div>

                {/* Opacity */}
                <div>
                  <Label className="text-xs">Độ trong suốt: {mascot.opacity}%</Label>
                  <Slider
                    className="mt-3"
                    min={20}
                    max={100}
                    step={5}
                    value={[mascot.opacity]}
                    onValueChange={([v]) => updateMascot(mascot.id, { opacity: v })}
                  />
                </div>
              </div>

              {/* Offset */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Dịch ngang: {mascot.offset_x}%</Label>
                  <Slider
                    className="mt-2"
                    min={0} max={40} step={1}
                    value={[mascot.offset_x]}
                    onValueChange={([v]) => updateMascot(mascot.id, { offset_x: v })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Dịch dọc: {mascot.offset_y}%</Label>
                  <Slider
                    className="mt-2"
                    min={0} max={40} step={1}
                    value={[mascot.offset_y]}
                    onValueChange={([v]) => updateMascot(mascot.id, { offset_y: v })}
                  />
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

              {/* Persist */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={mascot.persist_across_pages}
                  onCheckedChange={(c) => updateMascot(mascot.id, { persist_across_pages: c })}
                />
                <Label className="text-xs">Giữ nguyên khi chuyển trang (không reset animation)</Label>
              </div>

              {/* Preview */}
              {mascot.image_url && (
                <div className="bg-muted/50 rounded-lg p-4 relative h-32 overflow-hidden">
                  <p className="text-xs text-muted-foreground absolute top-2 left-2 flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Xem trước
                  </p>
                  <img
                    src={mascot.image_url}
                    alt="Mascot preview"
                    className={`absolute ${
                      mascot.animation === 'float' ? 'animate-bounce' :
                      mascot.animation === 'bounce' ? 'animate-bounce' :
                      mascot.animation === 'swing' ? 'animate-pulse' : ''
                    }`}
                    style={{
                      width: `${Math.min(mascot.size, 80)}px`,
                      height: `${Math.min(mascot.size, 80)}px`,
                      objectFit: 'contain',
                      opacity: mascot.opacity / 100,
                      ...(mascot.position.includes('right') ? { right: '10%' } : { left: '10%' }),
                      ...(mascot.position.includes('top') ? { top: '10%' } : 
                          mascot.position.includes('bottom') ? { bottom: '10%' } : { top: '35%' }),
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
