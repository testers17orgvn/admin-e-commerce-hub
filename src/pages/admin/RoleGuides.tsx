import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { BookOpen, Save, Plus, Trash2, ChevronUp, ChevronDown, RotateCcw, Eye, GripVertical } from 'lucide-react';
import { ROLE_GUIDES, type GuideRole, type RoleGuideConfig, type GuideSection, type GuideItem } from '@/lib/roleGuideDefaults';

const ROLE_LABELS: Record<GuideRole, string> = { admin: 'Admin', seller: 'Seller', shipper: 'Shipper' };
const GRADIENTS = [
  'from-blue-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-violet-500 to-purple-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-red-500',
  'from-sky-500 to-cyan-500',
  'from-pink-500 to-rose-500',
];

function GuideEditor({ role }: { role: GuideRole }) {
  const [config, setConfig] = useState<RoleGuideConfig>(ROLE_GUIDES[role]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.from('settings').select('value').eq('key', `role_guide_${role}`).maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          try {
            const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            if (parsed?.sections) setConfig(parsed as RoleGuideConfig);
          } catch {}
        }
        setLoading(false);
      });
  }, [role]);

  const save = async () => {
    setSaving(true);
    const key = `role_guide_${role}`;
    const value = JSON.stringify(config);
    const { data: existing } = await supabase.from('settings').select('id').eq('key', key).maybeSingle();
    const op = existing
      ? supabase.from('settings').update({ value }).eq('key', key)
      : supabase.from('settings').insert([{ key, value }]);
    const { error } = await op;
    if (error) toast.error('Lỗi: ' + error.message);
    else toast.success(`Đã lưu hướng dẫn ${ROLE_LABELS[role]}`);
    setSaving(false);
  };

  const resetDefaults = () => {
    if (confirm('Khôi phục về mặc định? Thay đổi chưa lưu sẽ mất.')) {
      setConfig(ROLE_GUIDES[role]);
    }
  };

  const updateSection = (idx: number, patch: Partial<GuideSection>) => {
    setConfig({ ...config, sections: config.sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const next = [...config.sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setConfig({ ...config, sections: next });
  };

  const addSection = () => {
    setConfig({
      ...config,
      sections: [
        ...config.sections,
        {
          id: `section-${Date.now()}`,
          icon: 'Sparkles',
          title: 'Mục mới',
          gradient: GRADIENTS[config.sections.length % GRADIENTS.length],
          items: [],
        },
      ],
    });
  };

  const removeSection = (idx: number) => {
    if (!confirm('Xoá mục này?')) return;
    setConfig({ ...config, sections: config.sections.filter((_, i) => i !== idx) });
  };

  const updateItem = (sIdx: number, iIdx: number, patch: Partial<GuideItem>) => {
    const sections = [...config.sections];
    sections[sIdx] = {
      ...sections[sIdx],
      items: sections[sIdx].items.map((it, i) => (i === iIdx ? { ...it, ...patch } : it)),
    };
    setConfig({ ...config, sections });
  };

  const addItem = (sIdx: number) => {
    const sections = [...config.sections];
    sections[sIdx] = {
      ...sections[sIdx],
      items: [...sections[sIdx].items, { icon: 'Check', title: 'Bước mới', desc: '' }],
    };
    setConfig({ ...config, sections });
  };

  const removeItem = (sIdx: number, iIdx: number) => {
    const sections = [...config.sections];
    sections[sIdx] = { ...sections[sIdx], items: sections[sIdx].items.filter((_, i) => i !== iIdx) };
    setConfig({ ...config, sections });
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">Chỉnh sửa hướng dẫn {ROLE_LABELS[role]}</h3>
          <p className="text-sm text-muted-foreground">Icon dùng tên Lucide (ví dụ: Package, Truck, Star). Gradient: from-X-500 to-Y-500.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetDefaults}>
            <RotateCcw className="h-4 w-4 mr-1.5" /> Mặc định
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" /> {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Thông tin chung</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Tiêu đề</Label>
            <Input value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })} />
          </div>
          <div>
            <Label>Mô tả ngắn</Label>
            <Input value={config.subtitle} onChange={(e) => setConfig({ ...config, subtitle: e.target.value })} />
          </div>
          <div>
            <Label>Icon góc phải (Lucide)</Label>
            <Input value={config.accentIcon} onChange={(e) => setConfig({ ...config, accentIcon: e.target.value })} placeholder="Crown" />
          </div>
          <div>
            <Label>Gradient header</Label>
            <Input value={config.headerGradient} onChange={(e) => setConfig({ ...config, headerGradient: e.target.value })} placeholder="from-emerald-500/10 via-teal-500/10 to-emerald-500/10" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {config.sections.map((section, sIdx) => (
          <Card key={section.id} className="overflow-hidden">
            <CardHeader className="pb-3 bg-muted/40">
              <div className="flex items-start gap-2">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-2.5 shrink-0" />
                <div className="grid sm:grid-cols-[1fr_140px_220px] gap-2 flex-1">
                  <Input value={section.title} onChange={(e) => updateSection(sIdx, { title: e.target.value })} placeholder="Tiêu đề mục" />
                  <Input value={section.icon} onChange={(e) => updateSection(sIdx, { icon: e.target.value })} placeholder="Icon" />
                  <Input value={section.gradient} onChange={(e) => updateSection(sIdx, { gradient: e.target.value })} placeholder="from-blue-500 to-indigo-500" />
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => moveSection(sIdx, -1)} disabled={sIdx === 0}><ChevronUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => moveSection(sIdx, 1)} disabled={sIdx === config.sections.length - 1}><ChevronDown className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => removeSection(sIdx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {section.items.map((item, iIdx) => (
                <div key={iIdx} className="grid sm:grid-cols-[120px_1fr_2fr_auto] gap-2 items-start p-3 rounded-lg border bg-background">
                  <Input value={item.icon} onChange={(e) => updateItem(sIdx, iIdx, { icon: e.target.value })} placeholder="Icon" />
                  <Input value={item.title} onChange={(e) => updateItem(sIdx, iIdx, { title: e.target.value })} placeholder="Tiêu đề" />
                  <Textarea value={item.desc} onChange={(e) => updateItem(sIdx, iIdx, { desc: e.target.value })} placeholder="Mô tả" rows={2} />
                  <Button size="icon" variant="ghost" onClick={() => removeItem(sIdx, iIdx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addItem(sIdx)}><Plus className="h-4 w-4 mr-1.5" /> Thêm bước</Button>
            </CardContent>
          </Card>
        ))}
        <Button variant="outline" onClick={addSection} className="w-full"><Plus className="h-4 w-4 mr-1.5" /> Thêm mục mới</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Eye className="h-4 w-4" /> Xem trước</CardTitle>
          <CardDescription>Hiển thị giống trên Dashboard của role tương ứng.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-2xl">
            {/* Local preview using current state, not DB */}
            <PreviewWithConfig config={config} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewWithConfig({ config }: { config: RoleGuideConfig }) {
  return <RoleGuidePreview config={config} />;
}

function RoleGuidePreview({ config }: { config: RoleGuideConfig }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const Lucide = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const getIcon = (n: string) => Lucide[n] || Lucide.Circle;
  const Accent = getIcon(config.accentIcon);
  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className={`p-5 bg-gradient-to-r border-b ${config.headerGradient}`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center"><BookOpen className="h-5 w-5 text-primary-foreground" /></div>
          <div><h3 className="font-bold">{config.title}</h3><p className="text-xs text-muted-foreground">{config.subtitle}</p></div>
          <Accent className="h-6 w-6 text-primary/30 ml-auto" />
        </div>
      </div>
      <div className="divide-y">
        {config.sections.map((s, i) => {
          const Icon = getIcon(s.icon);
          const open = expandedId === s.id;
          return (
            <div key={s.id}>
              <button onClick={() => setExpandedId(open ? null : s.id)} className="w-full flex items-center gap-3 p-3 hover:bg-muted/50">
                <Badge variant="secondary">{i + 1}</Badge>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center`}><Icon className="h-4 w-4 text-white" /></div>
                <span className="font-semibold text-sm flex-1 text-left">{s.title}</span>
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {open && (
                <div className="px-3 pb-3 space-y-2">
                  {s.items.map((it, j) => {
                    const I = getIcon(it.icon);
                    return (
                      <div key={j} className="flex gap-3 p-2.5 rounded-lg bg-muted/40 border">
                        <div className="w-7 h-7 rounded-md bg-background border flex items-center justify-center shrink-0"><I className="h-3.5 w-3.5 text-primary" /></div>
                        <div><p className="text-sm font-medium">{it.title}</p><p className="text-xs text-muted-foreground">{it.desc}</p></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminRoleGuides() {
  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="h-6 w-6" /> Hướng dẫn theo Role</h1>
        <p className="text-muted-foreground">Chỉnh sửa nội dung hướng dẫn hiển thị trên Dashboard của Admin / Seller / Shipper.</p>
      </div>
      <Tabs defaultValue="admin" className="space-y-6">
        <TabsList>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="seller">Seller</TabsTrigger>
          <TabsTrigger value="shipper">Shipper</TabsTrigger>
        </TabsList>
        <TabsContent value="admin"><GuideEditor role="admin" /></TabsContent>
        <TabsContent value="seller"><GuideEditor role="seller" /></TabsContent>
        <TabsContent value="shipper"><GuideEditor role="shipper" /></TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
