import { useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Monitor, Tablet, Smartphone, RotateCw, Camera, Images } from 'lucide-react';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import { useRef } from 'react';
import { toast } from '@/hooks/use-toast';

type Device = 'desktop' | 'tablet' | 'mobile';
type Orientation = 'portrait' | 'landscape';

const DEVICE_SIZES: Record<Device, { p: [number, number]; l: [number, number] }> = {
  desktop: { p: [1440, 900], l: [1440, 900] },
  tablet: { p: [768, 1024], l: [1024, 768] },
  mobile: { p: [390, 844], l: [844, 390] },
};

const SAMPLE_IMAGES = [
  { label: 'Ảnh ngang 16:9', url: 'https://picsum.photos/seed/land/1600/900', ratio: 'aspect-video' },
  { label: 'Ảnh dọc 9:16', url: 'https://picsum.photos/seed/port/900/1600', ratio: 'aspect-[9/16]' },
  { label: 'Ảnh vuông 1:1', url: 'https://picsum.photos/seed/sq/1000/1000', ratio: 'aspect-square' },
  { label: 'Ảnh siêu rộng 21:9', url: 'https://picsum.photos/seed/ultra/2100/900', ratio: 'aspect-[21/9]' },
  { label: 'Ảnh cực cao 3:5', url: 'https://picsum.photos/seed/tall/900/1500', ratio: 'aspect-[3/5]' },
  { label: 'Ảnh nhỏ 4:3', url: 'https://picsum.photos/seed/small/800/600', ratio: 'aspect-[4/3]' },
];

const LONG_TEXT =
  'ThisIsAnExtremelyLongUnbreakableStringToTestOverflowWrappingBehaviorOnAllScreenSizesIncludingTinyMobileDevicesAndRotatedTabletsSoThatWeCanBeConfidentTheLayoutNeverBlowsOutHorizontally';

