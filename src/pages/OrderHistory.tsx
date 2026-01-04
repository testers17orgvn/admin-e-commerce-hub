import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderItem, Product } from "@/lib/types";
import { useCart } from "@/hooks/useCart";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Package,
  Calendar,
  MapPin,
  Phone,
  Mail,
  RotateCcw,
  Eye,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingBag,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

const OrderHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ordersWithItems = (data || []).map((order) => ({
        ...order,
        items: (order.items as unknown as OrderItem[]) || [],
      }));

      setOrders(ordersWithItems);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Không thể tải lịch sử đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Chờ xử lý",
          icon: Clock,
          variant: "secondary" as const,
          color: "text-yellow-600",
        };
      case "confirmed":
        return {
          label: "Đã xác nhận",
          icon: CheckCircle,
          variant: "default" as const,
          color: "text-blue-600",
        };
      case "shipping":
        return {
          label: "Đang giao",
          icon: Truck,
          variant: "default" as const,
          color: "text-purple-600",
        };
      case "delivered":
        return {
          label: "Đã giao",
          icon: CheckCircle,
          variant: "default" as const,
          color: "text-green-600",
        };
      case "cancelled":
        return {
          label: "Đã hủy",
          icon: XCircle,
          variant: "destructive" as const,
          color: "text-red-600",
        };
      default:
        return {
          label: status,
          icon: Package,
          variant: "secondary" as const,
          color: "text-muted-foreground",
        };
    }
  };

  const getEstimatedDelivery = (createdAt: string, status: string) => {
    const orderDate = new Date(createdAt);
    if (status === "delivered" || status === "cancelled") {
      return null;
    }
    const estimatedDate = addDays(orderDate, 3);
    return format(estimatedDate, "dd/MM/yyyy", { locale: vi });
  };

  const handleReorder = (order: Order) => {
    try {
      for (const item of order.items) {
        const product: Product = {
          id: item.product_id,
          name: item.name,
          price: item.price,
          image_url: item.image_url || null,
          slug: "",
          description: null,
          original_price: null,
          images: [],
          category_id: null,
          stock: 100,
          is_featured: false,
          is_active: true,
          is_hot: false,
          colors: [],
          sizes: [],
          tags: [],
          created_at: "",
          updated_at: "",
        };
        addItem(product, item.quantity, {
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
        });
      }
      toast.success("Đã thêm tất cả sản phẩm vào giỏ hàng");
      navigate("/cart");
    } catch (error) {
      toast.error("Không thể đặt lại đơn hàng");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "cancelled" } : order
        )
      );
      toast.success("Đã hủy đơn hàng thành công");
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Không thể hủy đơn hàng");
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Lịch sử đơn hàng
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Xem và quản lý các đơn hàng của bạn
            </p>
          </div>
          <Badge variant="outline" className="w-fit text-sm">
            {orders.length} đơn hàng
          </Badge>
        </div>

        {orders.length === 0 ? (
          <Card className="text-center py-12 md:py-16">
            <CardContent>
              <ShoppingBag className="mx-auto h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">
                Chưa có đơn hàng nào
              </h3>
              <p className="text-muted-foreground mb-6 text-sm md:text-base">
                Hãy khám phá các sản phẩm và đặt hàng ngay!
              </p>
              <Button onClick={() => navigate("/products")}>
                Khám phá sản phẩm
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              const estimatedDelivery = getEstimatedDelivery(
                order.created_at,
                order.status
              );

              return (
                <Card
                  key={order.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="bg-muted/30 p-4 md:p-6">
                    <div className="flex flex-col gap-4">
                      {/* Order ID and Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Package className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                          <CardTitle className="text-sm md:text-base font-medium">
                            Đơn hàng #{order.id.slice(0, 8).toUpperCase()}
                          </CardTitle>
                        </div>
                        <Badge
                          variant={statusConfig.variant}
                          className="flex items-center gap-1 w-fit"
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </div>

                      {/* Dates */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                          <span>
                            Đặt ngày:{" "}
                            {format(
                              new Date(order.created_at),
                              "dd/MM/yyyy HH:mm",
                              { locale: vi }
                            )}
                          </span>
                        </div>
                        {estimatedDelivery && (
                          <div className="flex items-center gap-1 text-primary">
                            <Truck className="h-3 w-3 md:h-4 md:w-4" />
                            <span>Dự kiến nhận: {estimatedDelivery}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 md:p-6">
                    {/* Products Preview */}
                    <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
                      {order.items.slice(0, 4).map((item, index) => (
                        <div
                          key={index}
                          className="relative w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-muted"
                        >
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          {item.quantity > 1 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center">
                              {item.quantity}
                            </span>
                          )}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-muted flex items-center justify-center">
                          <span className="text-xs md:text-sm text-muted-foreground">
                            +{order.items.length - 4}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Total and Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Tổng cộng ({order.items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm)
                        </p>
                        <p className="text-lg md:text-xl font-bold text-primary">
                          {order.total_amount.toLocaleString("vi-VN")}₫
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                              className="flex-1 sm:flex-none"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Chi tiết
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Chi tiết đơn hàng
                              </DialogTitle>
                              <DialogDescription>
                                #{order.id.slice(0, 8).toUpperCase()}
                              </DialogDescription>
                            </DialogHeader>

                            {selectedOrder && (
                              <div className="space-y-6">
                                {/* Customer Info */}
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-sm">
                                    Thông tin giao hàng
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-muted-foreground" />
                                      <span>{selectedOrder.customer_email}</span>
                                    </div>
                                    {selectedOrder.customer_phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{selectedOrder.customer_phone}</span>
                                      </div>
                                    )}
                                    {selectedOrder.customer_address && (
                                      <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span>{selectedOrder.customer_address}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-sm">
                                    Sản phẩm đã đặt
                                  </h4>
                                  <div className="space-y-3">
                                    {selectedOrder.items.map((item, index) => (
                                      <div
                                        key={index}
                                        className="flex gap-3 p-3 bg-muted/30 rounded-lg"
                                      >
                                        <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                          {item.image_url ? (
                                            <img
                                              src={item.image_url}
                                              alt={item.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <Package className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm truncate">
                                            {item.name}
                                          </p>
                                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                            <span>SL: {item.quantity}</span>
                                            {item.selectedColor && (
                                              <span>Màu: {item.selectedColor}</span>
                                            )}
                                            {item.selectedSize && (
                                              <span>Size: {item.selectedSize}</span>
                                            )}
                                          </div>
                                          <p className="text-sm font-medium text-primary mt-1">
                                            {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Order Timeline */}
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-sm">
                                    Thời gian
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">
                                        Ngày đặt:
                                      </span>
                                      <span>
                                        {format(
                                          new Date(selectedOrder.created_at),
                                          "dd/MM/yyyy HH:mm",
                                          { locale: vi }
                                        )}
                                      </span>
                                    </div>
                                    {getEstimatedDelivery(
                                      selectedOrder.created_at,
                                      selectedOrder.status
                                    ) && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          Dự kiến nhận:
                                        </span>
                                        <span className="text-primary font-medium">
                                          {getEstimatedDelivery(
                                            selectedOrder.created_at,
                                            selectedOrder.status
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Notes */}
                                {selectedOrder.notes && (
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Ghi chú</h4>
                                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                      {selectedOrder.notes}
                                    </p>
                                  </div>
                                )}

                                {/* Total */}
                                <div className="border-t pt-4">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold">Tổng cộng:</span>
                                    <span className="text-xl font-bold text-primary">
                                      {selectedOrder.total_amount.toLocaleString("vi-VN")}₫
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {order.status === "pending" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1 sm:flex-none"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Hủy đơn
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Xác nhận hủy đơn hàng
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc chắn muốn hủy đơn hàng #{order.id.slice(0, 8).toUpperCase()}? 
                                  Hành động này không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Không, giữ lại</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Xác nhận hủy
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        <Button
                          size="sm"
                          onClick={() => handleReorder(order)}
                          className="flex-1 sm:flex-none"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Đặt lại
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrderHistory;
