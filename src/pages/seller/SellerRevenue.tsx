import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign, TrendingUp, ShoppingCart, Package, ArrowLeft,
  BarChart3, ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface OrderItem {
  product_id?: string;
  name?: string;
  price?: number;
  quantity?: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SellerRevenue() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '12m'>('30d');
  const [orders, setOrders] = useState<any[]>([]);
  const [sellerProductIds, setSellerProductIds] = useState<Set<string>>(new Set());
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/auth'); return; }
    if (user) checkAndFetch();
  }, [user, authLoading]);

  useEffect(() => { if (user && sellerProductIds.size > 0) fetchOrders(); }, [period]);

  const checkAndFetch = async () => {
    const { data: isSeller } = await supabase.rpc('is_seller');
    if (!isSeller) { toast.error('Cần quyền seller'); navigate('/profile'); return; }

    const { data: products } = await supabase
      .from('seller_products')
      .select('id, name, price, stock, status, image_url')
      .eq('seller_id', user!.id)
      .eq('status', 'approved');

    const ids = new Set((products || []).map(p => p.id));
    setSellerProductIds(ids);
    setSellerProducts(products || []);
    await fetchOrders(ids);
  };

  const fetchOrders = async (ids?: Set<string>) => {
    setLoading(true);
    const productIds = ids || sellerProductIds;
    if (productIds.size === 0) { setLoading(false); return; }

    let dateFrom: Date;
    if (period === '7d') dateFrom = subDays(new Date(), 7);
    else if (period === '30d') dateFrom = subDays(new Date(), 30);
    else if (period === '90d') dateFrom = subDays(new Date(), 90);
    else dateFrom = subMonths(new Date(), 12);

    const { data } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', dateFrom.toISOString())
      .in('status', ['confirmed', 'shipping', 'delivered', 'completed']);

    // Filter orders containing seller's products
    const relevantOrders = (data || []).filter(order => {
      const items = (order.items as OrderItem[]) || [];
      return items.some(item => productIds.has(item.product_id || ''));
    });

    setOrders(relevantOrders);
    setLoading(false);
  };

  const calculateSellerRevenue = (order: any) => {
    const items = (order.items as OrderItem[]) || [];
    return items.reduce((sum, item) => {
      if (sellerProductIds.has(item.product_id || ''))
        return sum + (item.price || 0) * (item.quantity || 0);
      return sum;
    }, 0);
  };

  const totalRevenue = orders.reduce((sum, o) => sum + calculateSellerRevenue(o), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItemsSold = orders.reduce((sum, o) => {
    const items = (o.items as OrderItem[]) || [];
    return sum + items.filter(i => sellerProductIds.has(i.product_id || '')).reduce((s, i) => s + (i.quantity || 0), 0);
  }, 0);

  // Revenue over time chart data
  const getChartData = () => {
    if (period === '12m') {
      const months = eachMonthOfInterval({ start: subMonths(new Date(), 11), end: new Date() });
      return months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthOrders = orders.filter(o => {
          const d = new Date(o.created_at);
          return d >= monthStart && d <= monthEnd;
        });
        return {
          label: format(month, 'MM/yy'),
          revenue: monthOrders.reduce((s, o) => s + calculateSellerRevenue(o), 0),
          orders: monthOrders.length,
        };
      });
    }
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const interval = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() });
    return interval.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayOrders = orders.filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === dayStr);
      return {
        label: format(day, period === '7d' ? 'EEE' : 'dd/MM', { locale: vi }),
        revenue: dayOrders.reduce((s, o) => s + calculateSellerRevenue(o), 0),
        orders: dayOrders.length,
      };
    });
  };

  // Top products
  const getTopProducts = () => {
    const productMap = new Map<string, { name: string; revenue: number; quantity: number }>();
    orders.forEach(o => {
      const items = (o.items as OrderItem[]) || [];
      items.forEach(item => {
        if (!sellerProductIds.has(item.product_id || '')) return;
        const existing = productMap.get(item.product_id!) || { name: item.name || '', revenue: 0, quantity: 0 };
        existing.revenue += (item.price || 0) * (item.quantity || 0);
        existing.quantity += item.quantity || 0;
        productMap.set(item.product_id!, existing);
      });
    });
    return Array.from(productMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  const chartData = getChartData();
  const topProducts = getTopProducts();

  const pieData = topProducts.map((p, i) => ({ name: p.name, value: p.revenue, color: COLORS[i % COLORS.length] }));

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-16 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/seller/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-emerald-500/10 to-green-500/5 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-emerald-600" />
                </div>
                Thống kê doanh thu
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Phân tích hiệu suất bán hàng chi tiết</p>
            </div>
          </div>
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 ngày qua</SelectItem>
              <SelectItem value="30d">30 ngày qua</SelectItem>
              <SelectItem value="90d">90 ngày qua</SelectItem>
              <SelectItem value="12m">12 tháng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Tổng doanh thu', value: formatCurrency(totalRevenue), icon: DollarSign, gradient: 'from-emerald-500 to-green-600', trend: '+12%', up: true },
            { label: 'Đơn hàng', value: totalOrders.toString(), icon: ShoppingCart, gradient: 'from-blue-500 to-indigo-600', trend: '+8%', up: true },
            { label: 'Sản phẩm bán ra', value: totalItemsSold.toString(), icon: Package, gradient: 'from-purple-500 to-violet-600', trend: '+15%', up: true },
            { label: 'TB / đơn', value: formatCurrency(avgOrderValue), icon: TrendingUp, gradient: 'from-amber-500 to-orange-600', trend: '-3%', up: false },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className="border-0 shadow-md overflow-hidden group hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                      <p className="text-xl font-bold mt-1 truncate">{card.value}</p>
                      <div className={cn("flex items-center gap-1 text-xs mt-2 font-medium", card.up ? 'text-emerald-600' : 'text-red-500')}>
                        {card.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {card.trend}
                      </div>
                    </div>
                    <div className={cn("p-2.5 rounded-xl bg-gradient-to-br text-white shadow-lg", card.gradient)}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
            <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
            <TabsTrigger value="products">Sản phẩm</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Biểu đồ doanh thu</CardTitle>
                <CardDescription>Doanh thu theo thời gian</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="label" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tickFormatter={v => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(v)} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip formatter={(v: number) => [formatCurrency(v), 'Doanh thu']} />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#colorRevenue)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <p>Chưa có dữ liệu</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Số lượng đơn hàng</CardTitle>
                <CardDescription>Đơn hàng theo thời gian</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip formatter={(v: number) => [v, 'Đơn hàng']} />
                      <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Products Pie */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">Top sản phẩm bán chạy</CardTitle>
                  <CardDescription>Phân bố doanh thu theo sản phẩm</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => [formatCurrency(v), 'Doanh thu']} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">Chưa có dữ liệu</div>
                    )}
                  </div>
                  <div className="space-y-2 mt-2">
                    {pieData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="truncate max-w-[150px]">{item.name}</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Products List */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">Bảng xếp hạng sản phẩm</CardTitle>
                  <CardDescription>Doanh thu và số lượng bán</CardDescription>
                </CardHeader>
                <CardContent>
                  {topProducts.length > 0 ? (
                    <div className="space-y-3">
                      {topProducts.map((product, index) => (
                        <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white",
                            index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                            'bg-muted text-muted-foreground'
                          )}>
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.quantity} đã bán</p>
                          </div>
                          <p className="font-bold text-sm text-primary">{formatCurrency(product.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Chưa có dữ liệu bán hàng</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Inventory Overview */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Tồn kho sản phẩm
            </CardTitle>
            <CardDescription>Sản phẩm đã được duyệt</CardDescription>
          </CardHeader>
          <CardContent>
            {sellerProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sellerProducts.map(product => (
                  <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-shadow">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(product.price)}</p>
                    </div>
                    <Badge variant={product.stock > 10 ? 'secondary' : product.stock > 0 ? 'outline' : 'destructive'}>
                      {product.stock}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Chưa có sản phẩm nào được duyệt</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
