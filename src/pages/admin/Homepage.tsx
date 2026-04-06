import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Save, Layout, Sparkles, Grid, Mail, Plus, Trash2, Layers, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { HomepageSectionManager } from '@/components/admin/HomepageSectionManager';
import { FlashSaleManager } from '@/components/admin/FlashSaleManager';
import type { HomepageSettings } from '@/hooks/useHomepageSettings';

interface StatItem {
  value: string;
  label: string;
}

// Default values for forms
const defaultSettings: HomepageSettings = {
  hero: {
    badge_text: 'Bộ sưu tập mới 2024',
    title_line1: 'Phong cách',
    title_line2: 'Đẳng cấp',
    description: 'Khám phá những thiết kế độc quyền, tinh tế được tuyển chọn từ các thương hiệu hàng đầu thế giới.',
    button_primary_text: 'Khám phá ngay',
    button_secondary_text: 'Liên hệ tư vấn',
    stats: [
      { value: '500+', label: 'Sản phẩm' },
      { value: '10K+', label: 'Khách hàng' },
      { value: '5★', label: 'Đánh giá' },
    ],
    background_image: '',
    show_badge: true,
    show_description: true,
    show_buttons: true,
    show_stats: true,
  },
  featured: {
    badge_text: 'Nổi bật',
    title: 'Sản phẩm nổi bật',
    description: 'Những sản phẩm được yêu thích nhất',
    button_text: 'Xem tất cả sản phẩm',
  },
  categories: {
    title: 'Danh mục sản phẩm',
    description: 'Khám phá các danh mục sản phẩm đa dạng',
  },
  newsletter: {
    title: 'Đăng ký nhận tin',
    description: 'Nhận thông tin về sản phẩm mới và ưu đãi độc quyền',
    button_text: 'Đăng ký',
    placeholder: 'Email của bạn',
  },
};

