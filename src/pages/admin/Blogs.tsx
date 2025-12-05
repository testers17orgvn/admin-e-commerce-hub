import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Blog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ImageUpload } from '@/components/admin/ImageUpload';

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', excerpt: '', content: '', image_url: '', is_published: false });

  const fetchData = async () => {
    const { data } = await supabase.from('blogs').select('*').order('created_at', { ascending: false });
    setBlogs((data as Blog[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const data = { 
      ...form, 
      slug,
      published_at: form.is_published ? new Date().toISOString() : null 
    };
    
    if (editing) {
      const { error } = await supabase.from('blogs').update(data).eq('id', editing.id);
      if (error) { toast.error('Lỗi cập nhật'); return; }
      toast.success('Cập nhật thành công');
    } else {
      const { error } = await supabase.from('blogs').insert(data);
      if (error) { toast.error('Lỗi tạo bài viết'); return; }
      toast.success('Tạo bài viết thành công');
    }
    setIsOpen(false);
    setEditing(null);
    setForm({ title: '', slug: '', excerpt: '', content: '', image_url: '', is_published: false });
    fetchData();
  };

  const handleEdit = (blog: Blog) => {
    setEditing(blog);
    setForm({ title: blog.title, slug: blog.slug, excerpt: blog.excerpt || '', content: blog.content || '', image_url: blog.image_url || '', is_published: blog.is_published });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xác nhận xóa bài viết này?')) return;
    await supabase.from('blogs').delete().eq('id', id);
    toast.success('Đã xóa');
    fetchData();
  };

  const togglePublished = async (id: string, current: boolean) => {
    await supabase.from('blogs').update({ is_published: !current, published_at: !current ? new Date().toISOString() : null }).eq('id', id);
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Blog</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={() => { setEditing(null); setForm({ title: '', slug: '', excerpt: '', content: '', image_url: '', is_published: false }); }}>
              <Plus className="h-4 w-4" /> Thêm bài viết
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? 'Sửa bài viết' : 'Thêm bài viết'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-sm font-medium">Tiêu đề *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><label className="text-sm font-medium">Slug</label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Tự động tạo" /></div>
              <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} folder="blogs" label="Hình ảnh bài viết" />
              <div><label className="text-sm font-medium">Tóm tắt</label><Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} /></div>
              <div><label className="text-sm font-medium">Nội dung</label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(c) => setForm({ ...form, is_published: c })} /><span className="text-sm">Xuất bản</span></div>
              <Button type="submit" variant="hero" className="w-full">{editing ? 'Cập nhật' : 'Tạo mới'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Bài viết</th>
              <th className="text-left p-3 text-sm font-medium">Ngày tạo</th>
              <th className="text-center p-3 text-sm font-medium">Trạng thái</th>
              <th className="text-right p-3 text-sm font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {b.image_url && <img src={b.image_url} className="w-16 h-10 rounded object-cover" />}
                    <div>
                      <span className="font-medium">{b.title}</span>
                      {b.excerpt && <p className="text-sm text-muted-foreground line-clamp-1">{b.excerpt}</p>}
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground text-sm">{format(new Date(b.created_at), 'dd/MM/yyyy')}</td>
                <td className="p-3 text-center">
                  <Button variant="ghost" size="sm" onClick={() => togglePublished(b.id, b.is_published)} className={b.is_published ? 'text-green-500' : 'text-muted-foreground'}>
                    {b.is_published ? <><Eye className="h-4 w-4 mr-1" /> Đã xuất bản</> : <><EyeOff className="h-4 w-4 mr-1" /> Nháp</>}
                  </Button>
                </td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {blogs.length === 0 && <div className="p-8 text-center text-muted-foreground">Chưa có bài viết nào</div>}
      </div>
    </AdminLayout>
  );
}
