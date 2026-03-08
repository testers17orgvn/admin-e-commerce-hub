import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Plus, Pencil, Trash2, Star, Flame, Eye, EyeOff, Link, Search,
  Package, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  Copy, Filter, ArrowUpDown, LayoutGrid, List, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { MultiImageUpload } from '@/components/admin/MultiImageUpload';
import { TagInput } from '@/components/admin/TagInput';
import { VariantStockManager } from '@/components/admin/VariantStockManager';
import { VideoUpload } from '@/components/admin/VideoUpload';
import { generateSlug } from '@/lib/slugify';

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  price: string;
  original_price: string;
  image_url: string;
  images: string[];
  video_url: string;
  category_id: string;
  stock: string;
  is_featured: boolean;
  is_active: boolean;
  is_hot: boolean;
  colors: string[];
  sizes: string[];
  tags: string[];
}

const defaultForm: ProductForm = {
  name: '', slug: '', description: '', price: '', original_price: '',
  image_url: '', images: [], video_url: '', category_id: '', stock: '0',
  is_featured: false, is_active: true, is_hot: false,
  colors: [], sizes: [], tags: [],
};

type SortKey = 'name' | 'price' | 'stock' | 'created_at';
type ViewMode = 'table' | 'grid';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'featured' | 'hot' | 'low_stock'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const fetchData = async () => {
    const [prodRes, catRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*'),
    ]);
    setProducts((prodRes.data as Product[]) || []);
    setCategories((catRes.data as Category[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Stats
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter(p => p.is_active).length;
    const featured = products.filter(p => p.is_featured).length;
    const lowStock = products.filter(p => p.stock <= 5).length;
    const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);
    return { total, active, featured, lowStock, totalValue };
  }, [products]);

  // Filter & Sort
  const filtered = useMemo(() => {
    let list = products.filter(p => {
      const matchSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'all' || p.category_id === categoryFilter;
      let matchStatus = true;
      if (statusFilter === 'active') matchStatus = p.is_active;
      else if (statusFilter === 'inactive') matchStatus = !p.is_active;
      else if (statusFilter === 'featured') matchStatus = p.is_featured;
      else if (statusFilter === 'hot') matchStatus = p.is_hot || false;
      else if (statusFilter === 'low_stock') matchStatus = p.stock <= 5;
      return matchSearch && matchCat && matchStatus;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'price') cmp = a.price - b.price;
      else if (sortKey === 'stock') cmp = a.stock - b.stock;
      else cmp = new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [products, searchQuery, categoryFilter, statusFilter, sortKey, sortAsc]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || generateSlug(form.name, 'san-pham');
    const data = {
      name: form.name, slug,
      description: form.description || null,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      image_url: form.image_url || (form.images.length > 0 ? form.images[0] : null),
      images: form.images, video_url: form.video_url || null,
      category_id: form.category_id || null, stock: Number(form.stock),
      is_featured: form.is_featured, is_active: form.is_active, is_hot: form.is_hot,
      colors: form.colors, sizes: form.sizes, tags: form.tags,
    };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(data).eq('id', editingProduct.id);
      if (error) { toast.error('Lỗi cập nhật'); return; }
      toast.success('Cập nhật thành công');
    } else {
      const { error } = await supabase.from('products').insert(data);
      if (error) { toast.error('Lỗi tạo sản phẩm'); return; }
      toast.success('Tạo sản phẩm thành công');
    }
    setIsOpen(false); setEditingProduct(null); setForm(defaultForm); fetchData();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name, slug: product.slug, description: product.description || '',
      price: String(product.price),
      original_price: product.original_price ? String(product.original_price) : '',
      image_url: product.image_url || '', images: product.images || [],
      video_url: (product as any).video_url || '',
      category_id: product.category_id || '', stock: String(product.stock),
      is_featured: product.is_featured, is_active: product.is_active,
      is_hot: product.is_hot || false,
      colors: product.colors || [], sizes: product.sizes || [], tags: product.tags || [],
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xác nhận xóa?')) return;
    await supabase.from('products').delete().eq('id', id);
    toast.success('Đã xóa'); fetchData();
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    if (!confirm(`Xóa ${selectedProducts.size} sản phẩm đã chọn?`)) return;
    const ids = Array.from(selectedProducts);
    await supabase.from('products').delete().in('id', ids);
    toast.success(`Đã xóa ${ids.length} sản phẩm`);
    setSelectedProducts(new Set()); fetchData();
  };

  const handleBulkToggle = async (field: 'is_active' | 'is_featured' | 'is_hot', value: boolean) => {
    if (selectedProducts.size === 0) return;
    const ids = Array.from(selectedProducts);
    await supabase.from('products').update({ [field]: value }).in('id', ids);
    toast.success(`Đã cập nhật ${ids.length} sản phẩm`);
    setSelectedProducts(new Set()); fetchData();
  };

  const handleDuplicate = async (product: Product) => {
    const { id, created_at, updated_at, ...rest } = product as any;
    const newSlug = product.slug + '-copy-' + Date.now().toString(36).slice(-4);
    const { error } = await supabase.from('products').insert({ ...rest, name: product.name + ' (Copy)', slug: newSlug });
    if (error) toast.error('Lỗi nhân bản');
    else { toast.success('Đã nhân bản sản phẩm'); fetchData(); }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const toggleSelect = (id: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filtered.length) setSelectedProducts(new Set());
    else setSelectedProducts(new Set(filtered.map(p => p.id)));
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '-';
    return categories.find(c => c.id === categoryId)?.name || '-';
  };

  const getDiscount = (price: number, originalPrice: number | null) => {
    if (!originalPrice || originalPrice <= price) return null;
    return Math.round((1 - price / originalPrice) * 100);
  };

  const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + '₫';

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 flex flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Đang tải sản phẩm...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-xl bg-accent/10">
              <Package className="h-6 w-6 text-accent" />
            </div>
            Quản lý sản phẩm
          </h1>
          <p className="text-muted-foreground mt-1">Quản lý toàn bộ sản phẩm trong cửa hàng</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={() => { setEditingProduct(null); setForm(defaultForm); }}>
              <Plus className="h-4 w-4" /> Thêm sản phẩm
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="basic">Cơ bản</TabsTrigger>
                  <TabsTrigger value="variants">Biến thể</TabsTrigger>
                  <TabsTrigger value="images">Hình ảnh</TabsTrigger>
                  <TabsTrigger value="preview">Xem trước</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Tên sản phẩm *</label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || '' })} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Slug (URL)</label>
                      <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Tự động tạo từ tên" />
                      {form.name && !form.slug && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Link className="h-3 w-3" />
                          <span>Preview: <code className="bg-muted px-1 rounded">{generateSlug(form.name)}</code></span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Mô tả</label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Giá bán *</label>
                      <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Giá gốc</label>
                      <Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} placeholder="Bỏ trống nếu không giảm" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tồn kho</label>
                      <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Danh mục</label>
                    <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <TagInput value={form.tags} onChange={(tags) => setForm({ ...form, tags })} label="Nhãn / Tags" placeholder="VD: Mới, Bán chạy..." />
                  <div className="flex flex-wrap gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch checked={form.is_featured} onCheckedChange={(c) => setForm({ ...form, is_featured: c })} />
                      <span className="text-sm flex items-center gap-1"><Star className="h-4 w-4" /> Nổi bật</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={form.is_hot} onCheckedChange={(c) => setForm({ ...form, is_hot: c })} />
                      <span className="text-sm flex items-center gap-1"><Flame className="h-4 w-4 text-orange-500" /> Hot</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
                      <span className="text-sm flex items-center gap-1">{form.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} Hiển thị</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="variants" className="space-y-6 pt-4">
                  <TagInput value={form.colors} onChange={(colors) => setForm({ ...form, colors })} label="Màu sắc" placeholder="Nhập màu và Enter..." colorMode />
                  <TagInput value={form.sizes} onChange={(sizes) => setForm({ ...form, sizes })} label="Kích thước" placeholder="VD: S, M, L, XL..." />
                  {editingProduct && (form.colors.length > 0 || form.sizes.length > 0) && (
                    <VariantStockManager productId={editingProduct.id} colors={form.colors} sizes={form.sizes} totalStock={Number(form.stock)} onTotalStockChange={(n) => setForm({ ...form, stock: String(n) })} />
                  )}
                </TabsContent>

                <TabsContent value="images" className="space-y-4 pt-4">
                  <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="products" label="Ảnh đại diện" />
                  <MultiImageUpload value={form.images} onChange={(images) => setForm({ ...form, images })} folder="products" label="Bộ sưu tập ảnh" maxImages={10} />
                  <VideoUpload value={form.video_url} onChange={(url) => setForm({ ...form, video_url: url })} folder="products" label="Video review sản phẩm" />
                </TabsContent>

                <TabsContent value="preview" className="pt-4">
                  <div className="rounded-xl border bg-card overflow-hidden">
                    <div className="aspect-video bg-muted flex items-center justify-center relative">
                      {form.image_url || form.images[0] ? (
                        <img src={form.image_url || form.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Chưa có ảnh</p>
                        </div>
                      )}
                      {form.is_hot && (
                        <Badge className="absolute top-3 left-3 bg-orange-500 text-white"><Flame className="h-3 w-3 mr-1" />Hot</Badge>
                      )}
                      {form.original_price && Number(form.original_price) > Number(form.price) && (
                        <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground">
                          -{Math.round((1 - Number(form.price) / Number(form.original_price)) * 100)}%
                        </Badge>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <h3 className="font-bold text-lg">{form.name || 'Tên sản phẩm'}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-primary">{form.price ? formatPrice(Number(form.price)) : '0₫'}</span>
                        {form.original_price && Number(form.original_price) > Number(form.price) && (
                          <span className="text-sm text-muted-foreground line-through">{formatPrice(Number(form.original_price))}</span>
                        )}
                      </div>
                      {form.description && <p className="text-sm text-muted-foreground line-clamp-2">{form.description}</p>}
                      <div className="flex flex-wrap gap-2">
                        {form.colors.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{form.colors.length} màu</span>
                          </div>
                        )}
                        {form.sizes.length > 0 && (
                          <div className="flex gap-1">
                            {form.sizes.slice(0, 5).map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                            {form.sizes.length > 5 && <Badge variant="outline" className="text-xs">+{form.sizes.length - 5}</Badge>}
                          </div>
                        )}
                      </div>
                      {form.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {form.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                        </div>
                      )}
                      <div className="flex gap-2 text-xs text-muted-foreground pt-2 border-t">
                        <span>Kho: {form.stock}</span>
                        <span>•</span>
                        <span>{form.is_active ? '✅ Hiển thị' : '🚫 Ẩn'}</span>
                        {form.is_featured && <><span>•</span><span>⭐ Nổi bật</span></>}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button type="submit" variant="hero" className="w-full">
                {editingProduct ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Tổng sản phẩm', value: stats.total, icon: Package, gradient: 'from-blue-500/10 to-blue-600/5', iconColor: 'text-blue-500' },
          { label: 'Đang hiển thị', value: stats.active, icon: CheckCircle2, gradient: 'from-green-500/10 to-green-600/5', iconColor: 'text-green-500' },
          { label: 'Nổi bật', value: stats.featured, icon: Star, gradient: 'from-yellow-500/10 to-amber-500/5', iconColor: 'text-yellow-500' },
          { label: 'Sắp hết hàng', value: stats.lowStock, icon: AlertTriangle, gradient: 'from-red-500/10 to-red-600/5', iconColor: 'text-red-500' },
          { label: 'Giá trị kho', value: new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(stats.totalValue) + '₫', icon: TrendingUp, gradient: 'from-purple-500/10 to-purple-600/5', iconColor: 'text-purple-500' },
        ].map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search, Filter, View toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm theo tên hoặc slug..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Danh mục" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as any)} className="shrink-0">
          <TabsList className="h-10">
            <TabsTrigger value="all" className="text-xs">Tất cả</TabsTrigger>
            <TabsTrigger value="active" className="text-xs">Hiển thị</TabsTrigger>
            <TabsTrigger value="low_stock" className="text-xs">Sắp hết</TabsTrigger>
            <TabsTrigger value="featured" className="text-xs">⭐</TabsTrigger>
            <TabsTrigger value="hot" className="text-xs">🔥</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('table')}><List className="h-4 w-4" /></Button>
          <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedProducts.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-accent/5 border border-accent/20 animate-in slide-in-from-top duration-200">
          <span className="text-sm font-medium">Đã chọn {selectedProducts.size} sản phẩm</span>
          <div className="flex gap-2 ml-auto flex-wrap">
            <Button size="sm" variant="outline" onClick={() => handleBulkToggle('is_active', true)}><Eye className="h-3.5 w-3.5 mr-1" />Hiện</Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkToggle('is_active', false)}><EyeOff className="h-3.5 w-3.5 mr-1" />Ẩn</Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkToggle('is_featured', true)}><Star className="h-3.5 w-3.5 mr-1" />Nổi bật</Button>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete}><Trash2 className="h-3.5 w-3.5 mr-1" />Xóa</Button>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 w-10">
                      <input type="checkbox" checked={selectedProducts.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
                    </th>
                    <th className="text-left p-3 text-sm font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort('name')}>
                      <span className="flex items-center gap-1">Sản phẩm <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="text-left p-3 text-sm font-medium">Danh mục</th>
                    <th className="text-left p-3 text-sm font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort('price')}>
                      <span className="flex items-center gap-1">Giá <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="text-center p-3 text-sm font-medium cursor-pointer hover:text-foreground" onClick={() => toggleSort('stock')}>
                      <span className="flex items-center justify-center gap-1">Kho <ArrowUpDown className="h-3 w-3" /></span>
                    </th>
                    <th className="text-center p-3 text-sm font-medium">Trạng thái</th>
                    <th className="text-right p-3 text-sm font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>{searchQuery ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm nào'}</p>
                    </td></tr>
                  ) : filtered.map((p) => {
                    const discount = getDiscount(p.price, p.original_price);
                    return (
                      <tr key={p.id} className={`border-t hover:bg-muted/30 transition-colors ${selectedProducts.has(p.id) ? 'bg-accent/5' : ''}`}>
                        <td className="p-3">
                          <input type="checkbox" checked={selectedProducts.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="relative cursor-pointer" onClick={() => setPreviewProduct(p)}>
                              {p.image_url ? (
                                <img src={p.image_url} className="w-12 h-12 rounded-lg object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>
                              )}
                              {p.is_hot && (
                                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] px-1 py-0.5 rounded-full flex items-center">
                                  <Flame className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-medium block truncate max-w-[200px]">{p.name}</span>
                              <div className="flex gap-1 mt-1">
                                {p.tags?.slice(0, 2).map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                                ))}
                                {(p.tags?.length || 0) > 2 && <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{p.tags!.length - 2}</Badge>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{getCategoryName(p.category_id)}</td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{formatPrice(p.price)}</span>
                            {discount && <span className="text-xs text-green-600">-{discount}%</span>}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={p.stock > 10 ? 'secondary' : p.stock > 0 ? 'outline' : 'destructive'}>{p.stock}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => { await supabase.from('products').update({ is_featured: !p.is_featured }).eq('id', p.id); fetchData(); }} title="Nổi bật">
                              <Star className={`h-4 w-4 ${p.is_featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => { await supabase.from('products').update({ is_hot: !p.is_hot }).eq('id', p.id); fetchData(); }} title="Hot">
                              <Flame className={`h-4 w-4 ${p.is_hot ? 'fill-orange-500 text-orange-500' : ''}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => { await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id); fetchData(); }} title="Hiển thị">
                              {p.is_active ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewProduct(p)} title="Xem trước">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(p)} title="Nhân bản">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full p-12 text-center text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>{searchQuery ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm nào'}</p>
            </div>
          ) : filtered.map(p => {
            const discount = getDiscount(p.price, p.original_price);
            return (
              <Card key={p.id} className={`overflow-hidden group transition-all hover:shadow-md ${selectedProducts.has(p.id) ? 'ring-2 ring-accent' : ''}`}>
                <div className="relative aspect-square bg-muted cursor-pointer" onClick={() => setPreviewProduct(p)}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground opacity-30" /></div>
                  )}
                  {discount && <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">-{discount}%</Badge>}
                  {p.is_hot && <Badge className="absolute top-2 left-2 bg-orange-500 text-white"><Flame className="h-3 w-3" /></Badge>}
                  {!p.is_active && <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><EyeOff className="h-6 w-6 text-muted-foreground" /></div>}
                  <div className="absolute top-2 left-2">
                    <input type="checkbox" checked={selectedProducts.has(p.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(p.id); }} className="rounded h-4 w-4" />
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-bold text-primary">{formatPrice(p.price)}</span>
                    {p.original_price && <span className="text-xs text-muted-foreground line-through">{formatPrice(p.original_price)}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant={p.stock > 10 ? 'secondary' : p.stock > 0 ? 'outline' : 'destructive'} className="text-xs">Kho: {p.stock}</Badge>
                    <div className="flex gap-0.5">
                      {p.is_featured && <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />}
                      {p.is_hot && <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />}
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(p)}><Copy className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Product Preview Dialog */}
      <Dialog open={!!previewProduct} onOpenChange={() => setPreviewProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Xem trước sản phẩm</DialogTitle>
          </DialogHeader>
          {previewProduct && (() => {
            const discount = getDiscount(previewProduct.price, previewProduct.original_price);
            return (
              <div className="space-y-4">
                <div className="aspect-video rounded-xl overflow-hidden bg-muted relative">
                  {previewProduct.image_url ? (
                    <img src={previewProduct.image_url} alt={previewProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-12 w-12 text-muted-foreground opacity-30" /></div>
                  )}
                  {previewProduct.is_hot && <Badge className="absolute top-3 left-3 bg-orange-500 text-white"><Flame className="h-3 w-3 mr-1" />Hot</Badge>}
                  {discount && <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground">-{discount}%</Badge>}
                </div>

                <div>
                  <h3 className="text-xl font-bold">{previewProduct.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{getCategoryName(previewProduct.category_id)}</p>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-primary">{formatPrice(previewProduct.price)}</span>
                  {previewProduct.original_price && (
                    <span className="text-lg text-muted-foreground line-through">{formatPrice(previewProduct.original_price)}</span>
                  )}
                </div>

                {previewProduct.description && (
                  <p className="text-sm text-muted-foreground">{previewProduct.description}</p>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">Tồn kho</p>
                    <p className="text-lg font-bold">{previewProduct.stock}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">Màu sắc</p>
                    <p className="text-lg font-bold">{previewProduct.colors?.length || 0}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">Size</p>
                    <p className="text-lg font-bold">{previewProduct.sizes?.length || 0}</p>
                  </div>
                </div>

                {previewProduct.tags && previewProduct.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {previewProduct.tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                  </div>
                )}

                {previewProduct.images && previewProduct.images.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Bộ sưu tập ({previewProduct.images.length} ảnh)</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {previewProduct.images.map((img, i) => (
                        <img key={i} src={img} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setPreviewProduct(null); handleEdit(previewProduct); }}>
                    <Pencil className="h-4 w-4 mr-1" /> Chỉnh sửa
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <a href={`/products/${previewProduct.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" /> Xem trang
                    </a>
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mt-4">
        Hiển thị {filtered.length}/{products.length} sản phẩm
      </p>
    </AdminLayout>
  );
}