export default function LayoutTest() {
  const [device, setDevice] = useState<Device>('mobile');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [capturing, setCapturing] = useState(false);

  const [w, h] = DEVICE_SIZES[device][orientation === 'portrait' ? 'p' : 'l'];
  const [previewUrl, setPreviewUrl] = useState('/');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const waitFor = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const captureIframe = async (label: string) => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const win = iframe?.contentWindow;
    if (!iframe || !doc || !win || !doc.body) {
      toast({ title: 'Không chụp được', description: 'Preview chưa sẵn sàng.', variant: 'destructive' });
      return null;
    }
    try {
      const canvas = await html2canvas(doc.body, {
        width: w,
        height: h,
        windowWidth: w,
        windowHeight: h,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 1,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      const safeRoute = previewUrl.replace(/\//g, '_') || '_root';
      a.download = `layout-test${safeRoute}-${label}.png`;
      a.href = url;
      a.click();
      return url;
    } catch (e) {
      console.error(e);
      toast({ title: 'Lỗi chụp ảnh', description: String(e), variant: 'destructive' });
      return null;
    }
  };

  const captureCurrent = async () => {
    setCapturing(true);
    await captureIframe(`${device}-${orientation}-${w}x${h}`);
    setCapturing(false);
    toast({ title: 'Đã tải ảnh', description: `${device} · ${orientation} · ${w}×${h}` });
  };

  const captureAll = async () => {
    setCapturing(true);
    const combos: Array<[Device, Orientation]> = [
      ['desktop', 'landscape'],
      ['tablet', 'portrait'],
      ['tablet', 'landscape'],
      ['mobile', 'portrait'],
      ['mobile', 'landscape'],
    ];
    for (const [d, o] of combos) {
      setDevice(d);
      setOrientation(o);
      // wait for iframe layout to settle
      await waitFor(700);
      const [cw, ch] = DEVICE_SIZES[d][o === 'portrait' ? 'p' : 'l'];
      const iframe = iframeRef.current;
      const doc = iframe?.contentDocument;
      if (!iframe || !doc?.body) continue;
      try {
        const canvas = await html2canvas(doc.body, {
          width: cw,
          height: ch,
          windowWidth: cw,
          windowHeight: ch,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          scale: 1,
        });
        const a = document.createElement('a');
        const safeRoute = previewUrl.replace(/\//g, '_') || '_root';
        a.download = `layout-test${safeRoute}-${d}-${o}-${cw}x${ch}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        await waitFor(250);
      } catch (e) {
        console.error(e);
      }
    }
    setCapturing(false);
    toast({ title: 'Đã chụp tất cả', description: 'Đã tải ảnh cho mọi chế độ.' });
  };


  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Layout Test</h1>
            <p className="text-sm text-muted-foreground">
              Kiểm tra ảnh/video ở nhiều kích thước & xoay ngang/dọc trước khi lưu.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-lg border overflow-hidden">
              {(['desktop', 'tablet', 'mobile'] as Device[]).map((d) => {
                const Icon = d === 'desktop' ? Monitor : d === 'tablet' ? Tablet : Smartphone;
                return (
                  <button
                    key={d}
                    onClick={() => setDevice(d)}
                    className={cn(
                      'px-3 py-2 text-sm flex items-center gap-1.5 transition',
                      device === d ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="capitalize hidden sm:inline">{d}</span>
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOrientation((o) => (o === 'portrait' ? 'landscape' : 'portrait'))}
            >
              <RotateCw className="h-4 w-4 mr-1.5" />
              {orientation === 'portrait' ? 'Dọc' : 'Ngang'}
            </Button>
            <Button size="sm" onClick={captureCurrent} disabled={capturing}>
              <Camera className="h-4 w-4 mr-1.5" />
              Chụp ảnh
            </Button>
            <Button size="sm" variant="secondary" onClick={captureAll} disabled={capturing}>
              <Images className="h-4 w-4 mr-1.5" />
              Chụp tất cả
            </Button>
          </div>
        </div>

        <Card className="p-3 md:p-6 bg-muted/30">
          <div className="flex flex-wrap gap-2 mb-3">
            {['/', '/products', '/cart', '/blog', '/contact'].map((u) => (
              <Button
                key={u}
                variant={previewUrl === u ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewUrl(u)}
              >
                {u}
              </Button>
            ))}
          </div>
          <div className="overflow-auto flex justify-center">
            <div
              className="bg-background border-8 border-foreground/80 rounded-[2rem] shadow-2xl overflow-hidden transition-all"
              style={{ width: w, height: h, flexShrink: 0 }}
            >
              <iframe
                ref={iframeRef}
                title="Layout Preview"
                src={previewUrl}
                className="border-0 bg-white"
                style={{ width: w, height: h }}
              />
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            {device} · {orientation} · {w}×{h}px — cuộn ngang nếu khung lớn hơn màn hình
          </p>
        </Card>


        <Tabs defaultValue="images">
          <TabsList>
            <TabsTrigger value="images">Ảnh</TabsTrigger>
            <TabsTrigger value="videos">Video</TabsTrigger>
            <TabsTrigger value="text">Text tràn</TabsTrigger>
            <TabsTrigger value="grids">Grid/Flex</TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SAMPLE_IMAGES.map((img) => (
                <Card key={img.label} className="overflow-hidden">
                  <div className={cn('w-full bg-muted overflow-hidden', img.ratio)}>
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-3 text-sm font-medium">{img.label}</div>
                </Card>
              ))}
            </div>

            <Card className="p-4 space-y-2">
              <h3 className="font-semibold text-sm">Ảnh raw không có wrapper (test overflow)</h3>
              <img src="https://picsum.photos/seed/raw/3000/1200" alt="raw" />
            </Card>

            <Card className="overflow-hidden">
              <div
                className="h-64 w-full bg-cover bg-center"
                style={{ backgroundImage: 'url(https://picsum.photos/seed/bg/2000/1000)' }}
              />
              <div className="p-3 text-sm">Background image</div>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            <Card className="overflow-hidden">
              <div className="aspect-video bg-black">
                <video
                  src="https://cdn.pixabay.com/video/2020/09/07/49375-459838754_large.mp4"
                  className="w-full h-full object-cover"
                  controls
                  muted
                />
              </div>
              <div className="p-3 text-sm">HTML5 video 16:9</div>
            </Card>

            <Card className="overflow-hidden">
              <div className="aspect-video">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="YouTube"
                  allowFullScreen
                />
              </div>
              <div className="p-3 text-sm">YouTube iframe</div>
            </Card>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-2">Chuỗi không có dấu cách</h3>
              <p>{LONG_TEXT}</p>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-2">URL dài</h3>
              <a href="#" className="text-accent underline">
                https://store.vsm.org.vn/products/day-la-mot-slug-cuc-ky-dai-de-kiem-tra-overflow-tren-mobile-va-khi-xoay-ngang-man-hinh-thiet-bi
              </a>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-2">Bảng rộng</h3>
              <table className="w-full">
                <thead>
                  <tr>{Array.from({ length: 8 }).map((_, i) => <th key={i} className="p-2 border">Cột {i + 1}</th>)}</tr>
                </thead>
                <tbody>
                  <tr>{Array.from({ length: 8 }).map((_, i) => <td key={i} className="p-2 border">Data {i + 1} rất dài</td>)}</tr>
                </tbody>
              </table>
            </Card>
          </TabsContent>

          <TabsContent value="grids" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-2">Grid 2/3/4 cột responsive</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-muted rounded flex items-center justify-center text-sm">
                    {i + 1}
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-2">Flex wrap</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 20 }).map((_, i) => (
                  <span key={i} className="px-3 py-1 bg-muted rounded-full text-sm">Tag {i + 1}</span>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
