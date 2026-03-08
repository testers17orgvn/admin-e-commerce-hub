import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User, Package, ShoppingCart, Save, Loader2, Camera, 
  Mail, Phone, MapPin, Calendar, Shield, ChevronRight,
  CreditCard, Gift, Bell, Settings, LogOut, Heart, Star, Store
} from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import { Order } from '@/lib/types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AddressBook } from '@/components/profile/AddressBook';
import { UserVouchers } from '@/components/profile/UserVouchers';
import { NotificationSettings } from '@/components/profile/NotificationSettings';
import { SellerRequestForm } from '@/components/profile/SellerRequestForm';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  avatar_url: string;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Chờ xử lý', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  confirmed: { label: 'Đã xác nhận', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  shipping: { label: 'Đang giao', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  delivered: { label: 'Đã giao', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  cancelled: { label: 'Đã hủy', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const menuItems = [
  { icon: Package, label: 'Đơn hàng của tôi', value: 'orders' },
  { icon: Heart, label: 'Yêu thích', value: 'wishlist', href: '/wishlist' },
  { icon: ShoppingCart, label: 'Giỏ hàng', value: 'cart' },
  { icon: MapPin, label: 'Sổ địa chỉ', value: 'addresses' },
  { icon: Gift, label: 'Voucher của tôi', value: 'vouchers' },
  { icon: Bell, label: 'Thông báo', value: 'notifications' },
  { icon: Store, label: 'Đăng ký bán hàng', value: 'seller' },
];

