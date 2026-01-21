import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package, Clock, CheckCircle, XCircle, AlertCircle, Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { MultiImageUpload } from '@/components/admin/MultiImageUpload';
import { TagInput } from '@/components/admin/TagInput';
import { cn } from '@/lib/utils';

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
  pending: { label: 'Chờ duyệt', icon: Clock, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved: { label: 'Đã duyệt', icon: CheckCircle, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Từ chối', icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  revision_requested: { label: 'Cần chỉnh sửa', icon: AlertCircle, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
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

    setSubmitting(true);
    const productData = {
      seller_id: user.id,
      name: form.name,
      slug: '', // Auto-generated
      description: form.description || null,
      price: Number(form.price) || 0,
      original_price: form.original_price ? Number(form.original_price) : null,
      category_id: form.category_id || null,
      image_url: form.image_url || null,
      images: form.images,
      colors: form.colors,
      sizes: form.sizes,
      tags: form.tags,
      stock: Number(form.stock) || 0,
      status: 'pending' as const,
    };

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
    if (activeTab === 'all') return products;
    return products.filter(p => p.status === activeTab);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-16 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!isSeller) return null;

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display">Sản phẩm của tôi</h1>
            <p className="text-muted-foreground mt-1">Quản lý sản phẩm và theo dõi trạng thái duyệt</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" onClick={() => { setEditing(null); setForm(defaultForm); }}>
                <Plus className="h-4 w-4" /> Đăng sản phẩm
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Chỉnh sửa sản phẩm' : 'Đăng sản phẩm mới'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tên sản phẩm *</Label>
                    <Input 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })} 
                      placeholder="VD: Áo thun nam cao cấp"
                      required 
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
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Giá bán *</Label>
                    <Input 
                      type="number" 
                      value={form.price} 
                      onChange={(e) => setForm({ ...form, price: e.target.value })} 
                      placeholder="0"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Giá gốc</Label>
                    <Input 
                      type="number" 
                      value={form.original_price} 
                      onChange={(e) => setForm({ ...form, original_price: e.target.value })} 
                      placeholder="Để trống nếu không giảm giá"
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

                <Button type="submit" variant="hero" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : editing ? 'Cập nhật sản phẩm' : 'Gửi duyệt sản phẩm'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const count = products.filter(p => p.status === status).length;
            const Icon = config.icon;
            return (
              <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab(status)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", config.color.split(' ')[0])}>
                      <Icon className={cn("h-5 w-5", config.color.split(' ').slice(1).join(' '))} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-muted-foreground">{config.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Tất cả ({products.length})</TabsTrigger>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <TabsTrigger key={status} value={status}>
                {config.label} ({products.filter(p => p.status === status).length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getFilteredProducts().map((product) => {
            const statusConfig = STATUS_CONFIG[product.status];
            const StatusIcon = statusConfig.icon;
            return (
              <Card key={product.id} className="overflow-hidden group">
                <div className="relative aspect-square">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-accent">{formatPrice(product.price)}</span>
                    {product.original_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.original_price)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Tồn kho: {product.stock}</p>
                  
                  {product.status === 'rejected' && product.rejection_reason && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600 dark:text-red-400">
                      <strong>Lý do từ chối:</strong> {product.rejection_reason}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    {(product.status === 'pending' || product.status === 'revision_requested') && (
                      <>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(product)}>
                          <Pencil className="h-3 w-3 mr-1" /> Sửa
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </>
                    )}
                    {product.status === 'approved' && (
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={`/products/${product.slug}`} target="_blank">
                          <Eye className="h-3 w-3 mr-1" /> Xem
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {getFilteredProducts().length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Chưa có sản phẩm nào</h3>
              <p className="text-muted-foreground mt-1">Bắt đầu đăng sản phẩm để bán hàng</p>
              <Button variant="hero" className="mt-4" onClick={() => setIsOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Đăng sản phẩm đầu tiên
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
