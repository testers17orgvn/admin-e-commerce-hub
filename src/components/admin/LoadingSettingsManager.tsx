import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Loader2, Eye, Monitor, Smartphone, X } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from './ImageUpload';
import { AppLoader } from '@/components/loading/AppLoader';
import { useLoadingSettings, LoadingSettings, LoadingEffect } from '@/hooks/useLoadingSettings';

const EFFECTS: { value: LoadingEffect; label: string }[] = [
  { value: 'logo-breath', label: 'Logo hô hấp' },
  { value: 'spinner', label: 'Vòng xoay' },
  { value: 'pulse', label: 'Xung nhịp' },
  { value: 'dots', label: 'Chấm nhảy' },
  { value: 'wave', label: 'Sóng' },
  { value: 'particles', label: 'Hạt bay' },
  { value: 'progress-bar', label: 'Chỉ thanh tiến trình' },
];

export function LoadingSettingsManager() {
  const { settings, save } = useLoadingSettings();
  const [local, setLocal] = useState<LoadingSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<null | 'desktop' | 'mobile'>(null);


  useEffect(() => setLocal(settings), [settings]);

  const update = <K extends keyof LoadingSettings>(k: K, v: LoadingSettings[K]) =>
    setLocal((s) => ({ ...s, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await save(local);
      toast.success('Đã lưu cài đặt trang loading');
    } catch {
      toast.error('Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5" /> Trang Loading
              </CardTitle>
              <CardDescription>
                Tùy chỉnh giao diện màn hình chờ khi tải trang, chuyển route, và khi mở app.
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setPreviewDevice('desktop')}>
                <Monitor className="h-4 w-4 mr-1" /> Fullscreen Desktop
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPreviewDevice('mobile')}>
                <Smartphone className="h-4 w-4 mr-1" /> Fullscreen Mobile
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="loading-enabled">Bật loading tùy chỉnh</Label>
              <Switch
                id="loading-enabled"
                checked={local.enabled}
                onCheckedChange={(v) => update('enabled', v)}
              />
            </div>

            <div>
              <Label>Logo hiển thị</Label>
              <ImageUpload
                value={local.logo_url}
                onChange={(url) => update('logo_url', url)}
                folder="loading"
                label="Tải logo (PNG trong suốt tối ưu)"
              />
            </div>

            <div>
              <Label>Tagline</Label>
              <Input
                value={local.tagline}
                onChange={(e) => update('tagline', e.target.value)}
                placeholder="Đang tải..."
              />
              <div className="flex items-center gap-2 mt-2">
                <Switch
                  checked={local.show_tagline}
                  onCheckedChange={(v) => update('show_tagline', v)}
                />
                <span className="text-sm text-muted-foreground">Hiển thị tagline</span>
              </div>
            </div>

            <div>
              <Label>Hiệu ứng</Label>
              <Select value={local.effect} onValueChange={(v) => update('effect', v as LoadingEffect)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EFFECTS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tốc độ animation ({local.speed.toFixed(1)}x)</Label>
              <Slider
                min={0.3}
                max={3}
                step={0.1}
                value={[local.speed]}
                onValueChange={([v]) => update('speed', v)}
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Thanh tiến trình</Label>
              <Switch
                checked={local.show_progress}
                onCheckedChange={(v) => update('show_progress', v)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <ColorField label="Accent" value={local.accent_color} onChange={(v) => update('accent_color', v)} />
              <ColorField label="Nền trên" value={local.gradient_from} onChange={(v) => update('gradient_from', v)} />
              <ColorField label="Nền dưới" value={local.gradient_to} onChange={(v) => update('gradient_to', v)} />
            </div>

            <div className="rounded-2xl overflow-hidden border h-[380px] relative">
              <AppLoader settings={local} fullScreen={false} className="!min-h-full !h-full" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Xem trước trực tiếp — nhấn "Xem trước" để mở toàn màn hình.
            </p>
          </div>
        </CardContent>
      </Card>

      {previewDevice && (
        <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4">
          {previewDevice === 'desktop' ? (
            <div className="relative w-full h-full">
              <AppLoader settings={local} fullScreen={false} className="!min-h-full !h-full w-full" />
            </div>
          ) : (
            <div
              className="relative rounded-[2.5rem] overflow-hidden border-[10px] border-neutral-900 shadow-2xl bg-black"
              style={{ width: 390, height: 'min(844px, 90vh)', maxWidth: '95vw' }}
            >
              <AppLoader settings={local} fullScreen={false} className="!min-h-full !h-full w-full" />
            </div>
          )}
          <div className="fixed top-4 right-4 z-[10001] flex gap-2">
            <div className="flex rounded-full bg-white/10 backdrop-blur p-1">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 ${previewDevice === 'desktop' ? 'bg-white text-black' : 'text-white'}`}
              >
                <Monitor className="h-3.5 w-3.5" /> Desktop
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 ${previewDevice === 'mobile' ? 'bg-white text-black' : 'text-white'}`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Mobile
              </button>
            </div>
            <button
              className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur text-white text-xs flex items-center gap-1"
              onClick={() => setPreviewDevice(null)}
            >
              <X className="h-3.5 w-3.5" /> Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1 mt-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 rounded border cursor-pointer"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 text-xs" />
      </div>
    </div>
  );
}
