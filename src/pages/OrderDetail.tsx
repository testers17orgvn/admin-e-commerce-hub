 import { useEffect, useState } from 'react';
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
   Calendar, CreditCard, FileText, Truck
 } from 'lucide-react';
 import { format } from 'date-fns';
 import { vi } from 'date-fns/locale';
 import { Order, OrderItem } from '@/lib/types';
 import { toast } from 'sonner';
 
 const statusConfig: Record<string, { label: string; color: string }> = {
   pending: { label: 'Chờ xử lý', color: 'bg-yellow-500/20 text-yellow-600' },
   confirmed: { label: 'Đã xác nhận', color: 'bg-blue-500/20 text-blue-600' },
   shipping: { label: 'Đang giao', color: 'bg-purple-500/20 text-purple-600' },
   completed: { label: 'Hoàn thành', color: 'bg-green-500/20 text-green-600' },
   delivered: { label: 'Đã giao', color: 'bg-green-500/20 text-green-600' },
   cancelled: { label: 'Đã hủy', color: 'bg-red-500/20 text-red-600' },
 };
 
 export default function OrderDetail() {
   const { id } = useParams<{ id: string }>();
   const { user, loading: authLoading } = useAuth();
   const navigate = useNavigate();
   const [order, setOrder] = useState<Order | null>(null);
   const [loading, setLoading] = useState(true);
 
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
     }
 
     setLoading(false);
   };
 
   // Subscribe to realtime order updates
   useEffect(() => {
     if (!id) return;
 
     const channel = supabase
       .channel(`order-${id}`)
       .on(
         'postgres_changes',
         {
           event: 'UPDATE',
           schema: 'public',
           table: 'orders',
           filter: `id=eq.${id}`,
         },
         (payload) => {
           setOrder((prev) => {
             if (!prev) return prev;
             return {
               ...prev,
               ...payload.new,
               items: prev.items, // Keep parsed items
             } as Order;
           });
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [id]);
 
   const formatCurrency = (amount: number) =>
     new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
 
   if (authLoading || loading) {
     return (
       <Layout>
         <div className="container py-8 space-y-6">
           <Skeleton className="h-8 w-48" />
           <Skeleton className="h-96 w-full" />
         </div>
       </Layout>
     );
   }
 
   if (!order) {
     return (
       <Layout>
         <div className="container py-8 text-center">
           <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
           <h2 className="text-xl font-semibold">Không tìm thấy đơn hàng</h2>
           <Button asChild className="mt-4">
             <Link to="/orders">Quay lại</Link>
           </Button>
         </div>
       </Layout>
     );
   }
 
   const status = statusConfig[order.status] || statusConfig.pending;
 
   return (
     <Layout>
       <div className="container py-6 md:py-8 space-y-6">
         {/* Header */}
         <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
             <ArrowLeft className="h-5 w-5" />
           </Button>
           <div className="flex-1">
             <h1 className="text-2xl font-bold">
               Đơn hàng #{order.id.slice(0, 8).toUpperCase()}
             </h1>
             <p className="text-muted-foreground text-sm">
               Đặt lúc {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
             </p>
           </div>
           <Badge className={status.color}>{status.label}</Badge>
         </div>
 
         <div className="grid lg:grid-cols-3 gap-6">
           {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tracking Map - show for all non-cancelled orders */}
              {order.status !== 'cancelled' && (
                <OrderTrackingMap order={order} />
              )}
 
             {/* Order Items */}
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Package className="h-5 w-5 text-primary" />
                   Sản phẩm ({order.items.length})
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {order.items.map((item, index) => (
                     <div key={index} className="flex gap-4">
                       <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
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
                       <div className="flex-1 min-w-0">
                         <h4 className="font-medium">{item.name}</h4>
                         <p className="text-sm text-muted-foreground">
                           {item.selectedColor && `Màu: ${item.selectedColor}`}
                           {item.selectedColor && item.selectedSize && ' • '}
                           {item.selectedSize && `Size: ${item.selectedSize}`}
                         </p>
                         <p className="text-sm text-muted-foreground">
                           Số lượng: {item.quantity}
                         </p>
                       </div>
                       <div className="text-right">
                         <p className="font-semibold text-primary">
                           {formatCurrency(item.price * item.quantity)}
                         </p>
                         <p className="text-sm text-muted-foreground">
                           {formatCurrency(item.price)} x {item.quantity}
                         </p>
                       </div>
                     </div>
                   ))}
                 </div>
 
                 <div className="border-t mt-4 pt-4 space-y-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Tạm tính</span>
                     <span>{formatCurrency(order.total_amount)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Phí vận chuyển</span>
                     <span className="text-green-600">Miễn phí</span>
                   </div>
                   <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                     <span>Tổng cộng</span>
                     <span className="text-primary">{formatCurrency(order.total_amount)}</span>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
 
           {/* Sidebar */}
           <div className="space-y-6">
             {/* Customer Info */}
             <Card>
               <CardHeader>
                 <CardTitle className="text-lg">Thông tin nhận hàng</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-muted rounded-lg">
                     <Truck className="h-4 w-4" />
                   </div>
                   <div>
                     <p className="font-medium">{order.customer_name}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-muted rounded-lg">
                     <Phone className="h-4 w-4" />
                   </div>
                   <p>{order.customer_phone || 'Chưa có'}</p>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-muted rounded-lg">
                     <Mail className="h-4 w-4" />
                   </div>
                   <p className="text-sm">{order.customer_email}</p>
                 </div>
                 <div className="flex items-start gap-3">
                   <div className="p-2 bg-muted rounded-lg">
                     <MapPin className="h-4 w-4" />
                   </div>
                   <p className="text-sm">{order.customer_address || 'Chưa có địa chỉ'}</p>
                 </div>
               </CardContent>
             </Card>
 
             {/* Notes */}
             {order.notes && (
               <Card>
                 <CardHeader>
                   <CardTitle className="text-lg flex items-center gap-2">
                     <FileText className="h-4 w-4" />
                     Ghi chú
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-muted-foreground">{order.notes}</p>
                 </CardContent>
               </Card>
              )}

              {/* Shipper Rating - show for delivered orders */}
              {(order.status === 'completed' || order.status === 'delivered' || order.shipper_status === 'delivered') && order.shipper_id && (
                <ShipperRating orderId={order.id} shipperId={order.shipper_id} />
              )}
            </div>
         </div>
       </div>
     </Layout>
   );
 }