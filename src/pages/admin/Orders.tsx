import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Package, Truck, CheckCircle, XCircle, Search, Clock, ShoppingCart, DollarSign, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { OrderReportExport } from '@/components/admin/OrderReportExport';
import { PaymentConfirmDialog } from '@/components/payment/PaymentConfirmDialog';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400', icon: <Clock className="h-4 w-4" /> },
  processing: { label: 'Đang xử lý', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400', icon: <Package className="h-4 w-4" /> },
  shipping: { label: 'Đang giao', color: 'bg-purple-500/20 text-purple-700 dark:text-purple-400', icon: <Truck className="h-4 w-4" /> },
  completed: { label: 'Hoàn thành', color: 'bg-green-500/20 text-green-700 dark:text-green-400', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: 'Đã hủy', color: 'bg-red-500/20 text-red-700 dark:text-red-400', icon: <XCircle className="h-4 w-4" /> },
};

const shipperStatusConfig: Record<string, { label: string; color: string }> = {
  unassigned: { label: 'Chưa giao', color: 'bg-muted text-muted-foreground' },
  assigned: { label: 'Đã giao shipper', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-400' },
  picking_up: { label: 'Đang lấy hàng', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-400' },
  delivering: { label: 'Đang giao', color: 'bg-purple-500/20 text-purple-700 dark:text-purple-400' },
  delivered: { label: 'Đã giao', color: 'bg-green-500/20 text-green-700 dark:text-green-400' },
  cancelled: { label: 'Hủy giao', color: 'bg-red-500/20 text-red-700 dark:text-red-400' },
};

interface ShipperProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [shippers, setShippers] = useState<ShipperProfile[]>([]);

  const fetchData = async () => {
    const [ordersRes, shipperRolesRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id').eq('role', 'shipper'),
    ]);

    const allOrders = (ordersRes.data as unknown as Order[]) || [];
    setOrders(allOrders);

    // Fetch shipper profiles
    const shipperIds = (shipperRolesRes.data || []).map((r: any) => r.user_id);
    if (shipperIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, phone').in('id', shipperIds);
      setShippers((profiles || []) as ShipperProfile[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredOrders = orders.filter(order => {
    const matchStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchSearch = !searchQuery || 
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer_phone || '').includes(searchQuery);
    return matchStatus && matchSearch;
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) { toast.error('Lỗi cập nhật trạng thái'); return; }
    toast.success('Cập nhật trạng thái thành công');
    fetchData();
    if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status });
  };

  const assignShipper = async (orderId: string, shipperId: string) => {
    const { error } = await supabase.from('orders').update({ 
      shipper_id: shipperId, 
      shipper_status: 'assigned',
      status: 'shipping'
    }).eq('id', orderId);
    if (error) { toast.error('Lỗi giao đơn cho shipper'); return; }
    toast.success('Đã giao đơn cho shipper');
    fetchData();
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + '₫';

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipping: orders.filter(o => o.status === 'shipping').length,
    completed: orders.filter(o => o.status === 'completed').length,
    revenue: orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total_amount), 0),
  };

  const getShipperName = (shipperId: string | null) => {
    if (!shipperId) return null;
    const shipper = shippers.find(s => s.id === shipperId);
    return shipper?.full_name || 'Shipper';
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-xl bg-accent/10">
              <ShoppingCart className="h-6 w-6 text-accent" />
            </div>
            Quản lý đơn hàng
          </h1>
          <p className="text-muted-foreground mt-1">Theo dõi và xử lý đơn hàng</p>
        </div>
        <OrderReportExport />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Tổng đơn', value: stats.total, icon: ShoppingCart, gradient: 'from-blue-500/10 to-blue-600/5', iconColor: 'text-blue-500', filter: 'all' },
          { label: 'Chờ xử lý', value: stats.pending, icon: Clock, gradient: 'from-yellow-500/10 to-amber-500/5', iconColor: 'text-yellow-500', filter: 'pending' },
          { label: 'Đang giao', value: stats.shipping, icon: Truck, gradient: 'from-purple-500/10 to-purple-600/5', iconColor: 'text-purple-500', filter: 'shipping' },
          { label: 'Hoàn thành', value: stats.completed, icon: CheckCircle, gradient: 'from-green-500/10 to-green-600/5', iconColor: 'text-green-500', filter: 'completed' },
          { label: 'Doanh thu', value: formatCurrency(stats.revenue), icon: DollarSign, gradient: 'from-emerald-500/10 to-teal-500/5', iconColor: 'text-emerald-500', filter: '' },
        ].map((stat) => (
          <Card 
            key={stat.label} 
            className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${filterStatus === stat.filter ? 'ring-2 ring-accent' : ''}`}
            onClick={() => stat.filter !== '' && setFilterStatus(stat.filter)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
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
            placeholder="Tìm theo tên, email, SĐT, mã đơn..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-10" 
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả ({orders.length})</SelectItem>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label} ({orders.filter(o => o.status === key).length})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Mã đơn</th>
                <th className="text-left p-3 text-sm font-medium">Khách hàng</th>
                <th className="text-left p-3 text-sm font-medium">Tổng tiền</th>
                <th className="text-left p-3 text-sm font-medium">Trạng thái</th>
                <th className="text-left p-3 text-sm font-medium">Thanh toán</th>
                <th className="text-left p-3 text-sm font-medium">Shipper</th>
                <th className="text-left p-3 text-sm font-medium">Ngày đặt</th>
                <th className="text-right p-3 text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const shipperStatus = shipperStatusConfig[(order as any).shipper_status || 'unassigned'] || shipperStatusConfig.unassigned;
                return (
                  <tr key={order.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-sm">#{order.id.slice(0, 8)}</td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                      </div>
                    </td>
                    <td className="p-3 font-semibold">{formatCurrency(order.total_amount)}</td>
                    <td className="p-3">
                      <Badge className={status.color}>{status.icon}<span className="ml-1">{status.label}</span></Badge>
                    </td>
                    <td className="p-3">
                      {(() => {
                        const ps = (order as any).payment_status || 'unpaid';
                        const cfg: Record<string, { label: string; cls: string }> = {
                          paid: { label: '✓ Đã TT', cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
                          partial: { label: '½ Một phần', cls: 'bg-amber-100 text-amber-700 border-amber-300' },
                          unpaid: { label: '⏳ Chưa TT', cls: 'bg-red-100 text-red-700 border-red-300' },
                        };
                        const c = cfg[ps] || cfg.unpaid;
                        return (
                          <div className="space-y-1">
                            <Badge variant="outline" className={`text-xs ${c.cls}`}>{c.label}</Badge>
                            {ps !== 'paid' && (
                              <PaymentConfirmDialog
                                orderId={order.id}
                                totalAmount={Number(order.total_amount)}
                                size="sm"
                                variant="outline"
                                onConfirmed={fetchData}
                              />
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-3">
                      {(order as any).shipper_id ? (
                        <div>
                          <p className="text-sm font-medium">{getShipperName((order as any).shipper_id)}</p>
                          <Badge variant="outline" className={`text-xs ${shipperStatus.color}`}>{shipperStatus.label}</Badge>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground text-sm">{format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}><Eye className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>{searchQuery ? 'Không tìm thấy đơn hàng' : 'Chưa có đơn hàng nào'}</p>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mt-3">
        Hiển thị {filteredOrders.length}/{orders.length} đơn hàng
      </p>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Chi tiết đơn hàng #{selectedOrder?.id.slice(0, 8)}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Thông tin khách hàng</h4>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer_email}</p>
                  {selectedOrder.customer_phone && <p className="text-sm text-muted-foreground">{selectedOrder.customer_phone}</p>}
                  {selectedOrder.customer_address && <p className="text-sm text-muted-foreground mt-2">{selectedOrder.customer_address}</p>}
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Trạng thái đơn hàng</h4>
                    <Select value={selectedOrder.status} onValueChange={(v) => updateStatus(selectedOrder.id, v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Shipper Assignment */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Giao hàng
                </h4>
                {(selectedOrder as any).shipper_id ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{getShipperName((selectedOrder as any).shipper_id)}</p>
                      <Badge variant="outline" className="mt-1">
                        {shipperStatusConfig[(selectedOrder as any).shipper_status || 'unassigned']?.label || 'Chưa rõ'}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      supabase.from('orders').update({ shipper_id: null, shipper_status: 'unassigned' }).eq('id', selectedOrder.id).then(() => {
                        toast.success('Đã hủy giao shipper');
                        fetchData();
                        setSelectedOrder(null);
                      });
                    }}>
                      Hủy giao
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Chọn shipper để giao đơn hàng này:</p>
                    {shippers.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Chưa có shipper nào trong hệ thống</p>
                    ) : (
                      <Select onValueChange={(shipperId) => assignShipper(selectedOrder.id, shipperId)}>
                        <SelectTrigger><SelectValue placeholder="Chọn shipper..." /></SelectTrigger>
                        <SelectContent>
                          {shippers.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.full_name || 'Shipper'} {s.phone ? `(${s.phone})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-2">Sản phẩm</h4>
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  {(selectedOrder.items as OrderItem[]).map((item, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        {item.image_url && <img src={item.image_url} className="w-12 h-12 rounded object-cover" />}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-medium">Tổng cộng:</span>
                <span className="text-2xl font-bold">{formatCurrency(selectedOrder.total_amount)}</span>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h4 className="font-medium mb-2">Ghi chú</h4>
                  <p className="text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
