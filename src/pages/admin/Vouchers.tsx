import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Pencil, Trash2, Ticket, Copy, Percent, DollarSign, Calendar,
  Users, Gift, Search, Filter, TrendingUp, Clock, CheckCircle2,
  XCircle, AlertCircle, BarChart3, Zap, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

const initialVoucher: {
  code: string; name: string; description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number; min_order_value: number; max_discount: number;
  usage_limit: number; start_date: string; end_date: string; is_active: boolean;
} = {
  code: '',
  name: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 0,
  min_order_value: 0,
  max_discount: 0,
  usage_limit: 0,
  start_date: '',
  end_date: '',
  is_active: true,
};

type StatusFilter = 'all' | 'active' | 'inactive' | 'expired' | 'upcoming';

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [formData, setFormData] = useState(initialVoucher);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedVouchers, setSelectedVouchers] = useState<Set<string>>(new Set());
  const [detailVoucher, setDetailVoucher] = useState<Voucher | null>(null);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Lỗi tải danh sách voucher');
    } else if (data) {
      setVouchers(data.map(v => ({ ...v, discount_type: v.discount_type as 'percentage' | 'fixed' })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.start_date || !formData.end_date) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setSaving(true);
    const voucherData = {
      code: formData.code.toUpperCase(),
      name: formData.name,
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      min_order_value: formData.min_order_value || 0,
      max_discount: formData.max_discount || null,
      usage_limit: formData.usage_limit || null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      is_active: formData.is_active,
    };

    let error;
    if (editingVoucher) {
      const result = await supabase.from('vouchers').update(voucherData).eq('id', editingVoucher.id);
      error = result.error;
    } else {
      const result = await supabase.from('vouchers').insert([voucherData]);
      error = result.error;
    }

    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Mã voucher đã tồn tại' : 'Lỗi lưu voucher');
    } else {
      toast.success(editingVoucher ? 'Cập nhật thành công' : 'Tạo voucher thành công');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa voucher này?')) return;
    const { error } = await supabase.from('vouchers').delete().eq('id', id);
    if (error) toast.error('Lỗi xóa voucher');
    else { toast.success('Đã xóa voucher'); fetchData(); }
  };

  const handleBulkDelete = async () => {
    if (selectedVouchers.size === 0) return;
    if (!confirm(`Xóa ${selectedVouchers.size} voucher đã chọn?`)) return;
    const ids = Array.from(selectedVouchers);
    const { error } = await supabase.from('vouchers').delete().in('id', ids);
    if (error) toast.error('Lỗi xóa hàng loạt');
    else { toast.success(`Đã xóa ${ids.length} voucher`); setSelectedVouchers(new Set()); fetchData(); }
  };

  const handleBulkToggle = async (active: boolean) => {
    if (selectedVouchers.size === 0) return;
    const ids = Array.from(selectedVouchers);
    const { error } = await supabase.from('vouchers').update({ is_active: active }).in('id', ids);
    if (error) toast.error('Lỗi cập nhật');
    else { toast.success(`Đã ${active ? 'bật' : 'tắt'} ${ids.length} voucher`); setSelectedVouchers(new Set()); fetchData(); }
  };

  const toggleActive = async (voucher: Voucher) => {
    await supabase.from('vouchers').update({ is_active: !voucher.is_active }).eq('id', voucher.id);
    fetchData();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã sao chép: ' + code);
  };

  const resetForm = () => { setFormData(initialVoucher); setEditingVoucher(null); };

  const openEditDialog = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      name: voucher.name,
      description: voucher.description || '',
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      min_order_value: voucher.min_order_value,
      max_discount: voucher.max_discount || 0,
      usage_limit: voucher.usage_limit || 0,
      start_date: voucher.start_date.slice(0, 16),
      end_date: voucher.end_date.slice(0, 16),
      is_active: voucher.is_active,
    });
    setIsDialogOpen(true);
  };

  const getVoucherStatus = (voucher: Voucher) => {
    const now = new Date();
    const start = new Date(voucher.start_date);
    const end = new Date(voucher.end_date);
    if (!voucher.is_active) return { label: 'Tắt', variant: 'secondary' as const, icon: XCircle, color: 'text-muted-foreground' };
    if (now < start) return { label: 'Sắp tới', variant: 'outline' as const, icon: Clock, color: 'text-blue-500' };
    if (now > end) return { label: 'Hết hạn', variant: 'destructive' as const, icon: AlertCircle, color: 'text-destructive' };
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) return { label: 'Hết lượt', variant: 'destructive' as const, icon: AlertCircle, color: 'text-destructive' };
    return { label: 'Hoạt động', variant: 'default' as const, icon: CheckCircle2, color: 'text-green-500' };
  };

  const getStatusKey = (voucher: Voucher): StatusFilter => {
    const now = new Date();
    if (!voucher.is_active) return 'inactive';
    if (now < new Date(voucher.start_date)) return 'upcoming';
    if (now > new Date(voucher.end_date)) return 'expired';
    return 'active';
  };

  // Filtering
  const filtered = vouchers.filter(v => {
    const matchSearch = !searchQuery ||
      v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || getStatusKey(v) === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: vouchers.length,
    active: vouchers.filter(v => getStatusKey(v) === 'active').length,
    expired: vouchers.filter(v => getStatusKey(v) === 'expired').length,
    used: vouchers.reduce((acc, v) => acc + v.used_count, 0),
    totalDiscount: vouchers.reduce((acc, v) => {
      if (v.discount_type === 'fixed') return acc + v.discount_value * v.used_count;
      return acc;
    }, 0),
  };

  const toggleSelect = (id: string) => {
    setSelectedVouchers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedVouchers.size === filtered.length) {
      setSelectedVouchers(new Set());
    } else {
      setSelectedVouchers(new Set(filtered.map(v => v.id)));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 flex flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Đang tải voucher...</p>
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
              <Ticket className="h-6 w-6 text-accent" />
            </div>
            Quản lý Voucher
          </h1>
          <p className="text-muted-foreground mt-1">Tạo và quản lý mã giảm giá cho khách hàng</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20">
              <Plus className="h-4 w-4 mr-2" /> Tạo Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-accent" />
                {editingVoucher ? 'Chỉnh sửa Voucher' : 'Tạo Voucher mới'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mã voucher *</Label>
                  <div className="flex gap-2">
                    <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="VD: SALE50" className="uppercase font-mono" />
                    <Button type="button" variant="outline" onClick={generateCode} className="shrink-0">
                      <Zap className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tên voucher *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Giảm 50% đơn hàng" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loại giảm giá</Label>
                  <Select value={formData.discount_type} onValueChange={(v: 'percentage' | 'fixed') => setFormData({ ...formData, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage"><span className="flex items-center gap-2"><Percent className="h-4 w-4" /> Phần trăm (%)</span></SelectItem>
                      <SelectItem value="fixed"><span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Số tiền (đ)</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Giá trị giảm *</Label>
                  <Input type="number" value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Đơn tối thiểu (đ)</Label>
                  <Input type="number" value={formData.min_order_value} onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Giảm tối đa (đ)</Label>
                  <Input type="number" value={formData.max_discount} onChange={(e) => setFormData({ ...formData, max_discount: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bắt đầu *</Label>
                  <Input type="datetime-local" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Kết thúc *</Label>
                  <Input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giới hạn sử dụng</Label>
                  <Input type="number" value={formData.usage_limit} onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })} placeholder="0 = không giới hạn" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                  <Label>Kích hoạt ngay</Label>
                </div>
              </div>

              {/* Preview card */}
              {formData.code && (
                <div className="p-4 rounded-xl border-2 border-dashed border-accent/30 bg-accent/5">
                  <p className="text-xs text-muted-foreground mb-2">Xem trước</p>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-accent/10">
                      {formData.discount_type === 'percentage' ? <Percent className="h-5 w-5 text-accent" /> : <DollarSign className="h-5 w-5 text-accent" />}
                    </div>
                    <div>
                      <p className="font-bold text-lg">
                        {formData.discount_type === 'percentage' ? `${formData.discount_value}%` : `${formData.discount_value.toLocaleString('vi-VN')}đ`}
                      </p>
                      <p className="text-sm text-muted-foreground">{formData.name || 'Tên voucher'}</p>
                    </div>
                    <code className="ml-auto bg-muted px-3 py-1.5 rounded-lg font-mono text-sm font-bold tracking-wider">{formData.code}</code>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                <Button type="submit" disabled={saving} className="bg-accent hover:bg-accent/90">
                  {saving ? 'Đang lưu...' : (editingVoucher ? 'Cập nhật' : 'Tạo Voucher')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng voucher', value: stats.total, icon: Ticket, gradient: 'from-blue-500/10 to-blue-600/5', iconColor: 'text-blue-500' },
          { label: 'Đang hoạt động', value: stats.active, icon: CheckCircle2, gradient: 'from-green-500/10 to-green-600/5', iconColor: 'text-green-500' },
          { label: 'Đã hết hạn', value: stats.expired, icon: AlertCircle, gradient: 'from-red-500/10 to-red-600/5', iconColor: 'text-red-500' },
          { label: 'Lượt sử dụng', value: stats.used, icon: TrendingUp, gradient: 'from-purple-500/10 to-purple-600/5', iconColor: 'text-purple-500' },
        ].map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-4">
              <div className={`flex items-center gap-3`}>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã hoặc tên voucher..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)} className="shrink-0">
          <TabsList>
            <TabsTrigger value="all" className="text-xs">Tất cả</TabsTrigger>
            <TabsTrigger value="active" className="text-xs">Hoạt động</TabsTrigger>
            <TabsTrigger value="expired" className="text-xs">Hết hạn</TabsTrigger>
            <TabsTrigger value="inactive" className="text-xs">Đã tắt</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bulk actions */}
      {selectedVouchers.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-accent/5 border border-accent/20 animate-in slide-in-from-top duration-200">
          <span className="text-sm font-medium">Đã chọn {selectedVouchers.size} voucher</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={() => handleBulkToggle(true)}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Bật
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkToggle(false)}>
              <XCircle className="h-3.5 w-3.5 mr-1" /> Tắt
            </Button>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Xóa
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input type="checkbox" checked={selectedVouchers.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
                </TableHead>
                <TableHead>Mã</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Giảm giá</TableHead>
                <TableHead>Điều kiện</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Sử dụng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Ticket className="h-8 w-8 opacity-30" />
                      <p>{searchQuery ? 'Không tìm thấy voucher phù hợp' : 'Chưa có voucher nào'}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((voucher) => {
                  const status = getVoucherStatus(voucher);
                  const usagePercent = voucher.usage_limit ? Math.min(100, (voucher.used_count / voucher.usage_limit) * 100) : 0;
                  return (
                    <TableRow key={voucher.id} className={selectedVouchers.has(voucher.id) ? 'bg-accent/5' : ''}>
                      <TableCell>
                        <input type="checkbox" checked={selectedVouchers.has(voucher.id)} onChange={() => toggleSelect(voucher.id)} className="rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded font-mono text-sm font-bold">{voucher.code}</code>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(voucher.code)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{voucher.name}</p>
                          {voucher.description && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{voucher.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="p-1 rounded bg-accent/10">
                            {voucher.discount_type === 'percentage' ? <Percent className="h-3 w-3 text-accent" /> : <DollarSign className="h-3 w-3 text-accent" />}
                          </div>
                          <span className="font-semibold">
                            {voucher.discount_type === 'percentage' ? `${voucher.discount_value}%` : `${voucher.discount_value.toLocaleString('vi-VN')}đ`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {voucher.min_order_value > 0 && (
                          <p className="text-xs">Tối thiểu: {voucher.min_order_value.toLocaleString('vi-VN')}đ</p>
                        )}
                        {voucher.max_discount && voucher.max_discount > 0 && (
                          <p className="text-xs">Tối đa: {voucher.max_discount.toLocaleString('vi-VN')}đ</p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(voucher.start_date), 'dd/MM/yy')} – {format(new Date(voucher.end_date), 'dd/MM/yy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[80px]">
                          <span className="text-sm font-medium">{voucher.used_count}/{voucher.usage_limit || '∞'}</span>
                          {voucher.usage_limit && voucher.usage_limit > 0 && (
                            <Progress value={usagePercent} className="h-1.5" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <status.icon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Switch checked={voucher.is_active} onCheckedChange={() => toggleActive(voucher)} className="mr-1" />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailVoucher(voucher)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(voucher)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(voucher.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Ticket className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-muted-foreground">{searchQuery ? 'Không tìm thấy' : 'Chưa có voucher nào'}</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((voucher) => {
            const status = getVoucherStatus(voucher);
            const usagePercent = voucher.usage_limit ? Math.min(100, (voucher.used_count / voucher.usage_limit) * 100) : 0;
            return (
              <Card key={voucher.id} className="overflow-hidden transition-all active:scale-[0.98]">
                <CardContent className="p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-accent/10">
                        {voucher.discount_type === 'percentage' ? <Percent className="h-4 w-4 text-accent" /> : <DollarSign className="h-4 w-4 text-accent" />}
                      </div>
                      <div>
                        <p className="font-bold text-lg leading-tight">
                          {voucher.discount_type === 'percentage' ? `${voucher.discount_value}%` : `${voucher.discount_value.toLocaleString('vi-VN')}đ`}
                        </p>
                        <p className="text-xs text-muted-foreground">{voucher.name}</p>
                      </div>
                    </div>
                    <Badge variant={status.variant} className="gap-1 text-xs">
                      <status.icon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>

                  {/* Code */}
                  <div className="flex items-center gap-2 mb-3">
                    <code className="flex-1 bg-muted px-3 py-2 rounded-lg font-mono text-sm font-bold text-center tracking-widest">
                      {voucher.code}
                    </code>
                    <Button variant="outline" size="sm" onClick={() => copyCode(voucher.code)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(voucher.start_date), 'dd/MM')} – {format(new Date(voucher.end_date), 'dd/MM/yy')}
                    </div>
                    {voucher.min_order_value > 0 && (
                      <div>Tối thiểu: {voucher.min_order_value.toLocaleString('vi-VN')}đ</div>
                    )}
                  </div>

                  {/* Usage progress */}
                  {voucher.usage_limit && voucher.usage_limit > 0 ? (
                    <div className="space-y-1.5 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Đã sử dụng</span>
                        <span className="font-medium">{voucher.used_count}/{voucher.usage_limit}</span>
                      </div>
                      <Progress value={usagePercent} className="h-2" />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mb-3">Đã dùng: {voucher.used_count} lượt</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Switch checked={voucher.is_active} onCheckedChange={() => toggleActive(voucher)} />
                    <span className="text-xs text-muted-foreground mr-auto">{voucher.is_active ? 'Đang bật' : 'Đã tắt'}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(voucher)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(voucher.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailVoucher} onOpenChange={() => setDetailVoucher(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết Voucher</DialogTitle>
          </DialogHeader>
          {detailVoucher && (() => {
            const status = getVoucherStatus(detailVoucher);
            const usagePercent = detailVoucher.usage_limit ? Math.min(100, (detailVoucher.used_count / detailVoucher.usage_limit) * 100) : 0;
            const now = new Date();
            const start = new Date(detailVoucher.start_date);
            const end = new Date(detailVoucher.end_date);
            const totalDays = Math.max(1, (end.getTime() - start.getTime()) / 86400000);
            const elapsedDays = Math.max(0, (now.getTime() - start.getTime()) / 86400000);
            const timePercent = Math.min(100, (elapsedDays / totalDays) * 100);

            return (
              <div className="space-y-4">
                <div className="text-center p-6 rounded-xl bg-accent/5 border border-accent/20">
                  <code className="text-2xl font-bold font-mono tracking-[0.3em]">{detailVoucher.code}</code>
                  <p className="text-sm text-muted-foreground mt-1">{detailVoucher.name}</p>
                  <div className="mt-3">
                    <Badge variant={status.variant} className="gap-1">
                      <status.icon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Giảm giá</p>
                    <p className="text-lg font-bold">
                      {detailVoucher.discount_type === 'percentage' ? `${detailVoucher.discount_value}%` : `${detailVoucher.discount_value.toLocaleString('vi-VN')}đ`}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Đơn tối thiểu</p>
                    <p className="text-lg font-bold">{detailVoucher.min_order_value > 0 ? `${detailVoucher.min_order_value.toLocaleString('vi-VN')}đ` : 'Không'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tiến độ sử dụng</span>
                    <span className="font-medium">{detailVoucher.used_count}/{detailVoucher.usage_limit || '∞'}</span>
                  </div>
                  <Progress value={usagePercent} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Thời gian còn lại</span>
                    <span className="font-medium">
                      {now > end ? 'Đã kết thúc' : now < start ? 'Chưa bắt đầu' : `${Math.ceil(totalDays - elapsedDays)} ngày`}
                    </span>
                  </div>
                  <Progress value={timePercent} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{format(start, 'dd/MM/yyyy HH:mm')}</span>
                    <span>{format(end, 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setDetailVoucher(null); openEditDialog(detailVoucher); }}>
                    <Pencil className="h-4 w-4 mr-1" /> Sửa
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => copyCode(detailVoucher.code)}>
                    <Copy className="h-4 w-4 mr-1" /> Sao chép
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
