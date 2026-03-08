import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package, Clock, CheckCircle, XCircle, AlertCircle, Pencil, Trash2, Eye, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { MultiImageUpload } from '@/components/admin/MultiImageUpload';
import { TagInput } from '@/components/admin/TagInput';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface SellerProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  category_id: string | null;
  image_url: string | null;
  images: string[];
  colors: string[];
  sizes: string[];
  tags: string[];
  stock: number;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  rejection_reason: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', icon: Clock, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500' },
  approved: { label: 'Đã duyệt', icon: CheckCircle, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500' },
  rejected: { label: 'Từ chối', icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
  revision_requested: { label: 'Cần chỉnh sửa', icon: AlertCircle, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
};

const defaultForm = {
  name: '',
  description: '',
  price: '',
  original_price: '',
  category_id: '',
  image_url: '',
  images: [] as string[],
  colors: [] as string[],
  sizes: [] as string[],
  tags: [] as string[],
  stock: '0',
};

export default function SellerProducts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<SellerProduct | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [activeTab, setActiveTab] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      checkSellerRole();
    }
  }, [user, authLoading]);

  const checkSellerRole = async () => {
    const { data } = await supabase.rpc('is_seller');
    if (!data) {
      toast.error('Bạn cần có quyền seller để truy cập trang này');
      navigate('/');
      return;
    }
    setIsSeller(true);
    fetchData();
  };

  const fetchData = async () => {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('seller_products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name').order('name'),
    ]);

    setProducts((productsRes.data as SellerProduct[]) || []);
    setCategories((categoriesRes.data as Category[]) || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error('Vui lòng nhập giá bán hợp lệ');
      return;
    }

    setSubmitting(true);
    const productData: any = {
      seller_id: user.id,
      name: form.name.trim(),
      slug: '',
      description: form.description?.trim() || null,
      price: Number(form.price) || 0,
      original_price: form.original_price ? Number(form.original_price) : null,
      category_id: form.category_id || null,
      image_url: form.image_url || null,
      images: form.images,
      colors: form.colors,
      sizes: form.sizes,
      tags: form.tags,
      stock: Number(form.stock) || 0,
    };

    // Only reset status to pending for new products or revision_requested edits
    if (!editing) {
      productData.status = 'pending';
    } else if (editing.status === 'revision_requested') {
      productData.status = 'pending';
    }
    // For pending products being edited, keep status as pending (don't change)

    let error;
    if (editing) {
      const res = await supabase.from('seller_products').update(productData).eq('id', editing.id);
      error = res.error;
    } else {
      const res = await supabase.from('seller_products').insert(productData);
      error = res.error;
    }

    setSubmitting(false);

    if (error) {
      toast.error('Lỗi: ' + error.message);
      return;
    }

    toast.success(editing ? 'Đã cập nhật sản phẩm' : 'Đã gửi sản phẩm để duyệt');
    setIsOpen(false);
    setEditing(null);
    setForm(defaultForm);
    fetchData();
  };

  const openCreateDialog = () => {
    setEditing(null);
    setForm(defaultForm);
    setIsOpen(true);
  };

  const handleEdit = (product: SellerProduct) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      original_price: product.original_price ? String(product.original_price) : '',
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      images: product.images || [],
      colors: product.colors || [],
      sizes: product.sizes || [],
      tags: product.tags || [],
      stock: String(product.stock || 0),
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xác nhận xóa sản phẩm này?')) return;
    const { error } = await supabase.from('seller_products').delete().eq('id', id);
    if (error) {
      toast.error('Không thể xóa sản phẩm');
      return;
    }
    toast.success('Đã xóa sản phẩm');
    fetchData();
  };

  const getFilteredProducts = () => {
    let filtered = products;
    if (activeTab !== 'all') {
      filtered = filtered.filter(p => p.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
    }
    return filtered;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-16 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!isSeller) return null;

  const filteredProducts = getFilteredProducts();

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/seller/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-display">Sản phẩm của tôi</h1>
              <p className="text-sm text-muted-foreground">Quản lý và theo dõi trạng thái duyệt sản phẩm</p>
            </div>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" /> Đăng sản phẩm
          </Button>
        </div>

        {/* Search + Stats */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats mini */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { key: 'all', label: 'Tất cả', count: products.length, dot: 'bg-foreground' },
            ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
              key,
              label: cfg.label,
              count: products.filter(p => p.status === key).length,
              dot: cfg.dot,
            })),
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl text-left transition-all border",
                activeTab === item.key
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-transparent bg-muted/40 hover:bg-muted/70"
              )}
            >
              <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", item.dot)} />
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none">{item.count}</p>
                <p className="text-xs text-muted-foreground truncate">{item.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => {
              const statusConfig = STATUS_CONFIG[product.status];
              const StatusIcon = statusConfig.icon;
              const canEdit = product.status === 'pending' || product.status === 'revision_requested';
              const hasIssue = (product.status === 'rejected' || product.status === 'revision_requested') && product.rejection_reason;

              return (
                <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-all border">
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-muted">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className={cn("shadow-sm", statusConfig.color)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold truncate text-sm">{product.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(product.created_at), 'dd/MM/yyyy', { locale: vi })} · Kho: {product.stock}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-primary">{formatPrice(product.price)}</span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.original_price)}
                        </span>
                      )}
                    </div>
                    
                    {hasIssue && (
                      <div className="p-2.5 bg-destructive/5 border border-destructive/20 rounded-lg text-xs text-destructive">
                        <strong>{product.status === 'rejected' ? 'Lý do từ chối:' : 'Yêu cầu chỉnh sửa:'}</strong>{' '}
                        {product.rejection_reason}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {canEdit && (
                        <>
                          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleEdit(product)}>
                            <Pencil className="h-3 w-3 mr-1" /> Sửa
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </>
                      )}
                      {product.status === 'approved' && (
                        <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
                          <a href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-3 w-3 mr-1" /> Xem trang
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Package className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold text-lg">
                {searchQuery ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm nào'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {searchQuery ? `Không có kết quả cho "${searchQuery}"` : 'Bắt đầu đăng sản phẩm để bán hàng'}
              </p>
              {!searchQuery && (
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" /> Đăng sản phẩm đầu tiên
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { setEditing(null); setForm(defaultForm); } }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Chỉnh sửa sản phẩm' : 'Đăng sản phẩm mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên sản phẩm <span className="text-destructive">*</span></Label>
                  <Input 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    placeholder="VD: Áo thun nam cao cấp"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Danh mục</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })} 
                  placeholder="Mô tả chi tiết sản phẩm..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Giá bán <span className="text-destructive">*</span></Label>
                  <Input 
                    type="number" 
                    value={form.price} 
                    onChange={(e) => setForm({ ...form, price: e.target.value })} 
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giá gốc</Label>
                  <Input 
                    type="number" 
                    value={form.original_price} 
                    onChange={(e) => setForm({ ...form, original_price: e.target.value })} 
                    placeholder="Để trống nếu không giảm giá"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tồn kho</Label>
                  <Input 
                    type="number" 
                    value={form.stock} 
                    onChange={(e) => setForm({ ...form, stock: e.target.value })} 
                    min="0"
                  />
                </div>
              </div>

              <ImageUpload 
                value={form.image_url} 
                onChange={(url) => setForm({ ...form, image_url: url })} 
                folder="products" 
                label="Ảnh đại diện" 
              />

              <MultiImageUpload 
                value={form.images} 
                onChange={(urls) => setForm({ ...form, images: urls })} 
                folder="products" 
                label="Ảnh chi tiết" 
                maxImages={8}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TagInput 
                  value={form.colors} 
                  onChange={(colors) => setForm({ ...form, colors })} 
                  label="Màu sắc" 
                  placeholder="VD: Đen, Trắng..."
                />
                <TagInput 
                  value={form.sizes} 
                  onChange={(sizes) => setForm({ ...form, sizes })} 
                  label="Kích thước" 
                  placeholder="VD: S, M, L..."
                />
              </div>

              <TagInput 
                value={form.tags} 
                onChange={(tags) => setForm({ ...form, tags })} 
                label="Tags" 
                placeholder="VD: hot, sale, new..."
              />

              {editing?.status === 'revision_requested' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-400">📝 Sản phẩm này cần chỉnh sửa</p>
                  {editing.rejection_reason && (
                    <p className="text-amber-700 dark:text-amber-500 mt-1">{editing.rejection_reason}</p>
                  )}
                  <p className="text-amber-600 dark:text-amber-500 mt-1 text-xs">Sau khi cập nhật, sản phẩm sẽ được gửi lại để duyệt.</p>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? 'Đang xử lý...' : editing ? 'Cập nhật sản phẩm' : 'Gửi duyệt sản phẩm'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
