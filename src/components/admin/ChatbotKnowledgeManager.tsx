import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, Pencil, Trash2, Save, X, Search, Flame, ArrowUpDown, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

type Priority = 'high' | 'medium' | 'low';

interface KBItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  priority: Priority;
}

const DEFAULT_CATEGORIES = ['FAQ', 'Chính sách', 'Sản phẩm', 'Vận chuyển', 'Thanh toán', 'Khác'];

const PRIORITY_META: Record<Priority, { label: string; weight: number; badgeClass: string; icon?: any }> = {
  high:   { label: 'Cao',        weight: 0, badgeClass: 'bg-red-500/15 text-red-600 border-red-500/30',         icon: Flame },
  medium: { label: 'Bình thường', weight: 1, badgeClass: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  low:    { label: 'Thấp',        weight: 2, badgeClass: 'bg-muted text-muted-foreground border-border' },
};

export function ChatbotKnowledgeManager() {
  const [items, setItems] = useState<KBItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string>('all');
  const [activePriority, setActivePriority] = useState<'all' | Priority>('all');
  const [groupMode, setGroupMode] = useState<'category' | 'priority'>('category');
  const [editing, setEditing] = useState<KBItem | null>(null);
  const [draft, setDraft] = useState<Partial<KBItem>>({
    category: 'FAQ', question: '', answer: '', sort_order: 0, is_active: true, priority: 'medium',
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chatbot_knowledge')
      .select('*')
      .order('priority', { ascending: true })
      .order('sort_order', { ascending: true });
    if (error) toast.error(error.message);
    setItems((data as KBItem[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    items.forEach(i => set.add(i.category));
    return Array.from(set);
  }, [items]);

  const filtered = items.filter(i =>
    (activeCat === 'all' || i.category === activeCat) &&
    (activePriority === 'all' || i.priority === activePriority) &&
    (!search || i.question.toLowerCase().includes(search.toLowerCase()) || i.answer.toLowerCase().includes(search.toLowerCase()))
  );

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const pw = PRIORITY_META[a.priority].weight - PRIORITY_META[b.priority].weight;
      if (pw !== 0) return pw;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  }, [filtered]);

  const grouped = useMemo(() => {
    const g: Record<string, KBItem[]> = {};
    sortedFiltered.forEach(i => {
      const key = groupMode === 'category' ? i.category : `${PRIORITY_META[i.priority].label} (ưu tiên ${i.priority === 'high' ? 'cao' : i.priority === 'medium' ? 'thường' : 'thấp'})`;
      (g[key] ||= []).push(i);
    });
    return g;
  }, [sortedFiltered, groupMode]);

  const resetDraft = () => {
    setEditing(null);
    setDraft({ category: activeCat !== 'all' ? activeCat : 'FAQ', question: '', answer: '', sort_order: 0, is_active: true, priority: 'medium' });
  };

  const save = async () => {
    if (!draft.question?.trim() || !draft.answer?.trim()) {
      toast.error('Câu hỏi và trả lời không được trống');
      return;
    }
    const payload = {
      category: (draft.category || 'FAQ').trim(),
      question: draft.question!.trim(),
      answer: draft.answer!.trim(),
      sort_order: Number(draft.sort_order) || 0,
      is_active: draft.is_active ?? true,
      priority: (draft.priority || 'medium') as Priority,
    };
    const op = editing
      ? supabase.from('chatbot_knowledge').update(payload).eq('id', editing.id)
      : supabase.from('chatbot_knowledge').insert([payload]);
    const { error } = await op;
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? 'Đã cập nhật' : 'Đã thêm mục mới');
    resetDraft();
    load();
  };

  const startEdit = (it: KBItem) => {
    setEditing(it);
    setDraft({ ...it });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá mục này?')) return;
    const { error } = await supabase.from('chatbot_knowledge').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Đã xoá'); load(); }
  };

  const toggleActive = async (it: KBItem) => {
    const { error } = await supabase.from('chatbot_knowledge').update({ is_active: !it.is_active }).eq('id', it.id);
    if (error) toast.error(error.message);
    else load();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> {editing ? 'Sửa mục kiến thức' : 'Thêm mục kiến thức mới'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tổ chức theo từng mục để bot trả lời chính xác hơn (FAQ, chính sách, sản phẩm…).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Mục</Label>
              <Select value={draft.category} onValueChange={(v) => setDraft(d => ({ ...d, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                className="mt-2"
                placeholder="Hoặc nhập mục mới..."
                value={draft.category || ''}
                onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))}
              />
            </div>
            <div>
              <Label>Thứ tự hiển thị</Label>
              <Input
                type="number"
                value={draft.sort_order ?? 0}
                onChange={(e) => setDraft(d => ({ ...d, sort_order: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-end gap-2">
              <Switch
                id="kb-active"
                checked={draft.is_active ?? true}
                onCheckedChange={(v) => setDraft(d => ({ ...d, is_active: v }))}
              />
              <Label htmlFor="kb-active">Kích hoạt</Label>
            </div>
          </div>
          <div>
            <Label>Câu hỏi / Tiêu đề</Label>
            <Input
              value={draft.question || ''}
              onChange={(e) => setDraft(d => ({ ...d, question: e.target.value }))}
              placeholder="VD: Phí vận chuyển bao nhiêu?"
            />
          </div>
          <div>
            <Label>Câu trả lời / Nội dung</Label>
            <Textarea
              rows={5}
              value={draft.answer || ''}
              onChange={(e) => setDraft(d => ({ ...d, answer: e.target.value }))}
              placeholder="VD: Nội thành 25k, ngoại thành 35k. Miễn phí cho đơn từ 500k."
            />
          </div>
          <div className="flex gap-2 justify-end">
            {editing && (
              <Button variant="outline" onClick={resetDraft}>
                <X className="h-4 w-4 mr-2" /> Huỷ
              </Button>
            )}
            <Button onClick={save}>
              {editing ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {editing ? 'Lưu thay đổi' : 'Thêm mục'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle>Danh sách kiến thức ({items.length})</CardTitle>
            <div className="flex gap-2 flex-1 md:max-w-md">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Tìm kiếm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={activeCat} onValueChange={setActiveCat}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mục</SelectItem>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Đang tải...</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center text-muted-foreground py-8">Chưa có mục nào. Hãy thêm mục đầu tiên ở trên.</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([cat, list]) => (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{cat}</h4>
                    <Badge variant="secondary">{list.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {list.map(it => (
                      <div
                        key={it.id}
                        className={`p-3 rounded-lg border bg-card hover:border-accent/40 transition ${!it.is_active ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{it.question}</div>
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{it.answer}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Switch checked={it.is_active} onCheckedChange={() => toggleActive(it)} />
                            <Button size="icon" variant="ghost" onClick={() => startEdit(it)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => remove(it.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