export default function AdminHomepage() {
  const [settings, setSettings] = useState<HomepageSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['homepage_hero', 'homepage_featured', 'homepage_categories', 'homepage_newsletter']);

      if (data && data.length > 0) {
        const newSettings = { ...defaultSettings };
        
        data.forEach((item) => {
          const value = item.value as Record<string, unknown>;
          if (item.key === 'homepage_hero' && value) {
            // Only merge non-empty values
            const heroValue: Record<string, unknown> = {};
            Object.entries(value).forEach(([k, v]) => {
              if (v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)) {
                heroValue[k] = v;
              }
            });
            newSettings.hero = { ...defaultSettings.hero, ...heroValue };
          } else if (item.key === 'homepage_featured' && value) {
            const featuredValue: Record<string, unknown> = {};
            Object.entries(value).forEach(([k, v]) => {
              if (v !== '' && v !== null && v !== undefined) {
                featuredValue[k] = v;
              }
            });
            newSettings.featured = { ...defaultSettings.featured, ...featuredValue };
          } else if (item.key === 'homepage_categories' && value) {
            const categoriesValue: Record<string, unknown> = {};
            Object.entries(value).forEach(([k, v]) => {
              if (v !== '' && v !== null && v !== undefined) {
                categoriesValue[k] = v;
              }
            });
            newSettings.categories = { ...defaultSettings.categories, ...categoriesValue };
          } else if (item.key === 'homepage_newsletter' && value) {
            const newsletterValue: Record<string, unknown> = {};
            Object.entries(value).forEach(([k, v]) => {
              if (v !== '' && v !== null && v !== undefined) {
                newsletterValue[k] = v;
              }
            });
            newSettings.newsletter = { ...defaultSettings.newsletter, ...newsletterValue };
          }
        });
        
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const saveSetting = async (key: string, value: unknown) => {
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', key)
      .maybeSingle();
    
    if (existing) {
      await supabase.from('settings').update({ value: value as never }).eq('key', key);
    } else {
      await supabase.from('settings').insert([{ key, value: value as never }]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting('homepage_hero', settings.hero),
        saveSetting('homepage_featured', settings.featured),
        saveSetting('homepage_categories', settings.categories),
        saveSetting('homepage_newsletter', settings.newsletter),
      ]);
      toast.success('Lưu cài đặt trang chủ thành công');
    } catch (error) {
      toast.error('Lỗi khi lưu cài đặt');
    }
    setSaving(false);
  };

  const updateHero = (key: keyof typeof settings.hero, value: string | StatItem[] | boolean) => {
    setSettings(prev => ({
      ...prev,
      hero: { ...prev.hero, [key]: value }
    }));
  };

  const updateFeatured = (key: keyof typeof settings.featured, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      featured: { ...prev.featured, [key]: value }
    }));
  };

  const updateCategories = (key: keyof typeof settings.categories, value: string) => {
    setSettings(prev => ({
      ...prev,
      categories: { ...prev.categories, [key]: value }
    }));
  };

  const updateNewsletter = (key: keyof typeof settings.newsletter, value: string) => {
    setSettings(prev => ({
      ...prev,
      newsletter: { ...prev.newsletter, [key]: value }
    }));
  };

  const addStat = () => {
    const newStats = [...(settings.hero.stats || []), { value: '', label: '' }];
    updateHero('stats', newStats);
  };

  const updateStat = (index: number, field: 'value' | 'label', value: string) => {
    const newStats = [...(settings.hero.stats || [])];
    newStats[index] = { ...newStats[index], [field]: value };
    updateHero('stats', newStats);
  };

  const removeStat = (index: number) => {
    const newStats = (settings.hero.stats || []).filter((_, i) => i !== index);
    updateHero('stats', newStats);
  };

  if (loading) {
    return <AdminLayout><div className="p-8 text-center">Đang tải...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý trang chủ</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      <Tabs defaultValue="layout" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full max-w-4xl">
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Bố cục
          </TabsTrigger>
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Hero
          </TabsTrigger>
          <TabsTrigger value="flash_sale" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Flash Sale
          </TabsTrigger>
          <TabsTrigger value="featured" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Nổi bật
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Danh mục
          </TabsTrigger>
          <TabsTrigger value="newsletter" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Newsletter
          </TabsTrigger>
        </TabsList>

        {/* Layout Section - NEW */}
        <TabsContent value="layout">
          <HomepageSectionManager />
        </TabsContent>

        {/* Flash Sale Section */}
        <TabsContent value="flash_sale">
          <FlashSaleManager />
        </TabsContent>


        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Hero Banner</CardTitle>
              <p className="text-sm text-muted-foreground">Phần banner chính ở đầu trang</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visibility Toggles */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                <h4 className="font-medium text-sm">Hiển thị các phần tử</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show_badge"
                      checked={settings.hero.show_badge !== false}
                      onCheckedChange={(checked) => updateHero('show_badge', checked)}
                    />
                    <Label htmlFor="show_badge" className="text-sm">Badge</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show_description"
                      checked={settings.hero.show_description !== false}
                      onCheckedChange={(checked) => updateHero('show_description', checked)}
                    />
                    <Label htmlFor="show_description" className="text-sm">Mô tả</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show_buttons"
                      checked={settings.hero.show_buttons !== false}
                      onCheckedChange={(checked) => updateHero('show_buttons', checked)}
                    />
                    <Label htmlFor="show_buttons" className="text-sm">Nút CTA</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show_stats"
                      checked={settings.hero.show_stats !== false}
                      onCheckedChange={(checked) => updateHero('show_stats', checked)}
                    />
                    <Label htmlFor="show_stats" className="text-sm">Thống kê</Label>
                  </div>
                </div>
              </div>

              {/* Background Image */}
              <div>
                <ImageUpload
                  value={settings.hero.background_image || ''}
                  onChange={(url) => updateHero('background_image', url)}
                  folder="homepage"
                  label="Ảnh nền Hero"
                />
              </div>

              {/* Badge */}
              <div>
                <label className="text-sm font-medium">Badge text</label>
                <Input
                  value={settings.hero.badge_text}
                  onChange={(e) => updateHero('badge_text', e.target.value)}
                  placeholder="Bộ sưu tập mới 2024"
                  disabled={settings.hero.show_badge === false}
                />
              </div>

              {/* Title Lines */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tiêu đề dòng 1</label>
                  <Input
                    value={settings.hero.title_line1}
                    onChange={(e) => updateHero('title_line1', e.target.value)}
                    placeholder="Phong cách"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tiêu đề dòng 2</label>
                  <Input
                    value={settings.hero.title_line2}
                    onChange={(e) => updateHero('title_line2', e.target.value)}
                    placeholder="Đẳng cấp"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                  value={settings.hero.description}
                  onChange={(e) => updateHero('description', e.target.value)}
                  placeholder="Khám phá những thiết kế độc quyền..."
                  rows={3}
                  disabled={settings.hero.show_description === false}
                />
              </div>

              {/* Buttons */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nút chính</label>
                  <Input
                    value={settings.hero.button_primary_text}
                    onChange={(e) => updateHero('button_primary_text', e.target.value)}
                    placeholder="Khám phá ngay"
                    disabled={settings.hero.show_buttons === false}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nút phụ</label>
                  <Input
                    value={settings.hero.button_secondary_text}
                    onChange={(e) => updateHero('button_secondary_text', e.target.value)}
                    placeholder="Liên hệ tư vấn"
                    disabled={settings.hero.show_buttons === false}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className={settings.hero.show_stats === false ? 'opacity-50 pointer-events-none' : ''}>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Thống kê</label>
                  <Button type="button" variant="outline" size="sm" onClick={addStat}>
                    <Plus className="h-4 w-4 mr-1" /> Thêm
                  </Button>
                </div>
                <div className="space-y-3">
                  {(settings.hero.stats || []).map((stat, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Input
                        value={stat.value}
                        onChange={(e) => updateStat(index, 'value', e.target.value)}
                        placeholder="500+"
                        className="flex-1"
                      />
                      <Input
                        value={stat.label}
                        onChange={(e) => updateStat(index, 'label', e.target.value)}
                        placeholder="Sản phẩm"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStat(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Featured Section */}
        <TabsContent value="featured">
          <Card>
            <CardHeader>
              <CardTitle>Phần sản phẩm nổi bật</CardTitle>
              <p className="text-sm text-muted-foreground">Hiển thị các sản phẩm được đánh dấu nổi bật</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show/Hide Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="show_featured" className="font-medium">Hiển thị section Sản phẩm nổi bật</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Bật/tắt hiển thị trên trang chủ</p>
                </div>
                <Switch
                  id="show_featured"
                  checked={settings.featured.show_section !== false}
                  onCheckedChange={(checked) => updateFeatured('show_section', checked)}
                />
              </div>
                <label className="text-sm font-medium">Badge text</label>
                <Input
                  value={settings.featured.badge_text}
                  onChange={(e) => updateFeatured('badge_text', e.target.value)}
                  placeholder="Nổi bật"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tiêu đề</label>
                <Input
                  value={settings.featured.title}
                  onChange={(e) => updateFeatured('title', e.target.value)}
                  placeholder="Sản phẩm nổi bật"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                  value={settings.featured.description}
                  onChange={(e) => updateFeatured('description', e.target.value)}
                  placeholder="Những sản phẩm được yêu thích nhất..."
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Text nút xem thêm</label>
                <Input
                  value={settings.featured.button_text}
                  onChange={(e) => updateFeatured('button_text', e.target.value)}
                  placeholder="Xem tất cả sản phẩm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Section */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Phần danh mục sản phẩm</CardTitle>
              <p className="text-sm text-muted-foreground">Hiển thị các danh mục sản phẩm</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tiêu đề</label>
                <Input
                  value={settings.categories.title}
                  onChange={(e) => updateCategories('title', e.target.value)}
                  placeholder="Danh mục sản phẩm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                  value={settings.categories.description}
                  onChange={(e) => updateCategories('description', e.target.value)}
                  placeholder="Khám phá các danh mục sản phẩm đa dạng"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Newsletter Section */}
        <TabsContent value="newsletter">
          <Card>
            <CardHeader>
              <CardTitle>Phần đăng ký nhận tin</CardTitle>
              <p className="text-sm text-muted-foreground">Form đăng ký email nhận tin</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tiêu đề</label>
                <Input
                  value={settings.newsletter.title}
                  onChange={(e) => updateNewsletter('title', e.target.value)}
                  placeholder="Đăng ký nhận tin"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea
                  value={settings.newsletter.description}
                  onChange={(e) => updateNewsletter('description', e.target.value)}
                  placeholder="Nhận thông tin về sản phẩm mới và ưu đãi độc quyền"
                  rows={2}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Text nút đăng ký</label>
                  <Input
                    value={settings.newsletter.button_text}
                    onChange={(e) => updateNewsletter('button_text', e.target.value)}
                    placeholder="Đăng ký"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Placeholder email</label>
                  <Input
                    value={settings.newsletter.placeholder}
                    onChange={(e) => updateNewsletter('placeholder', e.target.value)}
                    placeholder="Email của bạn"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
