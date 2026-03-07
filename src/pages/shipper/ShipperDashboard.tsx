 import { useEffect, useState, useCallback } from 'react';
 import { useNavigate, Link } from 'react-router-dom';
 import { useAuth } from '@/hooks/useAuth';
 import { supabase } from '@/integrations/supabase/client';
 import { Layout } from '@/components/layout/Layout';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { GoogleMap } from '@/components/maps/GoogleMap';
  import { 
    Package, MapPin, Navigation, Phone, Clock, 
    CheckCircle, XCircle, Truck, User, Play, 
    Square, AlertCircle, Home, Star
  } from 'lucide-react';
 import { toast } from 'sonner';
 import { format } from 'date-fns';
 import { vi } from 'date-fns/locale';
 import { Order, OrderItem } from '@/lib/types';
 import { cn } from '@/lib/utils';
 
 const SHIPPER_STATUS_CONFIG = {
   assigned: { label: 'Đã nhận đơn', color: 'bg-blue-500', icon: Package },
   picking_up: { label: 'Đang lấy hàng', color: 'bg-yellow-500', icon: MapPin },
   delivering: { label: 'Đang giao hàng', color: 'bg-purple-500', icon: Truck },
   delivered: { label: 'Đã giao', color: 'bg-green-500', icon: CheckCircle },
   cancelled: { label: 'Đã hủy', color: 'bg-red-500', icon: XCircle },
 };
 
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
     fetchOrders();
   }, [filterStatus]);
 
   // Location tracking
   const startTracking = useCallback(async (orderId: string) => {
     if (!user) return;
 
     setIsTracking(true);
     toast.success('Bắt đầu theo dõi vị trí');
 
     // Insert initial location
     if (currentLocation) {
       await supabase.from('shipper_locations').upsert({
         shipper_id: user.id,
         order_id: orderId,
         latitude: currentLocation.lat,
         longitude: currentLocation.lng,
         is_online: true,
         last_updated: new Date().toISOString(),
       }, {
         onConflict: 'shipper_id,order_id',
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
         onConflict: 'shipper_id,order_id',
       });
     }
   }, [isTracking, user, selectedOrder]);
 
   const updateOrderStatus = async (orderId: string, newStatus: string) => {
     if (!user) return;
 
     const { error } = await supabase
       .from('orders')
       .update({ 
         shipper_status: newStatus,
         status: newStatus === 'delivered' ? 'completed' : 'shipping',
         actual_delivery: newStatus === 'delivered' ? new Date().toISOString() : null,
       })
       .eq('id', orderId);
 
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
     });
 
     toast.success('Cập nhật trạng thái thành công');
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
     const statusFlow = ['assigned', 'picking_up', 'delivering', 'delivered'];
     const currentIndex = statusFlow.indexOf(currentStatus);
     if (currentIndex < statusFlow.length - 1) {
       return statusFlow[currentIndex + 1];
     }
     return null;
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
   const completedOrders = orders.filter((o) => ['delivered', 'cancelled'].includes(o.shipper_status || ''));
 
   return (
     <Layout>
       <div className="container py-8 space-y-6">
         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
             <h1 className="text-3xl font-bold font-display flex items-center gap-3">
               <Truck className="h-8 w-8 text-primary" />
               Dashboard Shipper
             </h1>
             <p className="text-muted-foreground mt-1">
               Quản lý và theo dõi đơn hàng giao
             </p>
           </div>
           <Select value={filterStatus} onValueChange={setFilterStatus}>
             <SelectTrigger className="w-48">
               <SelectValue placeholder="Lọc trạng thái" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Tất cả</SelectItem>
               <SelectItem value="assigned">Đã nhận đơn</SelectItem>
               <SelectItem value="picking_up">Đang lấy hàng</SelectItem>
               <SelectItem value="delivering">Đang giao</SelectItem>
               <SelectItem value="delivered">Đã giao</SelectItem>
               <SelectItem value="cancelled">Đã hủy</SelectItem>
             </SelectContent>
           </Select>
         </div>
 
         {/* Stats */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <Card>
             <CardContent className="p-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-500/10 rounded-lg">
                   <Package className="h-5 w-5 text-blue-500" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold">{activeOrders.length}</p>
                   <p className="text-sm text-muted-foreground">Đang xử lý</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-green-500/10 rounded-lg">
                   <CheckCircle className="h-5 w-5 text-green-500" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold">
                     {orders.filter((o) => o.shipper_status === 'delivered').length}
                   </p>
                   <p className="text-sm text-muted-foreground">Đã giao</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-500/10 rounded-lg">
                   <Navigation className="h-5 w-5 text-purple-500" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold">
                     {isTracking ? 'ON' : 'OFF'}
                   </p>
                   <p className="text-sm text-muted-foreground">GPS</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-yellow-500/10 rounded-lg">
                   <Clock className="h-5 w-5 text-yellow-500" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold">{orders.length}</p>
                   <p className="text-sm text-muted-foreground">Tổng đơn</p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Orders List */}
         <Card>
           <CardHeader>
             <CardTitle>Đơn hàng của tôi</CardTitle>
             <CardDescription>Danh sách đơn hàng được giao</CardDescription>
           </CardHeader>
           <CardContent>
             {orders.length === 0 ? (
               <div className="text-center py-12">
                 <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                 <h3 className="text-lg font-semibold">Chưa có đơn hàng</h3>
                 <p className="text-muted-foreground">Bạn chưa được giao đơn hàng nào</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {orders.map((order) => {
                   const statusConfig = SHIPPER_STATUS_CONFIG[order.shipper_status as keyof typeof SHIPPER_STATUS_CONFIG];
                   const StatusIcon = statusConfig?.icon || Package;
                   const nextStatus = getNextStatus(order.shipper_status || 'assigned');
 
                   return (
                     <div
                       key={order.id}
                       className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
                     >
                       <div className="flex flex-col md:flex-row gap-4">
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-2">
                             <span className="font-mono text-sm font-semibold">
                               #{order.id.slice(0, 8).toUpperCase()}
                             </span>
                             <Badge className={cn(statusConfig?.color, 'text-white')}>
                               <StatusIcon className="h-3 w-3 mr-1" />
                               {statusConfig?.label}
                             </Badge>
                           </div>
                           <div className="space-y-1 text-sm">
                             <div className="flex items-center gap-2">
                               <User className="h-4 w-4 text-muted-foreground" />
                               <span>{order.customer_name}</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <MapPin className="h-4 w-4 text-muted-foreground" />
                               <span className="line-clamp-1">{order.customer_address}</span>
                             </div>
                             {order.customer_phone && (
                               <div className="flex items-center gap-2">
                                 <Phone className="h-4 w-4 text-muted-foreground" />
                                 <a href={`tel:${order.customer_phone}`} className="text-primary hover:underline">
                                   {order.customer_phone}
                                 </a>
                               </div>
                             )}
                           </div>
                           <p className="text-lg font-bold text-primary mt-2">
                             {formatCurrency(order.total_amount)}
                           </p>
                         </div>
 
                         <div className="flex flex-col gap-2 md:items-end">
                           <p className="text-sm text-muted-foreground">
                             {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                           </p>
                           <div className="flex gap-2">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setSelectedOrder(order)}
                             >
                               Chi tiết
                             </Button>
                             {nextStatus && (
                               <Button
                                 size="sm"
                                 onClick={() => updateOrderStatus(order.id, nextStatus)}
                               >
                                 {nextStatus === 'picking_up' && 'Bắt đầu lấy'}
                                 {nextStatus === 'delivering' && 'Bắt đầu giao'}
                                 {nextStatus === 'delivered' && 'Hoàn thành'}
                               </Button>
                             )}
                           </div>
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
           </CardContent>
         </Card>
 
         {/* Order Detail Dialog */}
         <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
           <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle>
                 Chi tiết đơn hàng #{selectedOrder?.id.slice(0, 8).toUpperCase()}
               </DialogTitle>
             </DialogHeader>
             {selectedOrder && (
               <div className="space-y-6">
                 {/* Map */}
                 {selectedOrder.delivery_address_lat && selectedOrder.delivery_address_lng && (
                   <div>
                     <h4 className="font-medium mb-2">Bản đồ điều hướng</h4>
                     <GoogleMap
                       shipperLocation={currentLocation}
                       destinationLocation={{
                         lat: selectedOrder.delivery_address_lat,
                         lng: selectedOrder.delivery_address_lng,
                       }}
                       isShipperMode={true}
                       onShipperMove={handleLocationUpdate}
                       showRoute={true}
                       className="h-[300px]"
                     />
                     <div className="flex gap-2 mt-3">
                       {!isTracking ? (
                         <Button onClick={() => startTracking(selectedOrder.id)} className="flex-1">
                           <Play className="h-4 w-4 mr-2" />
                           Bắt đầu tracking
                         </Button>
                       ) : (
                         <Button variant="destructive" onClick={stopTracking} className="flex-1">
                           <Square className="h-4 w-4 mr-2" />
                           Dừng tracking
                         </Button>
                       )}
                     </div>
                   </div>
                 )}
 
                 {/* Customer Info */}
                 <div>
                   <h4 className="font-medium mb-2">Thông tin khách hàng</h4>
                   <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                     <div className="flex items-center gap-2">
                       <User className="h-4 w-4 text-muted-foreground" />
                       <span>{selectedOrder.customer_name}</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <Phone className="h-4 w-4 text-muted-foreground" />
                       <a href={`tel:${selectedOrder.customer_phone}`} className="text-primary hover:underline">
                         {selectedOrder.customer_phone}
                       </a>
                     </div>
                     <div className="flex items-start gap-2">
                       <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                       <span>{selectedOrder.customer_address}</span>
                     </div>
                   </div>
                 </div>
 
                 {/* Order Items */}
                 <div>
                   <h4 className="font-medium mb-2">Sản phẩm ({selectedOrder.items.length})</h4>
                   <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                     {selectedOrder.items.map((item, i) => (
                       <div key={i} className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                           {item.image_url && (
                             <img src={item.image_url} className="w-12 h-12 rounded object-cover" />
                           )}
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
 
                 {/* Total & Actions */}
                 <div className="flex justify-between items-center pt-4 border-t">
                   <span className="text-lg font-medium">Tổng tiền:</span>
                   <span className="text-2xl font-bold text-primary">
                     {formatCurrency(selectedOrder.total_amount)}
                   </span>
                 </div>
 
                 {selectedOrder.shipper_status !== 'delivered' && selectedOrder.shipper_status !== 'cancelled' && (
                   <div className="flex gap-2">
                     <Button
                       variant="destructive"
                       className="flex-1"
                       onClick={() => {
                         updateOrderStatus(selectedOrder.id, 'cancelled');
                         setSelectedOrder(null);
                       }}
                     >
                       <XCircle className="h-4 w-4 mr-2" />
                       Hủy giao
                     </Button>
                     {getNextStatus(selectedOrder.shipper_status || 'assigned') && (
                       <Button
                         className="flex-1"
                         onClick={() => {
                           const next = getNextStatus(selectedOrder.shipper_status || 'assigned');
                           if (next) {
                             updateOrderStatus(selectedOrder.id, next);
                             setSelectedOrder({ ...selectedOrder, shipper_status: next });
                           }
                         }}
                       >
                         <CheckCircle className="h-4 w-4 mr-2" />
                         {getNextStatus(selectedOrder.shipper_status || 'assigned') === 'picking_up' && 'Bắt đầu lấy hàng'}
                         {getNextStatus(selectedOrder.shipper_status || 'assigned') === 'delivering' && 'Bắt đầu giao'}
                         {getNextStatus(selectedOrder.shipper_status || 'assigned') === 'delivered' && 'Hoàn thành giao'}
                       </Button>
                     )}
                   </div>
                 )}
               </div>
             )}
           </DialogContent>
         </Dialog>
       </div>
     </Layout>
   );
 }