import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Eye, EyeOff, Clock, User, Tag, Search as SearchIcon, Globe, FileText, Image as ImageIcon } from 'lucide-react';
import { generateSlug } from '@/lib/slugify';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { TagInput } from '@/components/admin/TagInput';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
  author_name: string | null;
  author_avatar: string | null;
  tags: string[] | null;
  category: string | null;
  reading_time: number | null;
  meta_title: string | null;
  meta_description: string | null;
  view_count: number | null;
}

interface BlogForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  is_published: boolean;
  author_name: string;
  author_avatar: string;
  tags: string[];
  category: string;
  reading_time: number;
  meta_title: string;
  meta_description: string;
}

const BLOG_CATEGORIES = [
  'Tin tức',
  'Hướng dẫn',
  'Đánh giá',
  'Xu hướng',
  'Khuyến mãi',
  'Mẹo vặt',
  'Lifestyle',
  'Công nghệ',
];

const initialForm: BlogForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  image_url: '',
  is_published: false,
  author_name: '',
  author_avatar: '',
  tags: [],
  category: '',
  reading_time: 5,
  meta_title: '',
  meta_description: '',
};

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [form, setForm] = useState<BlogForm>(initialForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchData = async () => {
    const { data } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });
    setBlogs((data as Blog[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Tự động tính thời gian đọc
  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  const handleContentChange = (content: string) => {
    setForm(prev => ({
      ...prev,
      content,
      reading_time: calculateReadingTime(content),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || generateSlug(form.title, 'bai-viet');
    const data = { 
      title: form.title,
      slug,
      excerpt: form.excerpt || null,
      content: form.content || null,
      image_url: form.image_url || null,
      is_published: form.is_published,
      published_at: form.is_published ? new Date().toISOString() : null,
      author_name: form.author_name || null,
      author_avatar: form.author_avatar || null,
      tags: form.tags.length > 0 ? form.tags : null,
      category: form.category || null,
      reading_time: form.reading_time,
      meta_title: form.meta_title || form.title,
      meta_description: form.meta_description || form.excerpt,
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
    setForm(initialForm);
    fetchData();
  };

  const handleEdit = (blog: Blog) => {
    setEditing(blog);
    setForm({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      image_url: blog.image_url || '',
      is_published: blog.is_published,
      author_name: blog.author_name || '',
      author_avatar: blog.author_avatar || '',
      tags: blog.tags || [],
      category: blog.category || '',
      reading_time: blog.reading_time || 5,
      meta_title: blog.meta_title || '',
      meta_description: blog.meta_description || '',
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xác nhận xóa bài viết này?')) return;
    await supabase.from('blogs').delete().eq('id', id);
    toast.success('Đã xóa');
    fetchData();
  };

  const togglePublished = async (id: string, current: boolean) => {
    await supabase.from('blogs').update({ 
      is_published: !current, 
      published_at: !current ? new Date().toISOString() : null 
    }).eq('id', id);
    fetchData();
    toast.success(!current ? 'Đã xuất bản' : 'Đã chuyển sang nháp');
  };

  // Filter blogs
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || blog.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'published' && blog.is_published) ||
                          (filterStatus === 'draft' && !blog.is_published);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Blog</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={() => { setEditing(null); setForm(initialForm); }}>
              <Plus className="h-4 w-4" /> Thêm bài viết
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{editing ? 'Sửa bài viết' : 'Thêm bài viết mới'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="content" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content" className="gap-2">
                    <FileText className="h-4 w-4" /> Nội dung
                  </TabsTrigger>
                  <TabsTrigger value="media" className="gap-2">
                    <ImageIcon className="h-4 w-4" /> Media & Tác giả
                  </TabsTrigger>
                  <TabsTrigger value="seo" className="gap-2">
                    <Globe className="h-4 w-4" /> SEO
                  </TabsTrigger>
                </TabsList>

                {/* Tab Nội dung */}
                <TabsContent value="content" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Tiêu đề *</Label>
                      <Input 
                        value={form.title} 
                        onChange={(e) => setForm({ ...form, title: e.target.value })} 
                        required 
                        placeholder="Nhập tiêu đề bài viết"
                        className="text-lg"
                      />
                    </div>
                    <div>
                      <Label>Slug (URL)</Label>
                      <Input 
                        value={form.slug} 
                        onChange={(e) => setForm({ ...form, slug: e.target.value })} 
                        placeholder="tu-dong-tao-tu-tieu-de"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Để trống sẽ tự động tạo từ tiêu đề</p>
                    </div>
                    <div>
                      <Label>Danh mục</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOG_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <TagInput 
                      value={form.tags} 
                      onChange={(tags) => setForm({ ...form, tags })}
                      placeholder="Nhập tag và nhấn Enter"
                    />
                  </div>

                  <div>
                    <Label>Tóm tắt</Label>
                    <Textarea 
                      value={form.excerpt} 
                      onChange={(e) => setForm({ ...form, excerpt: e.target.value })} 
                      rows={3}
                      placeholder="Mô tả ngắn gọn về nội dung bài viết (hiển thị ở trang danh sách)"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Nội dung</Label>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~{form.reading_time} phút đọc
                      </span>
                    </div>
                    <RichTextEditor 
                      value={form.content} 
                      onChange={handleContentChange}
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="published"
                        checked={form.is_published} 
                        onCheckedChange={(c) => setForm({ ...form, is_published: c })} 
                      />
                      <Label htmlFor="published" className="cursor-pointer">
                        {form.is_published ? 'Xuất bản ngay' : 'Lưu nháp'}
                      </Label>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab Media & Tác giả */}
                <TabsContent value="media" className="space-y-6 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" /> Ảnh bìa
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ImageUpload 
                        value={form.image_url} 
                        onChange={(url) => setForm({ ...form, image_url: url })} 
                        folder="blogs" 
                        label="Ảnh đại diện bài viết"
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" /> Thông tin tác giả
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Tên tác giả</Label>
                          <Input 
                            value={form.author_name} 
                            onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                            placeholder="Nguyễn Văn A"
                          />
                        </div>
                        <div>
                          <Label>Thời gian đọc (phút)</Label>
                          <Input 
                            type="number"
                            min={1}
                            value={form.reading_time} 
                            onChange={(e) => setForm({ ...form, reading_time: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>
                      <ImageUpload 
                        value={form.author_avatar} 
                        onChange={(url) => setForm({ ...form, author_avatar: url })} 
                        folder="authors" 
                        label="Avatar tác giả"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tab SEO */}
                <TabsContent value="seo" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Tối ưu hóa SEO
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Meta Title</Label>
                        <Input 
                          value={form.meta_title} 
                          onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                          placeholder="Tiêu đề hiển thị trên Google (để trống sẽ dùng tiêu đề bài viết)"
                          maxLength={60}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {form.meta_title.length}/60 ký tự
                        </p>
                      </div>
                      <div>
                        <Label>Meta Description</Label>
                        <Textarea 
                          value={form.meta_description} 
                          onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                          placeholder="Mô tả hiển thị trên Google (để trống sẽ dùng tóm tắt)"
                          maxLength={160}
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {form.meta_description.length}/160 ký tự
                        </p>
                      </div>

                      {/* Preview SEO */}
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">Xem trước trên Google:</p>
                        <div className="space-y-1">
                          <p className="text-blue-600 text-lg hover:underline cursor-pointer">
                            {form.meta_title || form.title || 'Tiêu đề bài viết'}
                          </p>
                          <p className="text-green-700 text-sm">
                            example.com/blog/{form.slug || 'duong-dan-bai-viet'}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {form.meta_description || form.excerpt || 'Mô tả ngắn về bài viết sẽ hiển thị ở đây...'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="hero">
                  {editing ? 'Cập nhật' : 'Tạo bài viết'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {BLOG_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="published">Đã xuất bản</SelectItem>
            <SelectItem value="draft">Nháp</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Blog List */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Bài viết</th>
              <th className="text-left p-3 text-sm font-medium hidden md:table-cell">Danh mục</th>
              <th className="text-left p-3 text-sm font-medium hidden lg:table-cell">Tác giả</th>
              <th className="text-center p-3 text-sm font-medium hidden sm:table-cell">Lượt xem</th>
              <th className="text-center p-3 text-sm font-medium">Trạng thái</th>
              <th className="text-right p-3 text-sm font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredBlogs.map((b) => (
              <tr key={b.id} className="border-t hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {b.image_url ? (
                      <img src={b.image_url} className="w-20 h-14 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-14 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium line-clamp-1">{b.title}</p>
                      {b.excerpt && <p className="text-sm text-muted-foreground line-clamp-1">{b.excerpt}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {b.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(b.tags?.length || 0) > 2 && (
                          <span className="text-xs text-muted-foreground">+{b.tags!.length - 2}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3 hidden md:table-cell">
                  {b.category ? (
                    <Badge variant="outline">{b.category}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </td>
                <td className="p-3 hidden lg:table-cell">
                  {b.author_name ? (
                    <div className="flex items-center gap-2">
                      {b.author_avatar ? (
                        <img src={b.author_avatar} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-3 w-3" />
                        </div>
                      )}
                      <span className="text-sm">{b.author_name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </td>
                <td className="p-3 text-center hidden sm:table-cell">
                  <span className="text-sm text-muted-foreground">{b.view_count || 0}</span>
                </td>
                <td className="p-3 text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => togglePublished(b.id, b.is_published)} 
                    className={b.is_published ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground'}
                  >
                    {b.is_published ? (
                      <><Eye className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Đã xuất bản</span></>
                    ) : (
                      <><EyeOff className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Nháp</span></>
                    )}
                  </Button>
                </td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredBlogs.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all' 
              ? 'Không tìm thấy bài viết phù hợp' 
              : 'Chưa có bài viết nào'}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
