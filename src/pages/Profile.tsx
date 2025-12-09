import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Package, ShoppingCart, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import { Order } from '@/lib/types';
import { format } from 'date-fns';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-500' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-500' },
  shipping: { label: 'Đang giao', color: 'bg-purple-500' },
  delivered: { label: 'Đã giao', color: 'bg-green-500' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-500' },
};

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { items: cartItems, totalPrice } = useCart();
  
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchOrders();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (data) {
      setProfile({
        full_name: data.full_name || '',
        email: data.email || user.email || '',
        phone: (data as any).phone || '',
        address: (data as any).address || '',
      });
    }
    setLoading(false);
  };

  const fetchOrders = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      const parsedOrders = data.map(order => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
      })) as Order[];
      setOrders(parsedOrders);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
      } as any)
      .eq('id', user.id);
    
    if (error) {
      toast.error('Lỗi cập nhật thông tin');
    } else {
      toast.success('Cập nhật thông tin thành công');
    }
    setSaving(false);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-display font-bold mb-8">Tài khoản của tôi</h1>
          
          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Thông tin
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Đơn hàng
              </TabsTrigger>
              <TabsTrigger value="cart" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Giỏ hàng
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cá nhân</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Cập nhật thông tin của bạn để tự động điền khi đặt hàng
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Họ tên</label>
                      <Input
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        placeholder="Nhập họ tên"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        value={profile.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Số điện thoại</label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Địa chỉ</label>
                    <Textarea
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      placeholder="Nhập địa chỉ giao hàng"
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Lịch sử đơn hàng</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Bạn chưa có đơn hàng nào</p>
                      <Button variant="outline" className="mt-4" onClick={() => navigate('/products')}>
                        Mua sắm ngay
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                Đơn hàng #{order.id.slice(0, 8).toUpperCase()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                              </p>
                            </div>
                            <Badge className={statusConfig[order.status]?.color || 'bg-gray-500'}>
                              {statusConfig[order.status]?.label || order.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3 text-sm">
                                {item.image_url && (
                                  <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded object-cover" />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-muted-foreground">
                                    {item.quantity} x {item.price.toLocaleString('vi-VN')}đ
                                    {item.selectedColor && ` • ${item.selectedColor}`}
                                    {item.selectedSize && ` • ${item.selectedSize}`}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="border-t pt-3 flex justify-between items-center">
                            <span className="text-muted-foreground">Tổng cộng:</span>
                            <span className="font-bold text-lg">{order.total_amount.toLocaleString('vi-VN')}đ</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cart Tab */}
            <TabsContent value="cart">
              <Card>
                <CardHeader>
                  <CardTitle>Giỏ hàng ({cartItems.length} sản phẩm)</CardTitle>
                </CardHeader>
                <CardContent>
                  {cartItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Giỏ hàng trống</p>
                      <Button variant="outline" className="mt-4" onClick={() => navigate('/products')}>
                        Mua sắm ngay
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {cartItems.map((item) => (
                          <div key={item.cartItemId} className="flex items-center gap-4 p-3 border rounded-lg">
                            <img 
                              src={item.image_url || '/placeholder.svg'} 
                              alt={item.name}
                              className="w-16 h-16 rounded object-cover"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} x {item.price.toLocaleString('vi-VN')}đ
                                {item.selectedColor && ` • ${item.selectedColor}`}
                                {item.selectedSize && ` • ${item.selectedSize}`}
                              </p>
                            </div>
                            <p className="font-bold">
                              {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="border-t mt-6 pt-4 flex justify-between items-center">
                        <span className="text-lg">Tổng cộng:</span>
                        <span className="text-2xl font-bold text-accent">{totalPrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <Button className="w-full mt-4" onClick={() => navigate('/cart')}>
                        Thanh toán
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}