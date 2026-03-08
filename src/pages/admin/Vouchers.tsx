import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Plus, Pencil, Trash2, Ticket, Copy, Percent, DollarSign, Calendar,
  Gift, Search, TrendingUp, Clock, CheckCircle2,
  XCircle, AlertCircle, Zap, Eye, ShoppingCart, Calculator, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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

const getDefaultFormData = () => ({
  code: '',
  name: '',
  description: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: 10,
  min_order_value: 0,
  max_discount: 0,
  usage_limit: 0,
  start_date: new Date().toISOString().slice(0, 16),
  end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
  is_active: true,
});

type StatusFilter = 'all' | 'active' | 'inactive' | 'expired' | 'upcoming';

const SAMPLE_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000];

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [formData, setFormData] = useState(getDefaultFormData());
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedVouchers, setSelectedVouchers] = useState<Set<string>>(new Set());
  const [detailVoucher, setDetailVoucher] = useState<Voucher | null>(null);
  const [previewAmount, setPreviewAmount] = useState('500000');
  const [simulatorAmount, setSimulatorAmount] = useState('500000');

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Lỗi tải danh sách voucher');
    } else if (data) {
      setVouchers(data.map(v => ({
        ...v,
        discount_type: v.discount_type as 'percentage' | 'fixed',
        min_order_value: Number(v.min_order_value) || 0,
        max_discount: v.max_discount ? Number(v.max_discount) : null,
        used_count: Number(v.used_count) || 0,
      })));
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

  const validateForm = (): string | null => {
    if (!formData.code.trim()) return 'Vui lòng nhập mã voucher';
    if (!formData.name.trim()) return 'Vui lòng nhập tên voucher';
    if (!formData.start_date) return 'Vui lòng chọn ngày bắt đầu';
    if (!formData.end_date) return 'Vui lòng chọn ngày kết thúc';
    if (new Date(formData.end_date) <= new Date(formData.start_date)) return 'Ngày kết thúc phải sau ngày bắt đầu';
    if (formData.discount_value <= 0) return 'Giá trị giảm phải lớn hơn 0';
    if (formData.discount_type === 'percentage' && formData.discount_value > 100) return 'Phần trăm giảm không được vượt quá 100%';
    if (formData.min_order_value < 0) return 'Đơn tối thiểu không được âm';
    if (formData.max_discount < 0) return 'Giảm tối đa không được âm';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    const voucherData = {
      code: formData.code.toUpperCase().trim(),
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      min_order_value: formData.min_order_value || 0,
      max_discount: formData.max_discount > 0 ? formData.max_discount : null,
      usage_limit: formData.usage_limit > 0 ? formData.usage_limit : null,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
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
      toast.error(error.message.includes('duplicate') ? 'Mã voucher đã tồn tại' : `Lỗi: ${error.message}`);
    } else {
      toast.success(editingVoucher ? 'Cập nhật voucher thành công!' : 'Tạo voucher thành công!');
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
    if (error) toast.error('Lỗi cập nhật hàng loạt');
    else { toast.success(`Đã ${active ? 'bật' : 'tắt'} ${ids.length} voucher`); setSelectedVouchers(new Set()); fetchData(); }
  };

  const handleDuplicate = async (voucher: Voucher) => {
    const newCode = voucher.code + '-' + Date.now().toString(36).slice(-4).toUpperCase();
    const { error } = await supabase.from('vouchers').insert([{
      code: newCode,
      name: voucher.name + ' (Copy)',
      description: voucher.description,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      min_order_value: voucher.min_order_value,
      max_discount: voucher.max_discount,
      usage_limit: voucher.usage_limit,
      start_date: voucher.start_date,
      end_date: voucher.end_date,
      is_active: false,
    }]);
    if (error) toast.error('Lỗi nhân bản voucher');
    else { toast.success('Đã nhân bản voucher (trạng thái: tắt)'); fetchData(); }
  };

  const toggleActive = async (voucher: Voucher) => {
    const { error } = await supabase.from('vouchers').update({ is_active: !voucher.is_active }).eq('id', voucher.id);
    if (error) toast.error('Lỗi cập nhật trạng thái');
    else fetchData();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã: ' + code);
  };

  const resetForm = () => {
    setFormData(getDefaultFormData());
    setEditingVoucher(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

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
    if (!voucher.is_active) return { label: 'Đã tắt', variant: 'secondary' as const, icon: XCircle, color: 'text-muted-foreground' };
    if (now < start) return { label: 'Sắp tới', variant: 'outline' as const, icon: Clock, color: 'text-blue-500' };
    if (now > end) return { label: 'Hết hạn', variant: 'destructive' as const, icon: AlertCircle, color: 'text-destructive' };
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) return { label: 'Hết lượt', variant: 'destructive' as const, icon: AlertCircle, color: 'text-orange-500' };
    return { label: 'Hoạt động', variant: 'default' as const, icon: CheckCircle2, color: 'text-green-500' };
  };

  const getStatusKey = (voucher: Voucher): StatusFilter => {
    const now = new Date();
    if (!voucher.is_active) return 'inactive';
    if (now < new Date(voucher.start_date)) return 'upcoming';
    if (now > new Date(voucher.end_date)) return 'expired';
    return 'active';
  };

  const calcDiscount = (amount: number, v: { discount_type: string; discount_value: number; max_discount: number | null; min_order_value: number }) => {
    if (amount <= 0) return { discount: 0, final: 0, eligible: false, reason: 'Giá trị đơn phải lớn hơn 0' };
    if (amount < v.min_order_value) return { discount: 0, final: amount, eligible: false, reason: `Đơn tối thiểu: ${formatVND(v.min_order_value)}` };
    let discount = v.discount_type === 'percentage' ? Math.round(amount * v.discount_value / 100) : v.discount_value;
    if (v.max_discount && v.max_discount > 0 && discount > v.max_discount) discount = v.max_discount;
    const final = Math.max(0, amount - discount);
    const savedPercent = amount > 0 ? Math.round((discount / amount) * 100) : 0;
    return { discount, final, eligible: true, reason: '', savedPercent };
  };

  const filtered = vouchers.filter(v => {
    const matchSearch = !searchQuery || v.code.toLowerCase().includes(searchQuery.toLowerCase()) || v.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || getStatusKey(v) === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: vouchers.length,
    active: vouchers.filter(v => getStatusKey(v) === 'active').length,
    expired: vouchers.filter(v => getStatusKey(v) === 'expired').length,
    used: vouchers.reduce((acc, v) => acc + (v.used_count || 0), 0),
  };

  const toggleSelect = (id: string) => {
    setSelectedVouchers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedVouchers.size === filtered.length) setSelectedVouchers(new Set());
    else setSelectedVouchers(new Set(filtered.map(v => v.id)));
  };

  const formatVND = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + '₫';

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 flex flex-col items-center justify-center gap-4 min-h-[400px]">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Đang tải voucher...</p>
        </div>
      </AdminLayout>
    );
  }

  const renderFormPreview = () => {
    if (!formData.code && !formData.name) return null;
    const result = calcDiscount(Number(previewAmount), formData);
    return (
      <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 overflow-hidden">
        <div className="p-4 border-b border-primary/10">
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> XEM TRƯỚC VOUCHER
          </p>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              {formData.discount_type === 'percentage'
                ? <Percent className="h-6 w-6 text-primary" />
                : <DollarSign className="h-6 w-6 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xl text-primary">
                {formData.discount_type === 'percentage'
                  ? `Giảm ${formData.discount_value}%`
                  : `Giảm ${formatVND(formData.discount_value)}`}
              </p>
              <p className="text-sm text-muted-foreground truncate">{formData.name || 'Tên voucher'}</p>
              {formData.max_discount > 0 && formData.discount_type === 'percentage' && (
                <p className="text-xs text-muted-foreground">Tối đa: {formatVND(formData.max_discount)}</p>
              )}
            </div>
            <code className="bg-background border px-3 py-2 rounded-lg font-mono text-sm font-bold tracking-widest shrink-0">
              {formData.code || '???'}
            </code>
          </div>
        </div>

        {/* Discount Simulator */}
        <div className="p-4 bg-muted/30">
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <Calculator className="h-3.5 w-3.5" /> MÔ PHỎNG GIẢM GIÁ
          </p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nhập giá trị đơn hàng thử</Label>
              <Input
                type="number"
                value={previewAmount}
                onChange={e => setPreviewAmount(e.target.value)}
                className="h-9 mt-1 font-mono"
                placeholder="500000"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {SAMPLE_AMOUNTS.map(amt => (
                <Button
                  key={amt}
                  type="button"
                  variant={Number(previewAmount) === amt ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => setPreviewAmount(String(amt))}
                >
                  {(amt / 1000)}k
                </Button>
              ))}
            </div>
            <Separator />
            <div className="p-3 rounded-lg bg-background border">
              {!result.eligible ? (
                <p className="text-sm text-destructive font-medium text-center">{result.reason}</p>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Giá trị đơn:</span>
                    <span>{formatVND(Number(previewAmount))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Giảm:</span>
                    <span className="text-green-600 font-bold">-{formatVND(result.discount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Thanh toán:</span>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">{formatVND(result.final)}</p>
                      {'savedPercent' in result && <p className="text-xs text-green-600">Tiết kiệm {result.savedPercent}%</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailDialog = () => {
    if (!detailVoucher) return null;
    const status = getVoucherStatus(detailVoucher);
    const usagePercent = detailVoucher.usage_limit ? Math.min(100, (detailVoucher.used_count / detailVoucher.usage_limit) * 100) : 0;
    const now = new Date();
    const start = new Date(detailVoucher.start_date);
    const end = new Date(detailVoucher.end_date);
    const totalDays = Math.max(1, (end.getTime() - start.getTime()) / 86400000);
    const elapsedDays = Math.max(0, (now.getTime() - start.getTime()) / 86400000);
    const timePercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
    const simResult = calcDiscount(Number(simulatorAmount), {
      discount_type: detailVoucher.discount_type,
      discount_value: detailVoucher.discount_value,
      max_discount: detailVoucher.max_discount,
      min_order_value: detailVoucher.min_order_value,
    });

    return (
      <div className="space-y-5">
        {/* Voucher Card */}
        <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 relative overflow-hidden">
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background" />
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background" />
          <code className="text-3xl font-bold font-mono tracking-[0.3em] text-primary">{detailVoucher.code}</code>
          <p className="text-sm text-muted-foreground mt-2">{detailVoucher.name}</p>
          <div className="mt-3">
            <Badge variant={status.variant} className="gap-1">
              <status.icon className="h-3 w-3" />{status.label}
            </Badge>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-muted/50 border">
            <p className="text-xs text-muted-foreground mb-1">Giảm giá</p>
            <p className="text-xl font-bold text-primary">
              {detailVoucher.discount_type === 'percentage' ? `${detailVoucher.discount_value}%` : formatVND(detailVoucher.discount_value)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-muted/50 border">
            <p className="text-xs text-muted-foreground mb-1">Đơn tối thiểu</p>
            <p className="text-xl font-bold">{detailVoucher.min_order_value > 0 ? formatVND(detailVoucher.min_order_value) : 'Không'}</p>
          </div>
          {detailVoucher.max_discount && detailVoucher.max_discount > 0 && (
            <div className="p-3 rounded-xl bg-muted/50 border col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Giảm tối đa</p>
              <p className="text-xl font-bold text-orange-500">{formatVND(detailVoucher.max_discount)}</p>
            </div>
          )}
        </div>

        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Đã sử dụng</span>
            <span className="font-semibold">{detailVoucher.used_count}/{detailVoucher.usage_limit || '∞'}</span>
          </div>
          <Progress value={usagePercent} className="h-2.5" />
        </div>

        {/* Time Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Thời hạn</span>
            <span className="font-semibold">
              {now > end ? 'Đã kết thúc' : now < start ? 'Chưa bắt đầu' : `Còn ${Math.ceil(totalDays - elapsedDays)} ngày`}
            </span>
          </div>
          <Progress value={timePercent} className="h-2.5" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{format(start, 'dd/MM/yyyy HH:mm')}</span>
            <span>{format(end, 'dd/MM/yyyy HH:mm')}</span>
          </div>
        </div>

        {/* Discount Simulator */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-primary" /> Mô phỏng giảm giá
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="number"
              value={simulatorAmount}
              onChange={e => setSimulatorAmount(e.target.value)}
              placeholder="Nhập giá trị đơn hàng"
              className="font-mono"
            />
            <div className="flex gap-1.5 flex-wrap">
              {SAMPLE_AMOUNTS.map(amt => (
                <Button
                  key={amt}
                  variant={Number(simulatorAmount) === amt ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => setSimulatorAmount(String(amt))}
                >
                  {(amt / 1000)}k
                </Button>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              {!simResult.eligible ? (
                <p className="text-sm text-destructive font-medium text-center">{simResult.reason}</p>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Đơn hàng:</span>
                    <span>{formatVND(Number(simulatorAmount))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Giảm:</span>
                    <span className="text-green-600 font-bold">-{formatVND(simResult.discount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Thanh toán:</span>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">{formatVND(simResult.final)}</p>
                      {'savedPercent' in simResult && <p className="text-xs text-green-600">Tiết kiệm {simResult.savedPercent}%</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => { setDetailVoucher(null); openEditDialog(detailVoucher); }}>
            <Pencil className="h-4 w-4 mr-1.5" /> Sửa
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => copyCode(detailVoucher.code)}>
            <Copy className="h-4 w-4 mr-1.5" /> Sao chép
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => { setDetailVoucher(null); handleDuplicate(detailVoucher); }}>
            <RotateCcw className="h-4 w-4 mr-1.5" /> Nhân bản
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10"><Ticket className="h-6 w-6 text-primary" /></div>
            Quản lý Voucher
          </h1>
          <p className="text-muted-foreground mt-1">Tạo và quản lý mã giảm giá cho khách hàng</p>
        </div>
        <Button onClick={openCreateDialog} className="shadow-lg">
          <Plus className="h-4 w-4 mr-2" /> Tạo Voucher
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng voucher', value: stats.total, icon: Ticket, bg: 'bg-blue-500/10', iconColor: 'text-blue-500' },
          { label: 'Đang hoạt động', value: stats.active, icon: CheckCircle2, bg: 'bg-green-500/10', iconColor: 'text-green-500' },
          { label: 'Đã hết hạn', value: stats.expired, icon: AlertCircle, bg: 'bg-red-500/10', iconColor: 'text-red-500' },
          { label: 'Tổng lượt dùng', value: stats.used, icon: TrendingUp, bg: 'bg-purple-500/10', iconColor: 'text-purple-500' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
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
            <TabsTrigger value="upcoming" className="text-xs">Sắp tới</TabsTrigger>
            <TabsTrigger value="expired" className="text-xs">Hết hạn</TabsTrigger>
            <TabsTrigger value="inactive" className="text-xs">Đã tắt</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bulk actions */}
      {selectedVouchers.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
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
                  <TableCell colSpan={9} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <div className="p-4 rounded-full bg-muted/50">
                        <Ticket className="h-8 w-8 opacity-40" />
                      </div>
                      <div>
                        <p className="font-medium">{searchQuery ? 'Không tìm thấy voucher phù hợp' : 'Chưa có voucher nào'}</p>
                        <p className="text-sm">
                          {searchQuery ? 'Thử thay đổi từ khóa tìm kiếm' : 'Nhấn "Tạo Voucher" để bắt đầu'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((voucher) => {
                  const status = getVoucherStatus(voucher);
                  const usagePercent = voucher.usage_limit ? Math.min(100, (voucher.used_count / voucher.usage_limit) * 100) : 0;
                  return (
                    <TableRow key={voucher.id} className={selectedVouchers.has(voucher.id) ? 'bg-primary/5' : ''}>
                      <TableCell>
                        <input type="checkbox" checked={selectedVouchers.has(voucher.id)} onChange={() => toggleSelect(voucher.id)} className="rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2.5 py-1 rounded-md font-mono text-sm font-bold">{voucher.code}</code>
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
                          <div className="p-1 rounded bg-primary/10">
                            {voucher.discount_type === 'percentage'
                              ? <Percent className="h-3 w-3 text-primary" />
                              : <DollarSign className="h-3 w-3 text-primary" />}
                          </div>
                          <span className="font-semibold">
                            {voucher.discount_type === 'percentage' ? `${voucher.discount_value}%` : formatVND(voucher.discount_value)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {voucher.min_order_value > 0 && <p className="text-xs">Tối thiểu: {formatVND(voucher.min_order_value)}</p>}
                        {voucher.max_discount && voucher.max_discount > 0 && <p className="text-xs">Tối đa: {formatVND(voucher.max_discount)}</p>}
                        {!voucher.min_order_value && !voucher.max_discount && <p className="text-xs text-muted-foreground">Không giới hạn</p>}
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
                          {voucher.usage_limit && voucher.usage_limit > 0 && <Progress value={usagePercent} className="h-1.5" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <status.icon className="h-3 w-3" />{status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Switch checked={voucher.is_active} onCheckedChange={() => toggleActive(voucher)} className="mr-1" />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSimulatorAmount('500000'); setDetailVoucher(voucher); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(voucher)} title="Nhân bản">
                            <Copy className="h-4 w-4" />
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
            <CardContent className="py-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-muted/50">
                  <Ticket className="h-8 w-8 opacity-40 mx-auto" />
                </div>
                <p className="text-muted-foreground">{searchQuery ? 'Không tìm thấy' : 'Chưa có voucher nào'}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filtered.map((voucher) => {
            const status = getVoucherStatus(voucher);
            const usagePercent = voucher.usage_limit ? Math.min(100, (voucher.used_count / voucher.usage_limit) * 100) : 0;
            return (
              <Card key={voucher.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                        {voucher.discount_type === 'percentage'
                          ? <Percent className="h-5 w-5 text-primary" />
                          : <DollarSign className="h-5 w-5 text-primary" />}
                      </div>
                      <div>
                        <p className="font-bold text-lg leading-tight text-primary">
                          {voucher.discount_type === 'percentage' ? `${voucher.discount_value}%` : formatVND(voucher.discount_value)}
                        </p>
                        <p className="text-xs text-muted-foreground">{voucher.name}</p>
                      </div>
                    </div>
                    <Badge variant={status.variant} className="gap-1 text-xs shrink-0">
                      <status.icon className="h-3 w-3" />{status.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <code className="flex-1 bg-muted px-3 py-2 rounded-lg font-mono text-sm font-bold text-center tracking-widest">
                      {voucher.code}
                    </code>
                    <Button variant="outline" size="sm" onClick={() => copyCode(voucher.code)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(voucher.start_date), 'dd/MM')} – {format(new Date(voucher.end_date), 'dd/MM/yy')}
                    </div>
                    {voucher.min_order_value > 0 && <div>Tối thiểu: {formatVND(voucher.min_order_value)}</div>}
                  </div>

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

                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Switch checked={voucher.is_active} onCheckedChange={() => toggleActive(voucher)} />
                    <span className="text-xs text-muted-foreground mr-auto">{voucher.is_active ? 'Đang bật' : 'Đã tắt'}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSimulatorAmount('500000'); setDetailVoucher(voucher); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(voucher)}>
                      <Copy className="h-4 w-4" />
                    </Button>
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

      {/* Results count */}
      <p className="text-sm text-muted-foreground mt-4 mb-2">
        Hiển thị {filtered.length}/{vouchers.length} voucher
      </p>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              {editingVoucher ? 'Chỉnh sửa Voucher' : 'Tạo Voucher mới'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã voucher <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: SALE50"
                    className="uppercase font-mono"
                  />
                  <Button type="button" variant="outline" onClick={generateCode} className="shrink-0" title="Tạo mã ngẫu nhiên">
                    <Zap className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tên voucher <span className="text-destructive">*</span></Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Giảm 50% đơn hàng" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} placeholder="Mô tả chi tiết về voucher..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại giảm giá</Label>
                <Select value={formData.discount_type} onValueChange={(v: 'percentage' | 'fixed') => setFormData({ ...formData, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <span className="flex items-center gap-2"><Percent className="h-4 w-4" /> Phần trăm (%)</span>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Số tiền cố định (đ)</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Giá trị giảm <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min={0}
                  max={formData.discount_type === 'percentage' ? 100 : undefined}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                  placeholder={formData.discount_type === 'percentage' ? '1-100' : 'Nhập số tiền'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Đơn tối thiểu (đ)</Label>
                <Input type="number" min={0} value={formData.min_order_value} onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })} placeholder="0 = không yêu cầu" />
              </div>
              <div className="space-y-2">
                <Label>Giảm tối đa (đ) {formData.discount_type === 'percentage' && <span className="text-xs text-muted-foreground">(khuyên dùng)</span>}</Label>
                <Input type="number" min={0} value={formData.max_discount} onChange={(e) => setFormData({ ...formData, max_discount: Number(e.target.value) })} placeholder="0 = không giới hạn" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bắt đầu <span className="text-destructive">*</span></Label>
                <Input type="datetime-local" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Kết thúc <span className="text-destructive">*</span></Label>
                <Input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giới hạn sử dụng</Label>
                <Input type="number" min={0} value={formData.usage_limit} onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })} placeholder="0 = không giới hạn" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                <Label className="cursor-pointer">Kích hoạt ngay</Label>
              </div>
            </div>

            {/* Live Preview */}
            {renderFormPreview()}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Đang lưu...' : (editingVoucher ? 'Cập nhật' : 'Tạo Voucher')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailVoucher} onOpenChange={(open) => { if (!open) setDetailVoucher(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Chi tiết Voucher
            </DialogTitle>
          </DialogHeader>
          {renderDetailDialog()}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
