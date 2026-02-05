 import { useEffect, useState } from 'react';
 import { useParams } from 'react-router-dom';
 import { supabase } from '@/integrations/supabase/client';
 import { GoogleMap } from '@/components/maps/GoogleMap';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Separator } from '@/components/ui/separator';
 import { 
   MapPin, Phone, User, Clock, CheckCircle, 
   Package, Truck, Navigation, WifiOff, Wifi 
 } from 'lucide-react';
 import { format } from 'date-fns';
 import { vi } from 'date-fns/locale';
 import { Order, OrderTracking, ShipperLocation } from '@/lib/types';
 import { cn } from '@/lib/utils';
 
 interface ShipperInfo {
   id: string;
   full_name: string | null;
   phone: string | null;
   avatar_url: string | null;
 }
 
 const STATUS_STEPS = [
   { key: 'unassigned', label: 'Chờ gán shipper', icon: Package },
   { key: 'assigned', label: 'Đã gán shipper', icon: User },
   { key: 'picking_up', label: 'Đang lấy hàng', icon: MapPin },
   { key: 'delivering', label: 'Đang giao hàng', icon: Truck },
   { key: 'delivered', label: 'Đã giao thành công', icon: CheckCircle },
 ];
 
 export function OrderTrackingMap({ order }: { order: Order }) {
   const [shipperLocation, setShipperLocation] = useState<{ lat: number; lng: number } | null>(null);
   const [shipperInfo, setShipperInfo] = useState<ShipperInfo | null>(null);
   const [trackingHistory, setTrackingHistory] = useState<OrderTracking[]>([]);
   const [isOnline, setIsOnline] = useState(false);
   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
   const [eta, setEta] = useState<string | null>(null);
 
   const destinationLocation = order.delivery_address_lat && order.delivery_address_lng
     ? { lat: order.delivery_address_lat, lng: order.delivery_address_lng }
     : null;
 
   // Fetch shipper info
   useEffect(() => {
     if (!order.shipper_id) return;
 
     const fetchShipperInfo = async () => {
       const { data } = await supabase
         .from('profiles')
         .select('id, full_name, phone, avatar_url')
         .eq('id', order.shipper_id)
         .single();
       
       if (data) {
         setShipperInfo(data as ShipperInfo);
       }
     };
 
     fetchShipperInfo();
   }, [order.shipper_id]);
 
   // Fetch tracking history
   useEffect(() => {
     const fetchTrackingHistory = async () => {
       const { data } = await supabase
         .from('order_tracking')
         .select('*')
         .eq('order_id', order.id)
         .order('created_at', { ascending: true });
       
       if (data) {
         setTrackingHistory(data as OrderTracking[]);
       }
     };
 
     fetchTrackingHistory();
 
     // Subscribe to realtime tracking updates
     const channel = supabase
       .channel(`order-tracking-${order.id}`)
       .on(
         'postgres_changes',
         {
           event: 'INSERT',
           schema: 'public',
           table: 'order_tracking',
           filter: `order_id=eq.${order.id}`,
         },
         (payload) => {
           setTrackingHistory((prev) => [...prev, payload.new as OrderTracking]);
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [order.id]);
 
   // Subscribe to shipper location updates
   useEffect(() => {
     if (!order.shipper_id || order.shipper_status === 'delivered' || order.shipper_status === 'cancelled') {
       return;
     }
 
     // Fetch initial location
     const fetchLocation = async () => {
       const { data } = await supabase
         .from('shipper_locations')
         .select('*')
         .eq('shipper_id', order.shipper_id)
         .eq('order_id', order.id)
         .order('last_updated', { ascending: false })
         .limit(1)
         .single();
       
       if (data) {
         setShipperLocation({ lat: data.latitude, lng: data.longitude });
         setIsOnline(data.is_online ?? false);
         setLastUpdated(new Date(data.last_updated));
       }
     };
 
     fetchLocation();
 
     // Subscribe to realtime location updates
     const channel = supabase
       .channel(`shipper-location-${order.id}`)
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'shipper_locations',
           filter: `order_id=eq.${order.id}`,
         },
         (payload) => {
           const loc = payload.new as ShipperLocation;
           setShipperLocation({ lat: loc.latitude, lng: loc.longitude });
           setIsOnline(loc.is_online);
           setLastUpdated(new Date(loc.last_updated));
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [order.shipper_id, order.id, order.shipper_status]);
 
   // Calculate ETA (simplified)
   useEffect(() => {
     if (order.estimated_delivery) {
       const etaDate = new Date(order.estimated_delivery);
       setEta(format(etaDate, 'HH:mm', { locale: vi }));
     }
   }, [order.estimated_delivery]);
 
   const getCurrentStepIndex = () => {
     return STATUS_STEPS.findIndex((s) => s.key === order.shipper_status) || 0;
   };
 
   const currentStep = getCurrentStepIndex();
 
   return (
     <div className="space-y-6">
       {/* Map Section */}
       {(order.shipper_status === 'picking_up' || order.shipper_status === 'delivering') && (
         <Card>
           <CardHeader className="pb-2">
             <div className="flex items-center justify-between">
               <CardTitle className="flex items-center gap-2 text-lg">
                 <Navigation className="h-5 w-5 text-primary" />
                 Theo dõi vị trí
               </CardTitle>
               <div className="flex items-center gap-2">
                 {isOnline ? (
                   <Badge variant="default" className="bg-green-500">
                     <Wifi className="h-3 w-3 mr-1" />
                     Online
                   </Badge>
                 ) : (
                   <Badge variant="secondary">
                     <WifiOff className="h-3 w-3 mr-1" />
                     Offline
                   </Badge>
                 )}
               </div>
             </div>
             {lastUpdated && (
               <p className="text-xs text-muted-foreground">
                 Cập nhật lần cuối: {format(lastUpdated, 'HH:mm:ss', { locale: vi })}
               </p>
             )}
           </CardHeader>
           <CardContent>
             <GoogleMap
               shipperLocation={shipperLocation}
               destinationLocation={destinationLocation}
               showRoute={true}
               className="h-[350px] rounded-lg"
             />
             {eta && (
               <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between">
                 <span className="text-sm font-medium">Thời gian dự kiến:</span>
                 <span className="text-lg font-bold text-primary">{eta}</span>
               </div>
             )}
           </CardContent>
         </Card>
       )}
 
       {/* Shipper Info */}
       {shipperInfo && (
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-lg">Thông tin shipper</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="flex items-center gap-4">
               <div className="w-16 h-16 rounded-full bg-muted overflow-hidden">
                 {shipperInfo.avatar_url ? (
                   <img src={shipperInfo.avatar_url} alt="" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center">
                     <User className="h-8 w-8 text-muted-foreground" />
                   </div>
                 )}
               </div>
               <div className="flex-1">
                 <h4 className="font-semibold text-lg">{shipperInfo.full_name || 'Shipper'}</h4>
                 {shipperInfo.phone && (
                   <a 
                     href={`tel:${shipperInfo.phone}`}
                     className="flex items-center gap-2 text-primary hover:underline mt-1"
                   >
                     <Phone className="h-4 w-4" />
                     {shipperInfo.phone}
                   </a>
                 )}
               </div>
             </div>
           </CardContent>
         </Card>
       )}
 
       {/* Status Timeline */}
       <Card>
         <CardHeader className="pb-2">
           <CardTitle className="text-lg flex items-center gap-2">
             <Clock className="h-5 w-5 text-primary" />
             Trạng thái đơn hàng
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             {STATUS_STEPS.map((step, index) => {
               const StepIcon = step.icon;
               const isCompleted = index <= currentStep;
               const isCurrent = index === currentStep;
               
               // Find tracking entry for this step
               const trackingEntry = trackingHistory.find((t) => t.status === step.key);
               
               return (
                 <div key={step.key} className="flex gap-4">
                   <div className="flex flex-col items-center">
                     <div
                       className={cn(
                         'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                         isCompleted
                           ? 'bg-primary text-primary-foreground'
                           : 'bg-muted text-muted-foreground',
                         isCurrent && 'ring-4 ring-primary/20'
                       )}
                     >
                       <StepIcon className="h-5 w-5" />
                     </div>
                     {index < STATUS_STEPS.length - 1 && (
                       <div
                         className={cn(
                           'w-0.5 h-8 mt-2',
                           index < currentStep ? 'bg-primary' : 'bg-muted'
                         )}
                       />
                     )}
                   </div>
                   <div className="flex-1 pt-1">
                     <p
                       className={cn(
                         'font-medium',
                         isCompleted ? 'text-foreground' : 'text-muted-foreground'
                       )}
                     >
                       {step.label}
                     </p>
                     {trackingEntry && (
                       <p className="text-sm text-muted-foreground mt-0.5">
                         {format(new Date(trackingEntry.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                         {trackingEntry.note && ` - ${trackingEntry.note}`}
                       </p>
                     )}
                   </div>
                 </div>
               );
             })}
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }