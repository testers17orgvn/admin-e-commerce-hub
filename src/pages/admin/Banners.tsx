import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Banner } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '', position: '0', is_active: true });

  const fetchData = async () => {
    const { data } = await supabase.from('banners').select('*').order('position');
    setBanners((data as Banner[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, position: Number(form.position) };
    
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
    setForm({ title: '', subtitle: '', image_url: '', link_url: '', position: '0', is_active: true });
    fetchData();
  };

  const handleEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({ title: banner.title, subtitle: banner.subtitle || '', image_url: banner.image_url, link_url: banner.link_url || '', position: String(banner.position), is_active: banner.is_active });
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

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Banner</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={() => { setEditing(null); setForm({ title: '', subtitle: '', image_url: '', link_url: '', position: '0', is_active: true }); }}>
              <Plus className="h-4 w-4" /> Thêm banner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Sửa banner' : 'Thêm banner'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-sm font-medium">Tiêu đề *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><label className="text-sm font-medium">Phụ đề</label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
              <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="banners" label="Hình ảnh banner *" />
              <div><label className="text-sm font-medium">URL liên kết</label><Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">Vị trí</label><Input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
                <div className="flex items-center gap-2 pt-6"><Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} /><span className="text-sm">Hiển thị</span></div>
              </div>
              <Button type="submit" variant="hero" className="w-full">{editing ? 'Cập nhật' : 'Tạo mới'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {banners.map((b) => (
          <div key={b.id} className="bg-card rounded-lg border p-4 flex items-center gap-4">
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            {b.image_url && <img src={b.image_url} className="w-32 h-20 rounded object-cover" />}
            <div className="flex-1">
              <h3 className="font-medium">{b.title}</h3>
              {b.subtitle && <p className="text-sm text-muted-foreground">{b.subtitle}</p>}
            </div>
            <Switch checked={b.is_active} onCheckedChange={() => toggleActive(b.id, b.is_active)} />
            <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        {banners.length === 0 && <div className="p-8 text-center text-muted-foreground bg-card rounded-lg border">Chưa có banner nào</div>}
      </div>
    </AdminLayout>
  );
}
