import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Image as ImageIcon, Monitor, Play, ArrowUpDown, Save } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DraggableBannerList } from '@/components/admin/DraggableBannerList';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  position: number;
  is_active: boolean;
  page_location: string;
  display_type: string;
  autoplay_interval: number;
  show_navigation: boolean;
  show_indicators: boolean;
}

const PAGE_LOCATIONS = [
  { value: 'home', label: 'Trang chủ', icon: '🏠' },
  { value: 'products', label: 'Sản phẩm', icon: '📦' },
  { value: 'blog', label: 'Blog', icon: '📝' },
  { value: 'contact', label: 'Liên hệ', icon: '📞' },
  { value: 'all', label: 'Tất cả trang', icon: '🌐' },
];

const DISPLAY_TYPES = [
  { value: 'hero', label: 'Hero Banner', desc: 'Banner lớn toàn trang' },
  { value: 'carousel', label: 'Carousel', desc: 'Slideshow xoay vòng' },
  { value: 'sidebar', label: 'Sidebar', desc: 'Banner bên cạnh' },
  { value: 'popup', label: 'Popup', desc: 'Hiển thị dạng popup' },
];

const defaultForm = {
  title: '',
  subtitle: '',
  image_url: '',
  link_url: '',
  position: '0',
  is_active: true,
  page_location: 'home',
  display_type: 'carousel',
  autoplay_interval: '5000',
  show_navigation: true,
  show_indicators: true,
};

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = async () => {
    const { data } = await supabase.from('banners').select('*').order('position');
    setBanners((data as Banner[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { 
      ...form, 
      position: Number(form.position),
      autoplay_interval: Number(form.autoplay_interval)
    };
    
    if (editing) {
      const { error } = await supabase.from('banners').update(data).eq('id', editing.id);
      if (error) { toast.error('Lỗi cập nhật'); return; }
      toast.success('Cập nhật thành công');
    } else {
      const { error } = await supabase.from('banners').insert(data);
      if (error) { toast.error('Lỗi tạo banner'); return; }
      toast.success('Tạo banner thành công');
    }
    setIsOpen(false);
    setEditing(null);
    setForm(defaultForm);
    fetchData();
  };

  const handleEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      position: String(banner.position),
      is_active: banner.is_active,
      page_location: banner.page_location || 'home',
      display_type: banner.display_type || 'carousel',
      autoplay_interval: String(banner.autoplay_interval || 5000),
      show_navigation: banner.show_navigation ?? true,
      show_indicators: banner.show_indicators ?? true,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xác nhận xóa banner này?')) return;
    await supabase.from('banners').delete().eq('id', id);
    toast.success('Đã xóa');
    fetchData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('banners').update({ is_active: !current }).eq('id', id);
    fetchData();
  };

  const handleReorder = async (reorderedBanners: Banner[]) => {
    setBanners(reorderedBanners);
    
    // Update positions in database
    const updates = reorderedBanners.map((banner, index) => 
      supabase.from('banners').update({ position: index }).eq('id', banner.id)
    );
    
    await Promise.all(updates);
    toast.success('Đã cập nhật thứ tự banner');
  };

  const filteredBanners = activeTab === 'all' 
    ? banners 
    : banners.filter(b => b.page_location === activeTab);

  const getPageLabel = (value: string) => PAGE_LOCATIONS.find(p => p.value === value)?.label || value;
  const getDisplayLabel = (value: string) => DISPLAY_TYPES.find(d => d.value === value)?.label || value;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Quản lý Banner</h1>
          <p className="text-muted-foreground mt-1">Tạo và quản lý banner hiển thị trên các trang</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={() => { setEditing(null); setForm(defaultForm); }}>
              <Plus className="h-4 w-4" /> Thêm banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{editing ? 'Sửa banner' : 'Thêm banner mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tiêu đề *</Label>
                      <Input 
                        value={form.title} 
                        onChange={(e) => setForm({ ...form, title: e.target.value })} 
                        placeholder="Nhập tiêu đề banner"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phụ đề</Label>
                      <Input 
                        value={form.subtitle} 
                        onChange={(e) => setForm({ ...form, subtitle: e.target.value })} 
                        placeholder="Mô tả ngắn"
                      />
                    </div>
                  </div>
                  <ImageUpload 
                    value={form.image_url} 
                    onChange={(url) => setForm({ ...form, image_url: url })} 
                    folder="banners" 
                    label="Hình ảnh banner *" 
                  />
                  <div className="space-y-2">
                    <Label>URL liên kết</Label>
                    <Input 
                      value={form.link_url} 
                      onChange={(e) => setForm({ ...form, link_url: e.target.value })} 
                      placeholder="VD: /products hoặc https://..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Display Settings */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Cài đặt hiển thị
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vị trí trang</Label>
                      <Select 
                        value={form.page_location} 
                        onValueChange={(v) => setForm({ ...form, page_location: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGE_LOCATIONS.map(p => (
                            <SelectItem key={p.value} value={p.value}>
                              <span className="flex items-center gap-2">
                                <span>{p.icon}</span>
                                <span>{p.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kiểu hiển thị</Label>
                      <Select 
                        value={form.display_type} 
                        onValueChange={(v) => setForm({ ...form, display_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DISPLAY_TYPES.map(d => (
                            <SelectItem key={d.value} value={d.value}>
                              <div>
                                <div className="font-medium">{d.label}</div>
                                <div className="text-xs text-muted-foreground">{d.desc}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Thứ tự hiển thị</Label>
                      <Input 
                        type="number" 
                        value={form.position} 
                        onChange={(e) => setForm({ ...form, position: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Thời gian chuyển (ms)</Label>
                      <Input 
                        type="number" 
                        value={form.autoplay_interval} 
                        onChange={(e) => setForm({ ...form, autoplay_interval: e.target.value })} 
                        min="1000"
                        step="500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Carousel Options */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Tùy chọn Carousel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="cursor-pointer">Hiển thị</Label>
                        <p className="text-xs text-muted-foreground">Bật/tắt banner</p>
                      </div>
                      <Switch 
                        checked={form.is_active} 
                        onCheckedChange={(c) => setForm({ ...form, is_active: c })} 
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="cursor-pointer">Mũi tên điều hướng</Label>
                        <p className="text-xs text-muted-foreground">Prev/Next</p>
                      </div>
                      <Switch 
                        checked={form.show_navigation} 
                        onCheckedChange={(c) => setForm({ ...form, show_navigation: c })} 
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="cursor-pointer">Chấm chỉ mục</Label>
                        <p className="text-xs text-muted-foreground">Dots indicator</p>
                      </div>
                      <Switch 
                        checked={form.show_indicators} 
                        onCheckedChange={(c) => setForm({ ...form, show_indicators: c })} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" variant="hero" className="w-full" size="lg">
                {editing ? 'Cập nhật banner' : 'Tạo banner mới'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <ImageIcon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{banners.length}</p>
                <p className="text-sm text-muted-foreground">Tổng banner</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Monitor className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{banners.filter(b => b.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Đang hiển thị</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Play className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{banners.filter(b => b.display_type === 'carousel').length}</p>
                <p className="text-sm text-muted-foreground">Carousel</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ImageIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{banners.filter(b => b.display_type === 'hero').length}</p>
                <p className="text-sm text-muted-foreground">Hero Banner</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-background">
            Tất cả ({banners.length})
          </TabsTrigger>
          {PAGE_LOCATIONS.slice(0, 4).map(p => (
            <TabsTrigger key={p.value} value={p.value} className="data-[state=active]:bg-background">
              {p.icon} {p.label} ({banners.filter(b => b.page_location === p.value).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Drag & Drop Info */}
      <Card className="mb-6 bg-accent/5 border-accent/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <ArrowUpDown className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium">Kéo thả để sắp xếp</p>
              <p className="text-sm text-muted-foreground">
                Giữ và kéo biểu tượng ⠿ để thay đổi thứ tự hiển thị của banner
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banner List with Drag & Drop */}
      <DraggableBannerList
        banners={filteredBanners}
        onReorder={handleReorder}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={toggleActive}
        getPageLabel={getPageLabel}
        getDisplayLabel={getDisplayLabel}
      />
    </AdminLayout>
  );
}