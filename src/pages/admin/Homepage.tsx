import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Layout, Sparkles, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface HomepageSettings {
  hero_title?: string;
  hero_subtitle?: string;
  hero_button_text?: string;
  hero_button_link?: string;
  hero_image?: string;
  featured_title?: string;
  featured_subtitle?: string;
  categories_title?: string;
  categories_subtitle?: string;
  newsletter_title?: string;
  newsletter_subtitle?: string;
  about_title?: string;
  about_description?: string;
  about_image?: string;
}

export default function AdminHomepage() {
  const [settings, setSettings] = useState<HomepageSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const settingsMap: HomepageSettings = {};
      data.forEach((item: { key: string; value: unknown }) => {
        settingsMap[item.key as keyof HomepageSettings] = item.value as string;
      });
      setSettings(settingsMap);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const saveSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from('settings').select('id').eq('key', key).maybeSingle();
    
    if (existing) {
      await supabase.from('settings').update({ value }).eq('key', key);
    } else {
      await supabase.from('settings').insert({ key, value });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(settings);
      await Promise.all(entries.map(([key, value]) => saveSetting(key, value || '')));
      toast.success('Lưu cài đặt trang chủ thành công');
    } catch (error) {
      toast.error('Lỗi khi lưu cài đặt');
    }
    setSaving(false);
  };

  const updateSetting = (key: keyof HomepageSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <AdminLayout><div className="p-8 text-center">Đang tải...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý trang chủ</h1>
        <Button variant="hero" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Hero
          </TabsTrigger>
          <TabsTrigger value="featured" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Nổi bật
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Sections
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Giới thiệu
          </TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Hero Banner</CardTitle>
              <p className="text-sm text-muted-foreground">Phần banner chính ở đầu trang</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tiêu đề chính</label>
                <Input
                  value={settings.hero_title || ''}
                  onChange={(e) => updateSetting('hero_title', e.target.value)}
                  placeholder="Bộ Sưu Tập Mới"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tiêu đề phụ</label>
                <Textarea
                  value={settings.hero_subtitle || ''}
                  onChange={(e) => updateSetting('hero_subtitle', e.target.value)}
                  placeholder="Khám phá xu hướng thời trang mới nhất..."
                  rows={2}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Text nút</label>
                  <Input
                    value={settings.hero_button_text || ''}
                    onChange={(e) => updateSetting('hero_button_text', e.target.value)}
                    placeholder="Khám phá ngay"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Link nút</label>
                  <Input
                    value={settings.hero_button_link || ''}
                    onChange={(e) => updateSetting('hero_button_link', e.target.value)}
                    placeholder="/products"
                  />
                </div>
              </div>
              <ImageUpload
                value={settings.hero_image || ''}
                onChange={(url) => updateSetting('hero_image', url)}
                folder="homepage"
                label="Hình ảnh Hero"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Featured Section */}
        <TabsContent value="featured">
          <Card>
            <CardHeader>
              <CardTitle>Phần sản phẩm nổi bật</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tiêu đề</label>
                <Input
                  value={settings.featured_title || ''}
                  onChange={(e) => updateSetting('featured_title', e.target.value)}
                  placeholder="Sản phẩm nổi bật"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                  value={settings.featured_subtitle || ''}
                  onChange={(e) => updateSetting('featured_subtitle', e.target.value)}
                  placeholder="Những sản phẩm được yêu thích nhất..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Sections */}
        <TabsContent value="sections">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Phần danh mục</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tiêu đề</label>
                  <Input
                    value={settings.categories_title || ''}
                    onChange={(e) => updateSetting('categories_title', e.target.value)}
                    placeholder="Danh mục sản phẩm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mô tả</label>
                  <Textarea
                    value={settings.categories_subtitle || ''}
                    onChange={(e) => updateSetting('categories_subtitle', e.target.value)}
                    placeholder="Khám phá các danh mục..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phần đăng ký nhận tin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tiêu đề</label>
                  <Input
                    value={settings.newsletter_title || ''}
                    onChange={(e) => updateSetting('newsletter_title', e.target.value)}
                    placeholder="Đăng ký nhận tin"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Mô tả</label>
                  <Textarea
                    value={settings.newsletter_subtitle || ''}
                    onChange={(e) => updateSetting('newsletter_subtitle', e.target.value)}
                    placeholder="Nhận thông tin về sản phẩm mới..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* About Section */}
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>Phần giới thiệu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tiêu đề</label>
                <Input
                  value={settings.about_title || ''}
                  onChange={(e) => updateSetting('about_title', e.target.value)}
                  placeholder="Về chúng tôi"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                  value={settings.about_description || ''}
                  onChange={(e) => updateSetting('about_description', e.target.value)}
                  placeholder="Giới thiệu về cửa hàng..."
                  rows={5}
                />
              </div>
              <ImageUpload
                value={settings.about_image || ''}
                onChange={(url) => updateSetting('about_image', url)}
                folder="homepage"
                label="Hình ảnh giới thiệu"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
