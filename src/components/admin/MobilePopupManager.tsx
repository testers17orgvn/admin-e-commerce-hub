import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from './ImageUpload';
import { Smartphone, X, Eye, Save, Sparkles, Timer, MousePointerClick } from 'lucide-react';
import { toast } from 'sonner';

interface PopupConfig {
  enabled: boolean;
  title: string;
  message: string;
  image_url: string;
  button_text: string;
  button_url: string;
  show_close_button: boolean;
  close_button_delay: number; // seconds before close button appears
  close_button_style: 'icon' | 'text' | 'icon_text';
  close_button_position: 'top-right' | 'top-left' | 'bottom-center';
  background_color: string;
  text_color: string;
  animation: 'slide-up' | 'fade' | 'scale' | 'slide-down';
  show_frequency: 'every_visit' | 'once_per_day' | 'once_per_session' | 'once';
  delay_seconds: number;
  overlay_dismiss: boolean;
  mobile_only: boolean;
}

const defaultConfig: PopupConfig = {
  enabled: false,
  title: 'Chào mừng bạn! 🎉',
  message: 'Nhận ngay ưu đãi đặc biệt cho đơn hàng đầu tiên.',
  image_url: '',
  button_text: 'Xem ngay',
  button_url: '/products',
  show_close_button: true,
  close_button_delay: 0,
  close_button_style: 'icon',
  close_button_position: 'top-right',
  background_color: '#ffffff',
  text_color: '#000000',
  animation: 'slide-up',
  show_frequency: 'once_per_session',
  delay_seconds: 3,
  overlay_dismiss: true,
  mobile_only: true,
};

