import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderTrackingMap } from '@/components/orders/OrderTrackingMap';
import { ShipperRating } from '@/components/orders/ShipperRating';
import { 
  ArrowLeft, Package, MapPin, Phone, Mail, 
  Calendar, FileText, Truck, Clock, CheckCircle2,
  XCircle, ShieldCheck, PackageCheck, CircleDot,
  Copy, Check
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Order, OrderItem } from '@/lib/types';
import { toast } from 'sonner';

const ORDER_STEPS = [
  { key: 'pending', label: 'Đặt hàng', icon: Clock, description: 'Đơn hàng đã được tạo' },
  { key: 'confirmed', label: 'Xác nhận', icon: ShieldCheck, description: 'Đã xác nhận đơn hàng' },
  { key: 'shipping', label: 'Đang giao', icon: Truck, description: 'Shipper đang giao hàng' },
  { key: 'completed', label: 'Hoàn thành', icon: PackageCheck, description: 'Giao hàng thành công' },
];

const getStepIndex = (status: string) => {
  if (status === 'cancelled') return -1;
  if (status === 'delivered') return 3;
  const idx = ORDER_STEPS.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [productSlugs, setProductSlugs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user && id) {
      fetchOrder();
    }
  }, [user, authLoading, id]);

  const fetchOrder = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Không tìm thấy đơn hàng');
      navigate('/orders');
      return;
    }

    if (data) {
      const orderData = {
        ...data,
        items: (data.items as unknown as OrderItem[]) || [],
      };
      setOrder(orderData as Order);

      // Fetch product slugs for links
      const productIds = orderData.items.map((item: OrderItem) => item.product_id).filter(Boolean);
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, slug')
          .in('id', productIds);
        if (products) {
          const slugMap: Record<string, string> = {};
          products.forEach(p => { slugMap[p.id] = p.slug; });
          setProductSlugs(slugMap);
        }
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${id}`,
      }, (payload) => {
        setOrder((prev) => {
          if (!prev) return prev;
          return { ...prev, ...payload.new, items: prev.items } as Order;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const copyOrderId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.id);
    setCopiedId(true);
    toast.success('Đã sao chép mã đơn hàng');
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-muted-foreground mb-6">Đơn hàng không tồn tại hoặc bạn không có quyền xem.</p>
          <Button asChild>
            <Link to="/orders">Quay lại lịch sử đơn hàng</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <Layout>
      <div className="container py-6 md:py-8 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mt-1 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                Đơn hàng #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <button onClick={copyOrderId} className="text-muted-foreground hover:text-foreground transition-colors">
                {copiedId ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(order.created_at), "HH:mm - dd/MM/yyyy", { locale: vi })}</span>
            </div>
          </div>
          {isCancelled ? (
            <Badge className="bg-destructive/10 text-destructive border-destructive/20 shrink-0">
              <XCircle className="h-3.5 w-3.5 mr-1" /> Đã hủy
            </Badge>
          ) : currentStep >= 3 ? (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Hoàn thành
            </Badge>
          ) : (
            <Badge className="bg-accent/10 text-accent border-accent/20 shrink-0">
              <CircleDot className="h-3.5 w-3.5 mr-1" /> Đang xử lý
            </Badge>
          )}
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-6 md:p-8">
              <div className="relative">
                {/* Desktop Timeline */}
                <div className="hidden md:flex items-start justify-between relative">
                  {/* Progress Bar Background */}
                  <div className="absolute top-5 left-[calc(12.5%)] right-[calc(12.5%)] h-1 bg-border rounded-full" />
                  {/* Progress Bar Active */}
                  <div
                    className="absolute top-5 left-[calc(12.5%)] h-1 bg-gradient-to-r from-accent to-accent/80 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${(currentStep / (ORDER_STEPS.length - 1)) * 75}%` }}
                  />
                  
                  {ORDER_STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isActive = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div key={step.key} className="flex flex-col items-center text-center z-10 w-1/4">
                        <div className={`
                          relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                          ${isCurrent ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/30 scale-110 ring-4 ring-accent/20' :
                            isActive ? 'bg-accent/80 text-accent-foreground' :
                            'bg-muted text-muted-foreground'}
                        `}>
                          <StepIcon className="h-4.5 w-4.5" />
                          {isCurrent && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                          )}
                        </div>
                        <p className={`mt-3 text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </p>
                        <p className={`text-xs mt-0.5 ${isActive ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                          {step.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Timeline - Vertical */}
                <div className="md:hidden space-y-0">
                  {ORDER_STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isActive = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    const isLast = idx === ORDER_STEPS.length - 1;
                    return (
                      <div key={step.key} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`
                            w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all
                            ${isCurrent ? 'bg-accent text-accent-foreground shadow-md shadow-accent/30 ring-2 ring-accent/20' :
                              isActive ? 'bg-accent/80 text-accent-foreground' :
                              'bg-muted text-muted-foreground'}
                          `}>
                            <StepIcon className="h-4 w-4" />
                          </div>
                          {!isLast && (
                            <div className={`w-0.5 h-8 my-1 rounded-full ${idx < currentStep ? 'bg-accent/60' : 'bg-border'}`} />
                          )}
                        </div>
                        <div className={`pb-4 ${isLast ? '' : ''}`}>
                          <p className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                          </p>
                          <p className={`text-xs ${isActive ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancelled Banner */}
        {isCancelled && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-destructive">Đơn hàng đã bị hủy</p>
                <p className="text-sm text-muted-foreground">Đơn hàng này không còn được xử lý.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Map */}
            {order.status !== 'cancelled' && order.shipper_id && (
              <OrderTrackingMap order={order} />
            )}

            {/* Order Items */}
            <Card className="overflow-hidden border-0 shadow-md">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-5 w-5 text-accent" />
                  Sản phẩm đã đặt ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {order.items.map((item, index) => {
                    // Build product link using product_id (slug not available in order items)
                    const productLink = item.product_id ? `/products/${item.product_id}` : '#';
                    
                    return (
                      <div key={index} className="flex gap-4 p-4 hover:bg-muted/20 transition-colors">
                        <Link to={productLink} className="shrink-0">
                          <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden ring-1 ring-border/50 hover:ring-accent/50 transition-all">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={productLink} className="hover:text-accent transition-colors">
                            <h4 className="font-medium line-clamp-1">{item.name}</h4>
                          </Link>
                          {(item.selectedColor || item.selectedSize) && (
                            <div className="flex items-center gap-2 mt-1">
                              {item.selectedColor && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-muted rounded-full">
                                  Màu: {item.selectedColor}
                                </span>
                              )}
                              {item.selectedSize && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-muted rounded-full">
                                  Size: {item.selectedSize}
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-accent">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                <div className="border-t bg-muted/20 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tạm tính</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phí vận chuyển</span>
                    <span className="text-green-600 font-medium">Miễn phí</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-dashed">
                    <span>Tổng cộng</span>
                    <span className="text-accent">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card className="overflow-hidden border-0 shadow-md">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-base">Thông tin nhận hàng</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Truck className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Người nhận</p>
                    <p className="font-medium">{order.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Điện thoại</p>
                    <p className="font-medium">{order.customer_phone || 'Chưa có'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-sm break-all">{order.customer_email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Địa chỉ</p>
                    <p className="font-medium text-sm">{order.customer_address || 'Chưa có địa chỉ'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Status */}
            <Card className="overflow-hidden border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    order.status === 'completed' || order.status === 'delivered' 
                      ? 'bg-green-500/10' : 'bg-accent/10'
                  }`}>
                    <CheckCircle2 className={`h-5 w-5 ${
                      order.status === 'completed' || order.status === 'delivered' 
                        ? 'text-green-600' : 'text-accent'
                    }`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {order.status === 'completed' || order.status === 'delivered' 
                        ? 'Thanh toán thành công' 
                        : order.status === 'cancelled' ? 'Đã hủy thanh toán' : 'Chờ xác nhận thanh toán'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.status === 'completed' || order.status === 'delivered'
                        ? 'Đơn hàng đã được thanh toán và hoàn tất.'
                        : order.status === 'cancelled' ? 'Giao dịch đã bị hủy bỏ.'
                        : 'Đang chờ xác nhận từ hệ thống.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {order.notes && (
              <Card className="overflow-hidden border-0 shadow-md">
                <CardHeader className="bg-muted/30 border-b py-3 px-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent" />
                    Ghi chú
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Shipper Rating */}
            {(order.status === 'completed' || order.status === 'delivered' || order.shipper_status === 'delivered') && order.shipper_id && (
              <ShipperRating orderId={order.id} shipperId={order.shipper_id} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