export default function Profile() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { items: cartItems, totalPrice } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    avatar_url: '',
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

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
        phone: data.phone || '',
        address: data.address || '',
        avatar_url: data.avatar_url || '',
      });
    } else {
      setProfile(prev => ({
        ...prev,
        email: user.email || '',
      }));
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Cập nhật ảnh đại diện thành công');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Lỗi upload ảnh: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        email: profile.email,
      });
    
    if (error) {
      toast.error('Lỗi cập nhật thông tin');
    } else {
      toast.success('Cập nhật thông tin thành công');
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-secondary/50 to-background">
        {/* Hero Banner */}
        <div className="relative h-40 md:h-56 bg-gradient-to-r from-charcoal via-charcoal-light to-charcoal overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--accent)/0.3),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.2),transparent_40%)]" />
          </div>
          <div className="container h-full flex items-end pb-16 md:pb-20">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
              Tài khoản của tôi
            </h1>
          </div>
        </div>

        <div className="container -mt-12 md:-mt-16 pb-12">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="overflow-hidden border-0 shadow-lg">
                {/* Profile Header */}
                <div className="bg-gradient-to-br from-accent/10 via-background to-background p-6 text-center">
                  <div className="relative inline-block group">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden ring-4 ring-background shadow-xl mx-auto">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center text-2xl md:text-3xl font-bold text-white">
                          {getInitials(profile.full_name)}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 w-9 h-9 bg-accent hover:bg-accent/90 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:scale-110"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <h2 className="mt-4 font-display font-bold text-lg">
                    {profile.full_name || 'Chưa cập nhật tên'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">Tài khoản đã xác thực</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 divide-x border-t border-b">
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-accent">{orders.length}</p>
                    <p className="text-xs text-muted-foreground">Đơn hàng</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-accent">0</p>
                    <p className="text-xs text-muted-foreground">Voucher</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-accent">
                      <Star className="h-5 w-5 inline text-amber-500 fill-amber-500" />
                    </p>
                    <p className="text-xs text-muted-foreground">Thành viên</p>
                  </div>
                </div>

                {/* Navigation Menu */}
                <CardContent className="p-3">
                  <nav className="space-y-1">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        activeTab === 'profile' 
                          ? 'bg-accent/10 text-accent font-medium' 
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <User className="h-5 w-5" />
                      <span className="flex-1 text-left">Thông tin cá nhân</span>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </button>
                    
                    {menuItems.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => item.href ? navigate(item.href) : setActiveTab(item.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                          activeTab === item.value 
                            ? 'bg-accent/10 text-accent font-medium' 
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.value === 'cart' && cartItems.length > 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-accent text-white rounded-full">
                            {cartItems.length}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 opacity-50" />
                      </button>
                    ))}
                  </nav>

                  <div className="mt-4 pt-4 border-t">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-300"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <Card className="border-0 shadow-lg overflow-hidden animate-fade-in">
                  <div className="bg-gradient-to-r from-accent/5 to-transparent p-6 border-b">
                    <h2 className="font-display text-xl font-bold flex items-center gap-2">
                      <User className="h-5 w-5 text-accent" />
                      Thông tin cá nhân
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Quản lý thông tin cá nhân để bảo mật tài khoản
                    </p>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Họ và tên
                        </label>
                        <Input
                          value={profile.full_name}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          placeholder="Nhập họ và tên"
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Email
                        </label>
                        <Input
                          value={profile.email}
                          disabled
                          className="h-12 rounded-xl bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          Số điện thoại
                        </label>
                        <Input
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          placeholder="Nhập số điện thoại"
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          Ngày tham gia
                        </label>
                        <Input
                          value={user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy', { locale: vi }) : ''}
                          disabled
                          className="h-12 rounded-xl bg-muted"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          Địa chỉ giao hàng
                        </label>
                        <Textarea
                          value={profile.address}
                          onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                          placeholder="Nhập địa chỉ giao hàng chi tiết"
                          rows={3}
                          className="rounded-xl resize-none"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="h-12 px-8 rounded-xl bg-accent hover:bg-accent/90 text-white font-medium"
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-4 animate-fade-in">
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-accent/5 to-transparent p-6 border-b">
                      <h2 className="font-display text-xl font-bold flex items-center gap-2">
                        <Package className="h-5 w-5 text-accent" />
                        Đơn hàng của tôi
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Theo dõi và quản lý đơn hàng của bạn
                      </p>
                    </div>
                  </Card>

                  {orders.length === 0 ? (
                    <Card className="border-0 shadow-lg p-12 text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Package className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-lg mb-2">Chưa có đơn hàng nào</h3>
                      <p className="text-muted-foreground mb-6">
                        Hãy khám phá và mua sắm những sản phẩm yêu thích
                      </p>
                      <Button 
                        onClick={() => navigate('/products')}
                        className="bg-accent hover:bg-accent/90 rounded-xl"
                      >
                        Mua sắm ngay
                      </Button>
                    </Card>
                  ) : (
                    orders.map((order, index) => (
                      <Card 
                        key={order.id} 
                        className="border-0 shadow-lg overflow-hidden animate-slide-up cursor-pointer hover:shadow-xl transition-all"
                        style={{ animationDelay: `${index * 0.1}s` }}
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <div className="p-4 md:p-6 border-b bg-muted/30 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="hidden sm:flex w-10 h-10 rounded-full bg-accent/10 items-center justify-center">
                              <Package className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <p className="font-medium">
                                Đơn hàng #{order.id.slice(0, 8).toUpperCase()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(order.created_at), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig[order.status]?.bgColor} ${statusConfig[order.status]?.color}`}>
                              {statusConfig[order.status]?.label || order.status}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        
                        <CardContent className="p-4 md:p-6">
                          <div className="space-y-4">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-4">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
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
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{item.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    SL: {item.quantity} x {item.price.toLocaleString('vi-VN')}đ
                                  </p>
                                  {(item.selectedColor || item.selectedSize) && (
                                    <p className="text-sm text-muted-foreground">
                                      {item.selectedColor && <span className="mr-2">Màu: {item.selectedColor}</span>}
                                      {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                                    </p>
                                  )}
                                </div>
                                <p className="font-bold text-accent whitespace-nowrap">
                                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                </p>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-6 pt-4 border-t flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{order.items.length} sản phẩm</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Tổng tiền:</span>
                              <span className="text-xl font-bold text-accent">
                                {order.total_amount.toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <Card className="border-0 shadow-lg overflow-hidden animate-fade-in">
                  <div className="bg-gradient-to-r from-accent/5 to-transparent p-6 border-b">
                    <h2 className="font-display text-xl font-bold flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-accent" />
                      Sổ địa chỉ
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Quản lý địa chỉ giao hàng của bạn
                    </p>
                  </div>
                  <CardContent className="p-6">
                    <AddressBook />
                  </CardContent>
                </Card>
              )}

              {/* Vouchers Tab */}
              {activeTab === 'vouchers' && (
                <Card className="border-0 shadow-lg overflow-hidden animate-fade-in">
                  <div className="bg-gradient-to-r from-accent/5 to-transparent p-6 border-b">
                    <h2 className="font-display text-xl font-bold flex items-center gap-2">
                      <Gift className="h-5 w-5 text-accent" />
                      Voucher của tôi
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Nhận và sử dụng voucher giảm giá
                    </p>
                  </div>
                  <CardContent className="p-6">
                    <UserVouchers />
                  </CardContent>
                </Card>
              )}

              {/* Cart Tab */}
              {activeTab === 'cart' && (
                <div className="space-y-4 animate-fade-in">
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-accent/5 to-transparent p-6 border-b">
                      <h2 className="font-display text-xl font-bold flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-accent" />
                        Giỏ hàng ({cartItems.length} sản phẩm)
                      </h2>
                    </div>
                    <CardContent className="p-6">
                      {cartItems.length === 0 ? (
                        <div className="py-12 text-center">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                          </div>
                          <h3 className="font-medium text-lg mb-2">Giỏ hàng trống</h3>
                          <p className="text-muted-foreground mb-6">
                            Thêm sản phẩm vào giỏ để tiến hành thanh toán
                          </p>
                          <Button 
                            onClick={() => navigate('/products')}
                            className="bg-accent hover:bg-accent/90 rounded-xl"
                          >
                            Mua sắm ngay
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-4">
                            {cartItems.map((item, index) => (
                              <div 
                                key={item.cartItemId} 
                                className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-300 animate-slide-up"
                                style={{ animationDelay: `${index * 0.05}s` }}
                              >
                                <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                                  <img 
                                    src={item.image_url || '/placeholder.svg'} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{item.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    SL: {item.quantity} x {item.price.toLocaleString('vi-VN')}đ
                                  </p>
                                  {(item.selectedColor || item.selectedSize) && (
                                    <p className="text-sm text-muted-foreground">
                                      {item.selectedColor && <span className="mr-2">Màu: {item.selectedColor}</span>}
                                      {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                                    </p>
                                  )}
                                </div>
                                <p className="font-bold text-accent whitespace-nowrap">
                                  {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                </p>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-6 pt-6 border-t space-y-4">
                            <div className="flex items-center justify-between text-lg">
                              <span className="text-muted-foreground">Tổng tiền hàng:</span>
                              <span className="text-2xl font-bold text-accent">
                                {totalPrice.toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                            <Button 
                              className="w-full h-14 rounded-xl bg-accent hover:bg-accent/90 text-lg font-medium" 
                              onClick={() => navigate('/cart')}
                            >
                              Tiến hành thanh toán
                              <ChevronRight className="h-5 w-5 ml-2" />
                            </Button>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="animate-fade-in">
                  <NotificationSettings />
                </div>
              )}

              {/* Seller Registration Tab */}
              {activeTab === 'seller' && (
                <div className="animate-fade-in">
                  <SellerRequestForm />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}