export function MobilePopupManager() {
  const [config, setConfig] = useState<PopupConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCloseVisible, setPreviewCloseVisible] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'mobile_popup')
      .maybeSingle();
    if (data?.value) {
      setConfig({ ...defaultConfig, ...(data.value as object) });
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'mobile_popup')
      .maybeSingle();

    const payload = { key: 'mobile_popup', value: config as unknown as Record<string, unknown> };
    if (existing) {
      await supabase.from('settings').update({ value: payload.value as never }).eq('key', 'mobile_popup');
    } else {
      await supabase.from('settings').insert([payload as never]);
    }
    toast.success('Đã lưu cấu hình popup');
    setSaving(false);
  };

  const update = <K extends keyof PopupConfig>(key: K, value: PopupConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const closePositionClasses: Record<string, string> = {
    'top-right': 'top-3 right-3',
    'top-left': 'top-3 left-3',
    'bottom-center': 'bottom-3 left-1/2 -translate-x-1/2',
  };

  const animationClasses: Record<string, string> = {
    'slide-up': 'animate-in slide-in-from-bottom duration-500',
    'slide-down': 'animate-in slide-in-from-top duration-500',
    'fade': 'animate-in fade-in duration-500',
    'scale': 'animate-in zoom-in-95 duration-500',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-accent" />
            Popup Mobile
          </CardTitle>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-1" /> {showPreview ? 'Ẩn' : 'Xem trước'}
            </Button>
            <Button size="sm" onClick={saveConfig} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div>
            <Label className="text-base font-semibold">Bật Popup</Label>
            <p className="text-sm text-muted-foreground">Hiển thị popup khi người dùng truy cập trên mobile</p>
          </div>
          <Switch checked={config.enabled} onCheckedChange={v => update('enabled', v)} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Content */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Nội dung
            </h4>
            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input value={config.title} onChange={e => update('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nội dung</Label>
              <Textarea value={config.message} onChange={e => update('message', e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Hình ảnh</Label>
              <ImageUpload value={config.image_url} onChange={url => update('image_url', url)} folder="popup" label="Tải ảnh popup" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Text nút CTA</Label>
                <Input value={config.button_text} onChange={e => update('button_text', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Link nút CTA</Label>
                <Input value={config.button_url} onChange={e => update('button_url', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" /> Nút đóng & Hiển thị
            </h4>

            <div className="flex items-center justify-between">
              <Label>Hiển thị nút đóng</Label>
              <Switch checked={config.show_close_button} onCheckedChange={v => update('show_close_button', v)} />
            </div>

            {config.show_close_button && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Timer className="h-3 w-3" /> Delay nút đóng (giây)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={config.close_button_delay}
                    onChange={e => update('close_button_delay', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">0 = hiện ngay, max 30s</p>
                </div>

                <div className="space-y-2">
                  <Label>Kiểu nút đóng</Label>
                  <Select value={config.close_button_style} onValueChange={v => update('close_button_style', v as PopupConfig['close_button_style'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="icon">✕ Icon</SelectItem>
                      <SelectItem value="text">Text "Đóng"</SelectItem>
                      <SelectItem value="icon_text">✕ Icon + Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Vị trí nút đóng</Label>
                  <Select value={config.close_button_position} onValueChange={v => update('close_button_position', v as PopupConfig['close_button_position'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-right">Trên phải</SelectItem>
                      <SelectItem value="top-left">Trên trái</SelectItem>
                      <SelectItem value="bottom-center">Dưới giữa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Hiệu ứng xuất hiện</Label>
              <Select value={config.animation} onValueChange={v => update('animation', v as PopupConfig['animation'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="slide-up">↑ Trượt lên</SelectItem>
                  <SelectItem value="slide-down">↓ Trượt xuống</SelectItem>
                  <SelectItem value="fade">Mờ dần</SelectItem>
                  <SelectItem value="scale">Phóng to</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tần suất hiển thị</Label>
              <Select value={config.show_frequency} onValueChange={v => update('show_frequency', v as PopupConfig['show_frequency'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="every_visit">Mỗi lần truy cập</SelectItem>
                  <SelectItem value="once_per_session">1 lần / phiên</SelectItem>
                  <SelectItem value="once_per_day">1 lần / ngày</SelectItem>
                  <SelectItem value="once">Chỉ 1 lần duy nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Delay hiển thị (giây)</Label>
              <Input
                type="number"
                min={0}
                max={60}
                value={config.delay_seconds}
                onChange={e => update('delay_seconds', Number(e.target.value))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Đóng khi bấm overlay</Label>
              <Switch checked={config.overlay_dismiss} onCheckedChange={v => update('overlay_dismiss', v)} />
            </div>

            <div className="flex items-center justify-between">
              <Label>Chỉ hiện trên mobile</Label>
              <Switch checked={config.mobile_only} onCheckedChange={v => update('mobile_only', v)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Màu nền</Label>
                <div className="flex gap-2">
                  <input type="color" value={config.background_color} onChange={e => update('background_color', e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                  <Input value={config.background_color} onChange={e => update('background_color', e.target.value)} className="font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Màu chữ</Label>
                <div className="flex gap-2">
                  <input type="color" value={config.text_color} onChange={e => update('text_color', e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                  <Input value={config.text_color} onChange={e => update('text_color', e.target.value)} className="font-mono" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Xem trước trên điện thoại</h4>
            <div className="mx-auto w-[320px] h-[568px] bg-black rounded-[2.5rem] p-3 shadow-2xl">
              <div className="w-full h-full bg-muted rounded-[2rem] overflow-hidden relative">
                {/* Status bar */}
                <div className="h-8 bg-background flex items-center justify-between px-6 text-[10px]">
                  <span>9:41</span>
                  <div className="w-20 h-5 bg-foreground/10 rounded-full mx-auto" />
                  <span>100%</span>
                </div>
                {/* Page content behind */}
                <div className="p-4 space-y-3 opacity-30">
                  <div className="h-6 w-3/4 bg-foreground/20 rounded" />
                  <div className="h-32 bg-foreground/10 rounded-lg" />
                  <div className="h-4 w-full bg-foreground/10 rounded" />
                  <div className="h-4 w-2/3 bg-foreground/10 rounded" />
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 flex items-end justify-center pb-8">
                  {/* Popup card */}
                  <div
                    className={`relative mx-4 w-full rounded-2xl p-5 shadow-xl ${animationClasses[config.animation]}`}
                    style={{ backgroundColor: config.background_color, color: config.text_color }}
                  >
                    {/* Close button */}
                    {config.show_close_button && previewCloseVisible && (
                      <button
                        className={`absolute ${closePositionClasses[config.close_button_position]} z-10 flex items-center gap-1 rounded-full bg-black/10 px-2 py-1 text-xs backdrop-blur-sm transition-all hover:bg-black/20`}
                        style={{ color: config.text_color }}
                      >
                        {(config.close_button_style === 'icon' || config.close_button_style === 'icon_text') && <X className="h-3 w-3" />}
                        {(config.close_button_style === 'text' || config.close_button_style === 'icon_text') && <span>Đóng</span>}
                      </button>
                    )}

                    {config.image_url && (
                      <img src={config.image_url} alt="Popup" className="w-full h-28 object-cover rounded-xl mb-3" />
                    )}
                    <h3 className="text-lg font-bold mb-1">{config.title}</h3>
                    <p className="text-sm opacity-80 mb-4">{config.message}</p>
                    <button className="w-full py-2.5 rounded-xl text-sm font-semibold bg-accent text-accent-foreground">
                      {config.button_text}
                    </button>

                    {config.close_button_delay > 0 && (
                      <p className="text-[10px] text-center mt-2 opacity-50">
                        Nút đóng xuất hiện sau {config.close_button_delay}s
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
