import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Truck, Package, MapPin, User, Phone, 
  Search, UserPlus, CheckCircle, Clock, Star, MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Order, OrderItem } from '@/lib/types';

interface Shipper {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface ShipperReview {
  id: string;
  order_id: string;
  shipper_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface ShipperStats {
  shipper: Shipper;
  reviews: ShipperReview[];
  avgRating: number;
  totalReviews: number;
  ratingDistribution: number[];
}
 
 export default function ShipperManagement() {
   const [orders, setOrders] = useState<Order[]>([]);
   const [shippers, setShippers] = useState<Shipper[]>([]);
   const [loading, setLoading] = useState(true);
   const [filterStatus, setFilterStatus] = useState('unassigned');
   const [assignDialogOpen, setAssignDialogOpen] = useState(false);
   const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
   const [selectedShipper, setSelectedShipper] = useState<string>('');
   const [searchShipper, setSearchShipper] = useState('');
 
   useEffect(() => {
     fetchData();
   }, [filterStatus]);
 
   const fetchData = async () => {
     // Fetch orders
     let query = supabase
       .from('orders')
       .select('*')
       .in('status', ['confirmed', 'shipping'])
       .order('created_at', { ascending: false });
 
     if (filterStatus !== 'all') {
       query = query.eq('shipper_status', filterStatus);
     }
 
     const { data: ordersData } = await query;
     
     const ordersWithItems = (ordersData || []).map((order) => ({
       ...order,
       items: (order.items as unknown as OrderItem[]) || [],
     }));
     
     setOrders(ordersWithItems as Order[]);
 
     // Fetch shippers
     const { data: shipperRoles } = await supabase
       .from('user_roles')
       .select('user_id')
       .eq('role', 'shipper');
 
     if (shipperRoles && shipperRoles.length > 0) {
       const shipperIds = shipperRoles.map((r) => r.user_id);
       const { data: profiles } = await supabase
         .from('profiles')
         .select('id, full_name, phone, avatar_url')
         .in('id', shipperIds);
       
       setShippers((profiles || []) as Shipper[]);
     }
 
     setLoading(false);
   };
 
   const handleAssignShipper = async () => {
     if (!selectedOrder || !selectedShipper) return;
 
     const estimatedDelivery = new Date();
     estimatedDelivery.setHours(estimatedDelivery.getHours() + 2);
 
     const { error } = await supabase
       .from('orders')
       .update({
         shipper_id: selectedShipper,
         shipper_status: 'assigned',
         status: 'shipping',
         estimated_delivery: estimatedDelivery.toISOString(),
       })
       .eq('id', selectedOrder.id);
 
     if (error) {
       toast.error('Không thể gán shipper');
       return;
     }
 
     // Create initial tracking entry
     await supabase.from('order_tracking').insert({
       order_id: selectedOrder.id,
       status: 'assigned',
       note: 'Đơn hàng đã được gán cho shipper',
     });
 
     toast.success('Đã gán shipper thành công');
     setAssignDialogOpen(false);
     setSelectedOrder(null);
     setSelectedShipper('');
     fetchData();
   };
 
   const formatCurrency = (amount: number) =>
     new Intl.NumberFormat('vi-VN').format(amount) + '₫';
 
   const filteredShippers = shippers.filter((s) =>
     s.full_name?.toLowerCase().includes(searchShipper.toLowerCase()) ||
     s.phone?.includes(searchShipper)
   );
 
   const getStatusBadge = (status: string | null | undefined) => {
     switch (status) {
       case 'unassigned':
         return <Badge variant="secondary">Chưa gán</Badge>;
       case 'assigned':
         return <Badge className="bg-blue-500 text-white">Đã gán</Badge>;
       case 'picking_up':
         return <Badge className="bg-yellow-500 text-white">Đang lấy</Badge>;
       case 'delivering':
         return <Badge className="bg-purple-500 text-white">Đang giao</Badge>;
       case 'delivered':
         return <Badge className="bg-green-500 text-white">Đã giao</Badge>;
       default:
         return <Badge variant="secondary">Chưa gán</Badge>;
     }
   };
 
   return (
     <AdminLayout>
       <div className="space-y-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
             <h1 className="text-2xl font-bold flex items-center gap-2">
               <Truck className="h-6 w-6 text-primary" />
               Quản lý giao hàng
             </h1>
             <p className="text-muted-foreground">Gán shipper và theo dõi đơn hàng</p>
           </div>
           <Select value={filterStatus} onValueChange={setFilterStatus}>
             <SelectTrigger className="w-48">
               <SelectValue placeholder="Lọc trạng thái" />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="all">Tất cả</SelectItem>
               <SelectItem value="unassigned">Chưa gán shipper</SelectItem>
               <SelectItem value="assigned">Đã gán shipper</SelectItem>
               <SelectItem value="picking_up">Đang lấy hàng</SelectItem>
               <SelectItem value="delivering">Đang giao</SelectItem>
             </SelectContent>
           </Select>
         </div>
 
         {/* Stats */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <Card>
             <CardContent className="p-4">
               <div className="flex items-center gap-3">
                 <Clock className="h-8 w-8 text-yellow-500" />
                 <div>
                   <p className="text-2xl font-bold">
                     {orders.filter((o) => o.shipper_status === 'unassigned').length}
                   </p>
                   <p className="text-sm text-muted-foreground">Chưa gán</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-4">
               <div className="flex items-center gap-3">
                 <Package className="h-8 w-8 text-blue-500" />
                 <div>
                   <p className="text-2xl font-bold">
                     {orders.filter((o) => o.shipper_status === 'assigned').length}
                   </p>
                   <p className="text-sm text-muted-foreground">Đã gán</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-4">
               <div className="flex items-center gap-3">
                 <Truck className="h-8 w-8 text-purple-500" />
                 <div>
                   <p className="text-2xl font-bold">
                     {orders.filter((o) => o.shipper_status === 'delivering').length}
                   </p>
                   <p className="text-sm text-muted-foreground">Đang giao</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-4">
               <div className="flex items-center gap-3">
                 <User className="h-8 w-8 text-green-500" />
                 <div>
                   <p className="text-2xl font-bold">{shippers.length}</p>
                   <p className="text-sm text-muted-foreground">Shipper</p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Orders List */}
         <Card>
           <CardHeader>
             <CardTitle>Đơn hàng cần giao</CardTitle>
             <CardDescription>Danh sách đơn hàng đang chờ hoặc đang giao</CardDescription>
           </CardHeader>
           <CardContent>
             {loading ? (
               <div className="text-center py-8">Đang tải...</div>
             ) : orders.length === 0 ? (
               <div className="text-center py-12">
                 <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                 <h3 className="text-lg font-semibold">Không có đơn hàng</h3>
                 <p className="text-muted-foreground">Không có đơn hàng nào phù hợp</p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead className="bg-muted/50">
                     <tr>
                       <th className="text-left p-3 text-sm font-medium">Mã đơn</th>
                       <th className="text-left p-3 text-sm font-medium">Khách hàng</th>
                       <th className="text-left p-3 text-sm font-medium">Địa chỉ</th>
                       <th className="text-left p-3 text-sm font-medium">Tổng tiền</th>
                       <th className="text-left p-3 text-sm font-medium">Trạng thái</th>
                       <th className="text-left p-3 text-sm font-medium">Shipper</th>
                       <th className="text-right p-3 text-sm font-medium">Thao tác</th>
                     </tr>
                   </thead>
                   <tbody>
                     {orders.map((order) => {
                       const shipper = shippers.find((s) => s.id === order.shipper_id);
                       return (
                         <tr key={order.id} className="border-t">
                           <td className="p-3 font-mono text-sm">
                             #{order.id.slice(0, 8)}
                           </td>
                           <td className="p-3">
                             <div>
                               <p className="font-medium">{order.customer_name}</p>
                               <p className="text-sm text-muted-foreground">
                                 {order.customer_phone}
                               </p>
                             </div>
                           </td>
                           <td className="p-3 max-w-[200px]">
                             <p className="text-sm truncate">{order.customer_address}</p>
                           </td>
                           <td className="p-3 font-semibold text-primary">
                             {formatCurrency(order.total_amount)}
                           </td>
                           <td className="p-3">{getStatusBadge(order.shipper_status)}</td>
                           <td className="p-3">
                             {shipper ? (
                               <div className="flex items-center gap-2">
                                 <User className="h-4 w-4 text-muted-foreground" />
                                 <span className="text-sm">{shipper.full_name}</span>
                               </div>
                             ) : (
                               <span className="text-sm text-muted-foreground">Chưa gán</span>
                             )}
                           </td>
                           <td className="p-3 text-right">
                             {!order.shipper_id && (
                               <Button
                                 size="sm"
                                 onClick={() => {
                                   setSelectedOrder(order);
                                   setAssignDialogOpen(true);
                                 }}
                               >
                                 <UserPlus className="h-4 w-4 mr-1" />
                                 Gán shipper
                               </Button>
                             )}
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
             )}
           </CardContent>
         </Card>
 
         {/* Assign Shipper Dialog */}
         <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Gán Shipper cho đơn hàng</DialogTitle>
             </DialogHeader>
             {selectedOrder && (
               <div className="space-y-4">
                 <div className="bg-muted/50 rounded-lg p-4">
                   <p className="font-medium">Đơn hàng #{selectedOrder.id.slice(0, 8)}</p>
                   <p className="text-sm text-muted-foreground mt-1">
                     {selectedOrder.customer_name} - {selectedOrder.customer_address}
                   </p>
                   <p className="font-semibold text-primary mt-2">
                     {formatCurrency(selectedOrder.total_amount)}
                   </p>
                 </div>
 
                 <div className="space-y-2">
                   <Label>Chọn Shipper</Label>
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input
                       placeholder="Tìm shipper..."
                       value={searchShipper}
                       onChange={(e) => setSearchShipper(e.target.value)}
                       className="pl-10"
                     />
                   </div>
                   <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                     {filteredShippers.length === 0 ? (
                       <div className="p-4 text-center text-muted-foreground">
                         Không tìm thấy shipper
                       </div>
                     ) : (
                       filteredShippers.map((shipper) => (
                         <div
                           key={shipper.id}
                           className={`p-3 cursor-pointer hover:bg-muted/50 flex items-center gap-3 ${
                             selectedShipper === shipper.id ? 'bg-primary/10' : ''
                           }`}
                           onClick={() => setSelectedShipper(shipper.id)}
                         >
                           <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                             {shipper.avatar_url ? (
                               <img src={shipper.avatar_url} className="w-full h-full rounded-full object-cover" />
                             ) : (
                               <User className="h-5 w-5 text-muted-foreground" />
                             )}
                           </div>
                           <div className="flex-1">
                             <p className="font-medium">{shipper.full_name || 'Shipper'}</p>
                             <p className="text-sm text-muted-foreground">{shipper.phone}</p>
                           </div>
                           {selectedShipper === shipper.id && (
                             <CheckCircle className="h-5 w-5 text-primary" />
                           )}
                         </div>
                       ))
                     )}
                   </div>
                 </div>
               </div>
             )}
             <DialogFooter>
               <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                 Hủy
               </Button>
               <Button onClick={handleAssignShipper} disabled={!selectedShipper}>
                 Gán Shipper
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </div>
     </AdminLayout>
   );
 }