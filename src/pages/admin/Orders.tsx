import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-500/20 text-yellow-500', icon: <Package className="h-4 w-4" /> },
  processing: { label: 'Đang xử lý', color: 'bg-blue-500/20 text-blue-500', icon: <Package className="h-4 w-4" /> },
  shipping: { label: 'Đang giao', color: 'bg-purple-500/20 text-purple-500', icon: <Truck className="h-4 w-4" /> },
  completed: { label: 'Hoàn thành', color: 'bg-green-500/20 text-green-500', icon: <CheckCircle className="h-4 w-4" /> },
  cancelled: { label: 'Đã hủy', color: 'bg-red-500/20 text-red-500', icon: <XCircle className="h-4 w-4" /> },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchData = async () => {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (filterStatus !== 'all') query = query.eq('status', filterStatus);
    const { data } = await query;
    setOrders((data as unknown as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    toast.success('Cập nhật trạng thái thành công');
    fetchData();
    if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status });
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + '₫';

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Đơn hàng</h1>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Chờ xử lý</SelectItem>
            <SelectItem value="processing">Đang xử lý</SelectItem>
            <SelectItem value="shipping">Đang giao</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Mã đơn</th>
              <th className="text-left p-3 text-sm font-medium">Khách hàng</th>
              <th className="text-left p-3 text-sm font-medium">Tổng tiền</th>
              <th className="text-left p-3 text-sm font-medium">Trạng thái</th>
              <th className="text-left p-3 text-sm font-medium">Ngày đặt</th>
              <th className="text-right p-3 text-sm font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              return (
                <tr key={order.id} className="border-t">
                  <td className="p-3 font-mono text-sm">#{order.id.slice(0, 8)}</td>
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-accent">{formatCurrency(order.total_amount)}</td>
                  <td className="p-3">
                    <Badge className={status.color}>{status.icon}<span className="ml-1">{status.label}</span></Badge>
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
        {orders.length === 0 && <div className="p-8 text-center text-muted-foreground">Chưa có đơn hàng nào</div>}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Chi tiết đơn hàng #{selectedOrder?.id.slice(0, 8)}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Thông tin khách hàng</h4>
                  <p>{selectedOrder.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.customer_email}</p>
                  {selectedOrder.customer_phone && <p className="text-sm text-muted-foreground">{selectedOrder.customer_phone}</p>}
                  {selectedOrder.customer_address && <p className="text-sm text-muted-foreground mt-2">{selectedOrder.customer_address}</p>}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Trạng thái</h4>
                  <Select value={selectedOrder.status} onValueChange={(v) => updateStatus(selectedOrder.id, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Chờ xử lý</SelectItem>
                      <SelectItem value="processing">Đang xử lý</SelectItem>
                      <SelectItem value="shipping">Đang giao</SelectItem>
                      <SelectItem value="completed">Hoàn thành</SelectItem>
                      <SelectItem value="cancelled">Đã hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                <span className="text-2xl font-bold text-accent">{formatCurrency(selectedOrder.total_amount)}</span>
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
