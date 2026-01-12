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
import { Plus, Pencil, Trash2, Ticket, Copy, Percent, DollarSign, Calendar, Users, Gift } from 'lucide-react';
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
  code: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount: number;
  usage_limit: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
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

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [formData, setFormData] = useState(initialVoucher);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching vouchers:', error);
      toast.error('Lỗi tải danh sách voucher');
    } else if (data) {
      setVouchers(data as Voucher[]);
      setVouchers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
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
      toast.success(editingVoucher ? 'Cập nhật voucher thành công' : 'Tạo voucher thành công');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa voucher này?')) return;
    
    const { error } = await supabase.from('vouchers').delete().eq('id', id);
    if (error) {
      toast.error('Lỗi xóa voucher');
    } else {
      toast.success('Xóa voucher thành công');
      fetchData();
    }
  };

  const toggleActive = async (voucher: Voucher) => {
    const { error } = await supabase
      .from('vouchers')
      .update({ is_active: !voucher.is_active })
      .eq('id', voucher.id);
    
    if (error) {
      toast.error('Lỗi cập nhật trạng thái');
    } else {
      fetchData();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã: ' + code);
  };

  const resetForm = () => {
    setFormData(initialVoucher);
    setEditingVoucher(null);
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
    const startDate = new Date(voucher.start_date);
    const endDate = new Date(voucher.end_date);
    
    if (!voucher.is_active) return { label: 'Tắt', variant: 'secondary' as const };
    if (now < startDate) return { label: 'Chưa bắt đầu', variant: 'outline' as const };
    if (now > endDate) return { label: 'Hết hạn', variant: 'destructive' as const };
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) return { label: 'Hết lượt', variant: 'destructive' as const };
    return { label: 'Đang hoạt động', variant: 'default' as const };
  };

  const stats = {
    total: vouchers.length,
    active: vouchers.filter(v => {
      const now = new Date();
      return v.is_active && new Date(v.start_date) <= now && new Date(v.end_date) >= now;
    }).length,
    used: vouchers.reduce((acc, v) => acc + v.used_count, 0),
  };

  if (loading) {
    return <AdminLayout><div className="p-8 text-center">Đang tải...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6" />
            Quản lý Voucher
          </h1>
          <p className="text-muted-foreground">Tạo và quản lý mã giảm giá cho khách hàng</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mã voucher *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="VD: SALE50"
                      className="uppercase"
                    />
                    <Button type="button" variant="outline" onClick={generateCode}>
                      Tạo mã
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tên voucher *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Giảm 50% đơn hàng"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về voucher..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loại giảm giá</Label>
                  <Select value={formData.discount_type} onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, discount_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                  <Label>Giá trị giảm *</Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    placeholder={formData.discount_type === 'percentage' ? '10' : '50000'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Đơn hàng tối thiểu (đ)</Label>
                  <Input
                    type="number"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giảm tối đa (đ)</Label>
                  <Input
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: Number(e.target.value) })}
                    placeholder="100000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ngày bắt đầu *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ngày kết thúc *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Giới hạn lượt sử dụng</Label>
                  <Input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                    placeholder="0 = không giới hạn"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Kích hoạt ngay</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={saving} className="bg-accent hover:bg-accent/90">
                  {saving ? 'Đang lưu...' : (editingVoucher ? 'Cập nhật' : 'Tạo Voucher')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng voucher</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Đang hoạt động</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lượt sử dụng</p>
              <p className="text-2xl font-bold">{stats.used}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vouchers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên voucher</TableHead>
                <TableHead>Giảm giá</TableHead>
                <TableHead>Điều kiện</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Sử dụng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Chưa có voucher nào. Bấm "Tạo Voucher" để bắt đầu.
                  </TableCell>
                </TableRow>
              ) : (
                vouchers.map((voucher) => {
                  const status = getVoucherStatus(voucher);
                  return (
                    <TableRow key={voucher.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded font-mono text-sm font-bold">
                            {voucher.code}
                          </code>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(voucher.code)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{voucher.name}</p>
                          {voucher.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{voucher.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {voucher.discount_type === 'percentage' ? (
                            <>{voucher.discount_value}%</>
                          ) : (
                            <>{voucher.discount_value.toLocaleString('vi-VN')}đ</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="space-y-1">
                          {voucher.min_order_value > 0 && (
                            <p>Đơn tối thiểu: {voucher.min_order_value.toLocaleString('vi-VN')}đ</p>
                          )}
                          {voucher.max_discount && (
                            <p>Giảm tối đa: {voucher.max_discount.toLocaleString('vi-VN')}đ</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(voucher.start_date), 'dd/MM/yy')} - {format(new Date(voucher.end_date), 'dd/MM/yy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {voucher.usage_limit ? (
                          <span>{voucher.used_count}/{voucher.usage_limit}</span>
                        ) : (
                          <span>{voucher.used_count}/∞</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Switch
                            checked={voucher.is_active}
                            onCheckedChange={() => toggleActive(voucher)}
                            className="mr-2"
                          />
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(voucher)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(voucher.id)}>
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
    </AdminLayout>
  );
}
