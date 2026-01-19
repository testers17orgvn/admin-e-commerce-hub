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
import { Plus, Pencil, Trash2, Star, Flame, Eye, EyeOff, Link } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { MultiImageUpload } from '@/components/admin/MultiImageUpload';
import { TagInput } from '@/components/admin/TagInput';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Utility function to generate slug from Vietnamese text (client-side preview)
const generateSlug = (text: string): string => {
  const vietnameseMap: Record<string, string> = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ă': 'A', 'Ắ': 'A', 'Ằ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Â': 'A', 'Ấ': 'A', 'Ầ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ê': 'E', 'Ế': 'E', 'Ề': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ô': 'O', 'Ố': 'O', 'Ồ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ơ': 'O', 'Ớ': 'O', 'Ờ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ư': 'U', 'Ứ': 'U', 'Ừ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
    'Đ': 'D'
  };
  
  let result = text.split('').map(char => vietnameseMap[char] || char).join('');
  result = result.toLowerCase();
  result = result.replace(/[^a-z0-9]+/g, '-');
  result = result.replace(/^-+|-+$/g, '');
  return result || 'san-pham';
};

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
  name: '',
  slug: '',
  description: '',
  price: '',
  original_price: '',
  image_url: '',
  images: [],
  video_url: '',
  category_id: '',
  stock: '0',
  is_featured: false,
  is_active: true,
  is_hot: false,
  colors: [],
  sizes: [],
  tags: [],
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const data = {
      name: form.name,
      slug,
      description: form.description || null,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      image_url: form.image_url || (form.images.length > 0 ? form.images[0] : null),
      images: form.images,
      video_url: form.video_url || null,
      category_id: form.category_id || null,
      stock: Number(form.stock),
      is_featured: form.is_featured,
      is_active: form.is_active,
      is_hot: form.is_hot,
      colors: form.colors,
      sizes: form.sizes,
      tags: form.tags,
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
    setIsOpen(false);
    setEditingProduct(null);
    setForm(defaultForm);
    fetchData();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: String(product.price),
      original_price: product.original_price ? String(product.original_price) : '',
      image_url: product.image_url || '',
      images: product.images || [],
      video_url: (product as any).video_url || '',
      category_id: product.category_id || '',
      stock: String(product.stock),
      is_featured: product.is_featured,
      is_active: product.is_active,
      is_hot: product.is_hot || false,
      colors: product.colors || [],
      sizes: product.sizes || [],
      tags: product.tags || [],
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xác nhận xóa?')) return;
    await supabase.from('products').delete().eq('id', id);
    toast.success('Đã xóa');
    fetchData();
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from('products').update({ is_featured: !current }).eq('id', id);
    fetchData();
  };

  const toggleHot = async (id: string, current: boolean) => {
    await supabase.from('products').update({ is_hot: !current }).eq('id', id);
    fetchData();
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '-';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || '-';
  };

  const getDiscountPercent = (price: number, originalPrice: number | null) => {
    if (!originalPrice || originalPrice <= price) return null;
    return Math.round((1 - price / originalPrice) * 100);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sản phẩm</h1>
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
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
                  <TabsTrigger value="variants">Biến thể</TabsTrigger>
                  <TabsTrigger value="images">Hình ảnh</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Tên sản phẩm *</label>
                      <Input 
                        value={form.name} 
                        onChange={(e) => {
                          const newName = e.target.value;
                          setForm({ 
                            ...form, 
                            name: newName,
                            // Auto-generate slug preview if slug is empty
                            slug: form.slug || '' 
                          });
                        }} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Slug (URL)</label>
                      <Input 
                        value={form.slug} 
                        onChange={(e) => setForm({ ...form, slug: e.target.value })} 
                        placeholder="Tự động tạo từ tên" 
                      />
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
                      <label className="text-sm font-medium">Giá gốc (để tính giảm giá)</label>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <TagInput
                    value={form.tags}
                    onChange={(tags) => setForm({ ...form, tags })}
                    label="Nhãn / Tags"
                    placeholder="VD: Mới, Bán chạy, Limited..."
                  />

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

                <TabsContent value="variants" className="space-y-4 pt-4">
                  <TagInput
                    value={form.colors}
                    onChange={(colors) => setForm({ ...form, colors })}
                    label="Màu sắc"
                    placeholder="Nhập màu và Enter..."
                    colorMode
                  />
                  
                  <TagInput
                    value={form.sizes}
                    onChange={(sizes) => setForm({ ...form, sizes })}
                    label="Kích thước"
                    placeholder="VD: S, M, L, XL, 38, 39, 40..."
                  />
                </TabsContent>

                <TabsContent value="images" className="space-y-4 pt-4">
                  <ImageUpload
                    value={form.image_url}
                    onChange={(url) => setForm({ ...form, image_url: url })}
                    folder="products"
                    label="Ảnh đại diện (hiển thị trong danh sách)"
                  />
                  
                  <MultiImageUpload
                    value={form.images}
                    onChange={(images) => setForm({ ...form, images })}
                    folder="products"
                    label="Bộ sưu tập ảnh (hiển thị trong chi tiết sản phẩm)"
                    maxImages={10}
                  />

                  <div>
                    <label className="text-sm font-medium">Video review sản phẩm (URL YouTube hoặc video)</label>
                    <Input
                      value={form.video_url}
                      onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=... hoặc URL video trực tiếp"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Hỗ trợ YouTube, Vimeo hoặc link video trực tiếp (.mp4)
                    </p>
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

      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Sản phẩm</th>
                <th className="text-left p-3 text-sm font-medium">Danh mục</th>
                <th className="text-left p-3 text-sm font-medium">Giá</th>
                <th className="text-center p-3 text-sm font-medium">Tồn kho</th>
                <th className="text-center p-3 text-sm font-medium">Biến thể</th>
                <th className="text-center p-3 text-sm font-medium">Trạng thái</th>
                <th className="text-right p-3 text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const discount = getDiscountPercent(p.price, p.original_price);
                return (
                  <tr key={p.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {p.image_url && <img src={p.image_url} className="w-12 h-12 rounded-lg object-cover" />}
                          {p.is_hot && (
                            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] px-1 py-0.5 rounded-full flex items-center">
                              <Flame className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium block">{p.name}</span>
                          <div className="flex gap-1 mt-1">
                            {p.tags?.slice(0, 2).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {p.tags?.length > 2 && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                +{p.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {getCategoryName(p.category_id)}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(p.price)}₫</span>
                        {discount && (
                          <span className="text-xs text-green-600">-{discount}%</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={p.stock > 10 ? 'secondary' : p.stock > 0 ? 'outline' : 'destructive'}>
                        {p.stock}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col items-center gap-1">
                        {p.colors?.length > 0 && (
                          <div className="flex gap-0.5">
                            {p.colors.slice(0, 4).map((_, i) => (
                              <span key={i} className="w-3 h-3 rounded-full bg-muted border" />
                            ))}
                            {p.colors.length > 4 && <span className="text-[10px] text-muted-foreground">+{p.colors.length - 4}</span>}
                          </div>
                        )}
                        {p.sizes?.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {p.sizes.length} size
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toggleFeatured(p.id, p.is_featured)} title="Nổi bật">
                          <Star className={`h-4 w-4 ${p.is_featured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleHot(p.id, p.is_hot || false)} title="Hot">
                          <Flame className={`h-4 w-4 ${p.is_hot ? 'fill-orange-500 text-orange-500' : ''}`} />
                        </Button>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">Chưa có sản phẩm nào</div>
        )}
      </div>
    </AdminLayout>
  );
}
