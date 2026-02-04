import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, DollarSign, TrendingUp, ShoppingCart, 
  Clock, CheckCircle, XCircle, AlertCircle, Eye,
  ArrowRight, BarChart3, Plus, Store, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface SellerStats {
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  totalRevenue: number;
  totalOrders: number;
}

interface RecentProduct {
  id: string;
  name: string;
  image_url: string | null;
  status: string;
  price: number;
  created_at: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  approved: { label: 'Đã duyệt', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  rejected: { label: 'Từ chối', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  revision_requested: { label: 'Cần sửa', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
};

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#f97316'];

export default function SellerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SellerStats>({
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    rejectedProducts: 0,
    totalRevenue: 0,
    totalOrders: 0,
  });
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      checkSellerRole();
    }
  }, [user, authLoading]);

  const checkSellerRole = async () => {
    const { data } = await supabase.rpc('is_seller');
    if (!data) {
      toast.error('Bạn cần có quyền seller để truy cập trang này');
      navigate('/profile');
      return;
    }
    setIsSeller(true);
    fetchData();
  };

  const fetchData = async () => {
    if (!user) return;

    // Fetch seller products stats
    const { data: products } = await supabase
      .from('seller_products')
      .select('id, status, name, image_url, price, created_at')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    const productList = products || [];
    
    // Calculate stats
    const stats: SellerStats = {
      totalProducts: productList.length,
      approvedProducts: productList.filter(p => p.status === 'approved').length,
      pendingProducts: productList.filter(p => p.status === 'pending').length,
      rejectedProducts: productList.filter(p => p.status === 'rejected').length,
      totalRevenue: 0, // Will calculate from orders
      totalOrders: 0,
    };

    setStats(stats);
    setRecentProducts(productList.slice(0, 5) as RecentProduct[]);

    // Fetch profile for business info
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    setProfile(profileData);

    // Generate mock revenue data (in real app, this would come from orders)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'dd/MM', { locale: vi }),
        revenue: Math.floor(Math.random() * 5000000) + 1000000,
      };
    });
    setRevenueData(last7Days);

    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const pieData = [
    { name: 'Đã duyệt', value: stats.approvedProducts, color: '#10b981' },
    { name: 'Chờ duyệt', value: stats.pendingProducts, color: '#f59e0b' },
    { name: 'Từ chối', value: stats.rejectedProducts, color: '#ef4444' },
  ].filter(d => d.value > 0);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-16 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!isSeller) return null;

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display flex items-center gap-3">
              <Store className="h-8 w-8 text-accent" />
              Dashboard Người bán
            </h1>
            <p className="text-muted-foreground mt-1">
              Xin chào, {profile?.full_name || 'Người bán'}! Quản lý cửa hàng của bạn.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/seller/products">
                <Package className="h-4 w-4 mr-2" />
                Sản phẩm của tôi
              </Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/seller/products">
                <Plus className="h-4 w-4 mr-2" />
                Đăng sản phẩm
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500 rounded-xl text-white">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-400">{stats.approvedProducts}</p>
                  <p className="text-sm text-green-600/80 dark:text-green-500">Đã duyệt</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500 rounded-xl text-white">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pendingProducts}</p>
                  <p className="text-sm text-yellow-600/80 dark:text-yellow-500">Chờ duyệt</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500 rounded-xl text-white">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{stats.totalProducts}</p>
                  <p className="text-sm text-blue-600/80 dark:text-blue-500">Tổng SP</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500 rounded-xl text-white">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{stats.totalOrders}</p>
                  <p className="text-sm text-purple-600/80 dark:text-purple-500">Đơn hàng</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                Doanh thu 7 ngày gần đây
              </CardTitle>
              <CardDescription>Thống kê doanh thu theo ngày</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      className="text-xs"
                    />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--accent))" 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Product Status Pie Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-accent" />
                Trạng thái sản phẩm
              </CardTitle>
              <CardDescription>Phân bố theo trạng thái duyệt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Chưa có sản phẩm
                  </div>
                )}
              </div>
              <div className="mt-4 space-y-2">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Products */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-accent" />
                Sản phẩm gần đây
              </CardTitle>
              <CardDescription>Các sản phẩm mới đăng gần đây</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/seller/products">
                Xem tất cả
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentProducts.length > 0 ? (
              <div className="space-y-4">
                {recentProducts.map((product) => {
                  const statusConfig = STATUS_CONFIG[product.status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = statusConfig?.icon || Package;
                  return (
                    <div key={product.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(product.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-accent">{formatCurrency(product.price)}</p>
                        <Badge className={cn(statusConfig?.bg, statusConfig?.color, "mt-1")}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig?.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Chưa có sản phẩm nào</h3>
                <p className="text-muted-foreground mt-1 mb-4">Bắt đầu đăng sản phẩm để bán hàng</p>
                <Button variant="hero" asChild>
                  <Link to="/seller/products">
                    <Plus className="h-4 w-4 mr-2" />
                    Đăng sản phẩm đầu tiên
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Info Card */}
        {profile && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-accent" />
                Thông tin doanh nghiệp
              </CardTitle>
              <CardDescription>Thông tin đã đăng ký kinh doanh</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Loại hình kinh doanh</p>
                  <p className="font-medium">{profile.business_type || 'Chưa cập nhật'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Mô hình kinh doanh</p>
                  <p className="font-medium">{profile.business_model || 'Chưa cập nhật'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Mã số thuế</p>
                  <p className="font-medium">{profile.tax_code || 'Chưa cập nhật'}</p>
                </div>
              </div>
              {!profile.business_type && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400">
                    ⚠️ Vui lòng cập nhật đầy đủ thông tin doanh nghiệp trong hồ sơ của bạn để được hỗ trợ tốt hơn.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
