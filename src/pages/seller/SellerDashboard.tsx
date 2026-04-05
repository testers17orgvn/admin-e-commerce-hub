import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, TrendingUp, 
  Clock, CheckCircle, XCircle, AlertCircle,
  ArrowRight, Plus, Store, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SellerGuide } from '@/components/guides/SellerGuide';

interface SellerStats {
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  revisionProducts: number;
}

interface RecentProduct {
  id: string;
  name: string;
  image_url: string | null;
  status: string;
  price: number;
  created_at: string;
  rejection_reason: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  pending: { label: 'Chờ duyệt', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  approved: { label: 'Đã duyệt', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  rejected: { label: 'Từ chối', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  revision_requested: { label: 'Cần sửa', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
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
    revisionProducts: 0,
  });
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);
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

    const [productsRes, profileRes] = await Promise.all([
      supabase
        .from('seller_products')
        .select('id, status, name, image_url, price, created_at, rejection_reason')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ]);

    const productList = productsRes.data || [];
    
    setStats({
      totalProducts: productList.length,
      approvedProducts: productList.filter(p => p.status === 'approved').length,
      pendingProducts: productList.filter(p => p.status === 'pending').length,
      rejectedProducts: productList.filter(p => p.status === 'rejected').length,
      revisionProducts: productList.filter(p => p.status === 'revision_requested').length,
    });

    setRecentProducts(productList.slice(0, 6) as RecentProduct[]);
    setProfile(profileRes.data);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const pieData = [
    { name: 'Đã duyệt', value: stats.approvedProducts, color: CHART_COLORS[0] },
    { name: 'Chờ duyệt', value: stats.pendingProducts, color: CHART_COLORS[1] },
    { name: 'Từ chối', value: stats.rejectedProducts, color: CHART_COLORS[2] },
    { name: 'Cần sửa', value: stats.revisionProducts, color: CHART_COLORS[3] },
  ].filter(d => d.value > 0);

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-16 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!isSeller) return null;

  const statCards = [
    { key: 'approved', value: stats.approvedProducts, label: 'Đã duyệt', icon: CheckCircle, gradient: 'from-emerald-500 to-green-600' },
    { key: 'pending', value: stats.pendingProducts, label: 'Chờ duyệt', icon: Clock, gradient: 'from-amber-500 to-yellow-600' },
    { key: 'total', value: stats.totalProducts, label: 'Tổng SP', icon: Package, gradient: 'from-blue-500 to-indigo-600' },
    { key: 'revision', value: stats.rejectedProducts + stats.revisionProducts, label: 'Cần xử lý', icon: AlertCircle, gradient: 'from-rose-500 to-red-600' },
  ];

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Store className="h-7 w-7 text-primary" />
              </div>
              Dashboard Người bán
            </h1>
            <p className="text-muted-foreground mt-2">
              Xin chào, <span className="font-medium text-foreground">{profile?.full_name || 'Người bán'}</span>! Quản lý cửa hàng của bạn.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchData(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/seller/revenue">
                <TrendingUp className="h-4 w-4 mr-2" />
                Thống kê doanh thu
              </Link>
            </Button>
            <Button asChild>
              <Link to="/seller/products">
                <Plus className="h-4 w-4 mr-2" />
                Đăng sản phẩm
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.key} className="border-0 shadow-md overflow-hidden relative group hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold">{card.value}</p>
                      <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
                    </div>
                    <div className={cn("p-3 rounded-xl bg-gradient-to-br text-white shadow-lg", card.gradient)}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pie Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Trạng thái sản phẩm
              </CardTitle>
              <CardDescription>Phân bố theo trạng thái duyệt</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [value + ' sản phẩm', name]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Chưa có sản phẩm</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 space-y-2">
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

          {/* Recent Products */}
          <Card className="lg:col-span-2 border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Sản phẩm gần đây
                </CardTitle>
                <CardDescription>Các sản phẩm mới đăng gần đây</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/seller/products">
                  Xem tất cả
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentProducts.length > 0 ? (
                <div className="space-y-3">
                  {recentProducts.map((product) => {
                    const statusConfig = STATUS_CONFIG[product.status] || STATUS_CONFIG.pending;
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{product.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(product.created_at), 'dd/MM/yyyy', { locale: vi })}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-sm text-primary">{formatCurrency(product.price)}</p>
                          <Badge variant="secondary" className={cn("text-xs mt-0.5", statusConfig.bg, statusConfig.color)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <h3 className="font-semibold">Chưa có sản phẩm nào</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">Bắt đầu đăng sản phẩm để bán hàng</p>
                  <Button asChild>
                    <Link to="/seller/products">
                      <Plus className="h-4 w-4 mr-2" />
                      Đăng sản phẩm đầu tiên
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Guide */}
        <SellerGuide />

        {/* Business Info Card */}
        {profile && (
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                Thông tin doanh nghiệp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Loại hình', value: profile.business_type },
                  { label: 'Mô hình', value: profile.business_model },
                  { label: 'Mã số thuế', value: profile.tax_code },
                  { label: 'Trạng thái', value: profile.is_verified_seller ? '✅ Đã xác minh' : '⏳ Chờ xác minh' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                    <p className="font-medium text-sm">{item.value || 'Chưa cập nhật'}</p>
                  </div>
                ))}
              </div>
              {!profile.business_type && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    ⚠️ Vui lòng cập nhật đầy đủ thông tin doanh nghiệp trong hồ sơ.
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
