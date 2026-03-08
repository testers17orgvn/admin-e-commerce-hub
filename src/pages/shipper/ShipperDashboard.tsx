import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { GoogleMap } from '@/components/maps/GoogleMap';
import { 
  Package, MapPin, Navigation, Phone, Clock, 
  CheckCircle, XCircle, Truck, User, Play, 
  Square, Home, Star, Mail, Hash,
  ArrowRight, Timer, TrendingUp, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Order, OrderItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const SHIPPER_STATUS_CONFIG: Record<string, { label: string; color: string; bgLight: string; icon: any }> = {
  assigned: { label: 'Đã nhận đơn', color: 'bg-blue-500', bgLight: 'bg-blue-50 text-blue-700 border-blue-200', icon: Package },
  picking_up: { label: 'Đang lấy hàng', color: 'bg-amber-500', bgLight: 'bg-amber-50 text-amber-700 border-amber-200', icon: MapPin },
  delivering: { label: 'Đang giao hàng', color: 'bg-purple-500', bgLight: 'bg-purple-50 text-purple-700 border-purple-200', icon: Truck },
  delivered: { label: 'Đã giao', color: 'bg-green-500', bgLight: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', color: 'bg-red-500', bgLight: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

const STATUS_FLOW = ['assigned', 'picking_up', 'delivering', 'delivered'];

export default function ShipperDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isShipper, setIsShipper] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [avgRating, setAvgRating] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      checkShipperRole();
    }
  }, [user, authLoading]);

  const checkShipperRole = async () => {
    const { data } = await supabase.rpc('is_shipper');
    if (!data) {
      toast.error('Bạn cần có quyền shipper để truy cập trang này');
      navigate('/');
      return;
    }
    setIsShipper(true);
    fetchOrders();
    fetchRating();
  };

  const fetchRating = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('shipper_reviews')
      .select('rating')
      .eq('shipper_id', user.id);
    if (data && data.length > 0) {
      const ratings = data.map((r) => r.rating);
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      setAvgRating({ avg: Math.round(avg * 10) / 10, count: ratings.length });
    }
  };

  const fetchOrders = async () => {
    if (!user) return;

    let query = supabase
      .from('orders')
      .select('*')
      .eq('shipper_id', user.id)
      .order('created_at', { ascending: false });

    if (filterStatus !== 'all') {
      query = query.eq('shipper_status', filterStatus);
    }

    const { data } = await query;
    
    const ordersWithItems = (data || []).map((order) => ({
      ...order,
      items: (order.items as unknown as OrderItem[]) || [],
    }));
    
    setOrders(ordersWithItems as Order[]);
    setLoading(false);
  };

  useEffect(() => {
    if (isShipper) fetchOrders();
  }, [filterStatus]);

  // Realtime subscription for order updates
  useEffect(() => {
    if (!user || !isShipper) return;
    const channel = supabase
      .channel('shipper-orders')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `shipper_id=eq.${user.id}`,
      }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, isShipper]);

  // Location tracking
  const startTracking = useCallback(async (orderId: string) => {
    if (!user) return;
    setIsTracking(true);
    toast.success('Bắt đầu theo dõi vị trí');

    if (currentLocation) {
      await supabase.from('shipper_locations').upsert({
        shipper_id: user.id,
        order_id: orderId,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        is_online: true,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'shipper_id',
      });
    }
  }, [user, currentLocation]);

  const stopTracking = useCallback(async () => {
    setIsTracking(false);
    toast.info('Đã dừng theo dõi vị trí');

    if (user) {
      await supabase
        .from('shipper_locations')
        .update({ is_online: false })
        .eq('shipper_id', user.id);
    }
  }, [user]);

  const handleLocationUpdate = useCallback(async (location: { lat: number; lng: number }) => {
    setCurrentLocation(location);
    if (isTracking && user && selectedOrder) {
      await supabase.from('shipper_locations').upsert({
        shipper_id: user.id,
        order_id: selectedOrder.id,
        latitude: location.lat,
        longitude: location.lng,
        is_online: true,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'shipper_id',
      });
    }
  }, [isTracking, user, selectedOrder]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('orders')
      .update({ 
        shipper_status: newStatus,
        status: newStatus === 'delivered' ? 'completed' : 
                newStatus === 'cancelled' ? 'cancelled' : 'shipping',
        actual_delivery: newStatus === 'delivered' ? new Date().toISOString() : null,
      })
      .eq('id', orderId)
      .eq('shipper_id', user.id);

    if (error) {
      toast.error('Không thể cập nhật trạng thái');
      return;
    }

    // Add to tracking history
    await supabase.from('order_tracking').insert({
      order_id: orderId,
      status: newStatus,
      created_by: user.id,
      location_lat: currentLocation?.lat,
      location_lng: currentLocation?.lng,
      note: `Shipper cập nhật: ${SHIPPER_STATUS_CONFIG[newStatus]?.label || newStatus}`,
    });

    toast.success(`Cập nhật: ${SHIPPER_STATUS_CONFIG[newStatus]?.label}`);
    fetchOrders();

    if (newStatus === 'delivered' || newStatus === 'cancelled') {
      stopTracking();
    }

    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, shipper_status: newStatus });
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    return currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1
      ? STATUS_FLOW[currentIndex + 1]
      : null;
  };

  const getNextStatusLabel = (nextStatus: string | null) => {
    if (!nextStatus) return '';
    const labels: Record<string, string> = {
      picking_up: 'Bắt đầu lấy hàng',
      delivering: 'Bắt đầu giao',
      delivered: 'Xác nhận đã giao',
    };
    return labels[nextStatus] || '';
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-16 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!isShipper) return null;

  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.shipper_status || ''));
  const deliveredCount = orders.filter((o) => o.shipper_status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.shipper_status === 'cancelled').length;
  const totalRevenue = orders
    .filter((o) => o.shipper_status === 'delivered')
    .reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <Layout>
      <div className="container py-6 md:py-8 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-display flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Truck className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              </div>
              Dashboard Shipper
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Quản lý và theo dõi đơn hàng giao
            </p>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả đơn hàng</SelectItem>
              <SelectItem value="assigned">Đã nhận đơn</SelectItem>
              <SelectItem value="picking_up">Đang lấy hàng</SelectItem>
              <SelectItem value="delivering">Đang giao</SelectItem>
              <SelectItem value="delivered">Đã giao</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-xl">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeOrders.length}</p>
                  <p className="text-xs text-muted-foreground">Đang xử lý</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-500/10 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{deliveredCount}</p>
                  <p className="text-xs text-muted-foreground">Đã giao</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-xl", isTracking ? "bg-green-500/10" : "bg-muted")}>
                  <Navigation className={cn("h-5 w-5", isTracking ? "text-green-500 animate-pulse" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{isTracking ? 'ON' : 'OFF'}</p>
                  <p className="text-xs text-muted-foreground">GPS Tracking</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-500/10 rounded-xl">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {avgRating.count > 0 ? avgRating.avg : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {avgRating.count > 0 ? `${avgRating.count} đánh giá` : 'Chưa có'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold truncate">
                    {deliveredCount > 0 ? formatCurrency(totalRevenue) : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Tổng giá trị giao</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders - Priority */}
        {activeOrders.length > 0 && filterStatus === 'all' && (
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Timer className="h-5 w-5 text-primary" />
                Đơn hàng cần xử lý ({activeOrders.length})
              </CardTitle>
              <CardDescription>Các đơn hàng đang chờ bạn thao tác</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {activeOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onDetail={() => setSelectedOrder(order)}
                    onNextStatus={(status) => updateOrderStatus(order.id, status)}
                    formatCurrency={formatCurrency}
                    getNextStatus={getNextStatus}
                    getNextStatusLabel={getNextStatusLabel}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Orders */}
        <Card className="border-0 shadow-md overflow-hidden">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5 text-muted-foreground" />
              {filterStatus === 'all' ? 'Tất cả đơn hàng' : SHIPPER_STATUS_CONFIG[filterStatus]?.label || 'Đơn hàng'}
              <Badge variant="secondary" className="ml-1">{orders.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Chưa có đơn hàng</h3>
                <p className="text-muted-foreground text-sm">
                  {filterStatus !== 'all' 
                    ? 'Không có đơn hàng nào với trạng thái này'
                    : 'Bạn chưa được giao đơn hàng nào'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onDetail={() => setSelectedOrder(order)}
                    onNextStatus={(status) => updateOrderStatus(order.id, status)}
                    formatCurrency={formatCurrency}
                    getNextStatus={getNextStatus}
                    getNextStatusLabel={getNextStatusLabel}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-muted-foreground" />
                Đơn hàng #{selectedOrder?.id.slice(0, 8).toUpperCase()}
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <OrderDetailContent
                order={selectedOrder}
                currentLocation={currentLocation}
                isTracking={isTracking}
                onStartTracking={() => startTracking(selectedOrder.id)}
                onStopTracking={stopTracking}
                onLocationUpdate={handleLocationUpdate}
                onUpdateStatus={(status) => {
                  updateOrderStatus(selectedOrder.id, status);
                  if (status === 'cancelled') setSelectedOrder(null);
                  else setSelectedOrder({ ...selectedOrder, shipper_status: status });
                }}
                formatCurrency={formatCurrency}
                getNextStatus={getNextStatus}
                getNextStatusLabel={getNextStatusLabel}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

// --- Sub-components ---

function OrderRow({
  order,
  onDetail,
  onNextStatus,
  formatCurrency,
  getNextStatus,
  getNextStatusLabel,
}: {
  order: Order;
  onDetail: () => void;
  onNextStatus: (status: string) => void;
  formatCurrency: (n: number) => string;
  getNextStatus: (s: string) => string | null;
  getNextStatusLabel: (s: string | null) => string;
}) {
  const statusConfig = SHIPPER_STATUS_CONFIG[order.shipper_status || 'assigned'];
  const StatusIcon = statusConfig?.icon || Package;
  const nextStatus = getNextStatus(order.shipper_status || 'assigned');

  return (
    <div className="p-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={onDetail}>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-foreground">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
            <Badge variant="outline" className={cn("text-xs border", statusConfig?.bgLight)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig?.label}
            </Badge>
            <span className="text-xs text-muted-foreground ml-auto sm:ml-0">
              {format(new Date(order.created_at), 'dd/MM HH:mm', { locale: vi })}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{order.customer_name}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{order.customer_address || 'Chưa có địa chỉ'}</span>
            </div>
            {order.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <a
                  href={`tel:${order.customer_phone}`}
                  className="text-primary hover:underline text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {order.customer_phone}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 shrink-0">
          <p className="text-lg font-bold text-primary">
            {formatCurrency(order.total_amount)}
          </p>
          {nextStatus && (
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); onNextStatus(nextStatus); }}
              className="text-xs gap-1"
            >
              {getNextStatusLabel(nextStatus)}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderDetailContent({
  order,
  currentLocation,
  isTracking,
  onStartTracking,
  onStopTracking,
  onLocationUpdate,
  onUpdateStatus,
  formatCurrency,
  getNextStatus,
  getNextStatusLabel,
}: {
  order: Order;
  currentLocation: { lat: number; lng: number } | null;
  isTracking: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onLocationUpdate: (loc: { lat: number; lng: number }) => void;
  onUpdateStatus: (status: string) => void;
  formatCurrency: (n: number) => string;
  getNextStatus: (s: string) => string | null;
  getNextStatusLabel: (s: string | null) => string;
}) {
  const statusConfig = SHIPPER_STATUS_CONFIG[order.shipper_status || 'assigned'];
  const nextStatus = getNextStatus(order.shipper_status || 'assigned');
  const isFinished = order.shipper_status === 'delivered' || order.shipper_status === 'cancelled';

  // Status progress
  const currentIdx = STATUS_FLOW.indexOf(order.shipper_status || 'assigned');

  return (
    <div className="space-y-5">
      {/* Status Progress */}
      <div className="flex items-center gap-1">
        {STATUS_FLOW.map((s, idx) => {
          const cfg = SHIPPER_STATUS_CONFIG[s];
          const Icon = cfg.icon;
          const isActive = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all",
                isCurrent ? "bg-primary text-primary-foreground ring-2 ring-primary/30 scale-110" :
                isActive ? "bg-primary/70 text-primary-foreground" :
                "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              {idx < STATUS_FLOW.length - 1 && (
                <div className={cn("h-0.5 flex-1 rounded-full", isActive ? "bg-primary/50" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between px-1">
        {STATUS_FLOW.map((s) => (
          <p key={s} className="text-[10px] text-muted-foreground text-center w-1/4">
            {SHIPPER_STATUS_CONFIG[s].label}
          </p>
        ))}
      </div>

      {/* Map */}
      {order.delivery_address_lat && order.delivery_address_lng && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" />
            Bản đồ điều hướng
          </h4>
          <GoogleMap
            shipperLocation={currentLocation}
            destinationLocation={{
              lat: order.delivery_address_lat,
              lng: order.delivery_address_lng,
            }}
            isShipperMode={true}
            onShipperMove={onLocationUpdate}
            showRoute={true}
            className="h-[250px] rounded-xl overflow-hidden"
          />
          {!isFinished && (
            <div className="flex gap-2">
              {!isTracking ? (
                <Button onClick={onStartTracking} className="flex-1 gap-2" size="sm">
                  <Play className="h-4 w-4" />
                  Bắt đầu tracking
                </Button>
              ) : (
                <Button variant="destructive" onClick={onStopTracking} className="flex-1 gap-2" size="sm">
                  <Square className="h-4 w-4" />
                  Dừng tracking
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Customer Info */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Thông tin khách hàng</h4>
        <div className="bg-muted/40 rounded-xl p-4 space-y-2.5 text-sm">
          <div className="flex items-center gap-2.5">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">{order.customer_name}</span>
          </div>
          {order.customer_phone && (
            <div className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={`tel:${order.customer_phone}`} className="text-primary hover:underline">
                {order.customer_phone}
              </a>
            </div>
          )}
          {order.customer_email && (
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{order.customer_email}</span>
            </div>
          )}
          <div className="flex items-start gap-2.5">
            <Home className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <span>{order.customer_address || 'Chưa có địa chỉ'}</span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Sản phẩm ({order.items.length})</h4>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
              {item.image_url ? (
                <img src={item.image_url} className="w-12 h-12 rounded-lg object-cover shrink-0" alt={item.name} />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">SL: {item.quantity}</p>
              </div>
              <p className="font-semibold text-sm shrink-0">{formatCurrency(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="font-medium">Tổng tiền thu hộ:</span>
        <span className="text-xl font-bold text-primary">{formatCurrency(order.total_amount)}</span>
      </div>

      {/* Actions */}
      {!isFinished && (
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => onUpdateStatus('cancelled')}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Hủy giao
          </Button>
          {nextStatus && (
            <Button className="flex-1" onClick={() => onUpdateStatus(nextStatus)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {getNextStatusLabel(nextStatus)}
            </Button>
          )}
        </div>
      )}

      {order.shipper_status === 'delivered' && (
        <div className="text-center py-2">
          <Badge className="bg-green-500/10 text-green-600 border-green-200 text-sm px-4 py-1.5">
            <CheckCircle className="h-4 w-4 mr-2" />
            Đã giao thành công
          </Badge>
        </div>
      )}

      {order.shipper_status === 'cancelled' && (
        <div className="text-center py-2">
          <Badge className="bg-red-500/10 text-red-600 border-red-200 text-sm px-4 py-1.5">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Đơn hàng đã hủy
          </Badge>
        </div>
      )}
    </div>
  );
}
