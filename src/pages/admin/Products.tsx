import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', price: '', original_price: '', image_url: '', category_id: '', stock: '0', is_featured: false, is_active: true });

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
    const data = { ...form, slug, price: Number(form.price), original_price: form.original_price ? Number(form.original_price) : null, stock: Number(form.stock), category_id: form.category_id || null };
    
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
    setForm({ name: '', slug: '', description: '', price: '', original_price: '', image_url: '', category_id: '', stock: '0', is_featured: false, is_active: true });
    fetchData();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({ name: product.name, slug: product.slug, description: product.description || '', price: String(product.price), original_price: product.original_price ? String(product.original_price) : '', image_url: product.image_url || '', category_id: product.category_id || '', stock: String(product.stock), is_featured: product.is_featured, is_active: product.is_active });
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

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sản phẩm</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={() => { setEditingProduct(null); setForm({ name: '', slug: '', description: '', price: '', original_price: '', image_url: '', category_id: '', stock: '0', is_featured: false, is_active: true }); }}>
              <Plus className="h-4 w-4" /> Thêm sản phẩm
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Tên *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div><label className="text-sm font-medium">Slug</label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Auto-generate" /></div>
              </div>
              <div><label className="text-sm font-medium">Mô tả</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-sm font-medium">Giá *</label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
                <div><label className="text-sm font-medium">Giá gốc</label><Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} /></div>
                <div><label className="text-sm font-medium">Tồn kho</label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              </div>
              <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="products" label="Hình ảnh sản phẩm" />
              <div><label className="text-sm font-medium">Danh mục</label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(c) => setForm({ ...form, is_featured: c })} /><span className="text-sm">Nổi bật</span></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} /><span className="text-sm">Hiển thị</span></div>
              </div>
              <Button type="submit" variant="hero" className="w-full">{editingProduct ? 'Cập nhật' : 'Tạo mới'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50"><tr><th className="text-left p-3 text-sm font-medium">Sản phẩm</th><th className="text-left p-3 text-sm font-medium">Giá</th><th className="text-left p-3 text-sm font-medium">Tồn kho</th><th className="text-center p-3 text-sm font-medium">Nổi bật</th><th className="text-right p-3 text-sm font-medium">Thao tác</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3"><div className="flex items-center gap-3">{p.image_url && <img src={p.image_url} className="w-10 h-10 rounded object-cover" />}<span className="font-medium">{p.name}</span></div></td>
                <td className="p-3">{new Intl.NumberFormat('vi-VN').format(p.price)}₫</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 text-center"><Button variant="ghost" size="icon" onClick={() => toggleFeatured(p.id, p.is_featured)}><Star className={`h-4 w-4 ${p.is_featured ? 'fill-accent text-accent' : ''}`} /></Button></td>
                <td className="p-3 text-right"><Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <div className="p-8 text-center text-muted-foreground">Chưa có sản phẩm nào</div>}
      </div>
    </AdminLayout>
  );
}
