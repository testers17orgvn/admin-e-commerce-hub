import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Package, ShoppingCart, FileText, Mail, TrendingUp, RefreshCw, Calendar, Star, Truck, Trophy, User, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Area, AreaChart
} from 'recharts';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, subWeeks, startOfMonth, startOfYear, subMonths, eachMonthOfInterval, eachWeekOfInterval, eachDayOfInterval, subDays, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ExportExcel } from '@/components/admin/ExportExcel';

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, blogs: 0, contacts: 0, revenue: 0 });
  const [weeklyStats, setWeeklyStats] = useState({ revenue: 0, contacts: 0 });
  const [shipperReviewStats, setShipperReviewStats] = useState({ total: 0, avg: 0, distribution: [0, 0, 0, 0, 0] });
  const [topShippers, setTopShippers] = useState<{ id: string; name: string; avatar: string | null; avg: number; total: number }[]>([]);
  const [shipperTimeFilter, setShipperTimeFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [trendFilter, setTrendFilter] = useState<'7days' | '30days' | '6months' | '12months'>('30days');
  const [trendData, setTrendData] = useState<{ label: string; avg: number; count: number }[]>([]);
  const [currentWeek, setCurrentWeek] = useState({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) });
  const [revenueChartFilter, setRevenueChartFilter] = useState<'6months' | '12months'>('12months');
  const [revenueChartData, setRevenueChartData] = useState<{ label: string; revenue: number; orders: number }[]>([]);

  const fetchStats = async () => {
    const [products, orders, blogs, contacts, shipperReviews] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id, total_amount, created_at'),
      supabase.from('blogs').select('id', { count: 'exact', head: true }),
      supabase.from('contacts').select('id, created_at').eq('is_read', false),
      supabase.from('shipper_reviews').select('rating'),
    ]);

    const allRevenue = (orders.data as any[])?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    const weeklyRevenue = (orders.data as any[])?.filter(o => {
      const d = new Date(o.created_at);
      return d >= currentWeek.start && d <= currentWeek.end;
    }).reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    const weeklyContacts = (contacts.data as any[])?.filter(c => {
      const d = new Date(c.created_at);
      return d >= currentWeek.start && d <= currentWeek.end;
    }).length || 0;

    setStats({ products: products.count || 0, orders: orders.data?.length || 0, blogs: blogs.count || 0, contacts: contacts.count || 0, revenue: allRevenue });
    setWeeklyStats({ revenue: weeklyRevenue, contacts: weeklyContacts });

    const reviews = shipperReviews.data || [];
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r: any) => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++; });
    const avg = reviews.length > 0 ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0;
    setShipperReviewStats({ total: reviews.length, avg: Math.round(avg * 10) / 10, distribution: dist });
  };

  const fetchTopShippers = async () => {
    let query = supabase.from('shipper_reviews').select('shipper_id, rating, created_at');
    const now = new Date();
    if (shipperTimeFilter === 'week') query = query.gte('created_at', startOfWeek(now, { weekStartsOn: 1 }).toISOString());
    else if (shipperTimeFilter === 'month') query = query.gte('created_at', startOfMonth(now).toISOString());
    else if (shipperTimeFilter === 'year') query = query.gte('created_at', startOfYear(now).toISOString());

    const { data: allReviews } = await query;
    const shipperMap: Record<string, { total: number; sum: number }> = {};
    (allReviews || []).forEach((r: any) => {
      if (!shipperMap[r.shipper_id]) shipperMap[r.shipper_id] = { total: 0, sum: 0 };
      shipperMap[r.shipper_id].total++;
      shipperMap[r.shipper_id].sum += r.rating;
    });
    const ranked = Object.entries(shipperMap)
      .map(([id, s]) => ({ id, avg: Math.round((s.sum / s.total) * 10) / 10, total: s.total }))
      .sort((a, b) => b.avg - a.avg || b.total - a.total)
      .slice(0, 10);

    if (ranked.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', ranked.map(r => r.id));
      const profileMap: Record<string, { name: string; avatar: string | null }> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.id] = { name: p.full_name || 'Shipper', avatar: p.avatar_url }; });
      setTopShippers(ranked.map(r => ({ ...r, name: profileMap[r.id]?.name || 'Shipper', avatar: profileMap[r.id]?.avatar || null })));
    } else {
      setTopShippers([]);
    }
  };

  const fetchTrendData = async () => {
    const now = new Date();
    let startDate: Date;
    let intervals: Date[];
    let labelFn: (d: Date) => string;
    let groupFn: (d: Date) => string;

    if (trendFilter === '7days') {
      startDate = subDays(now, 6);
      intervals = eachDayOfInterval({ start: startDate, end: now });
      labelFn = (d) => format(d, 'dd/MM', { locale: vi });
      groupFn = (d) => format(d, 'yyyy-MM-dd');
    } else if (trendFilter === '30days') {
      startDate = subDays(now, 29);
      intervals = eachDayOfInterval({ start: startDate, end: now });
      labelFn = (d) => format(d, 'dd/MM', { locale: vi });
      groupFn = (d) => format(d, 'yyyy-MM-dd');
    } else if (trendFilter === '6months') {
      startDate = subMonths(now, 5);
      intervals = eachMonthOfInterval({ start: startOfMonth(startDate), end: now });
      labelFn = (d) => format(d, 'MM/yyyy', { locale: vi });
      groupFn = (d) => format(d, 'yyyy-MM');
    } else {
      startDate = subMonths(now, 11);
      intervals = eachMonthOfInterval({ start: startOfMonth(startDate), end: now });
      labelFn = (d) => format(d, 'MM/yyyy', { locale: vi });
      groupFn = (d) => format(d, 'yyyy-MM');
    }

    const { data: reviews } = await supabase
      .from('shipper_reviews')
      .select('rating, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    const buckets: Record<string, { sum: number; count: number }> = {};
    intervals.forEach(d => { buckets[groupFn(d)] = { sum: 0, count: 0 }; });

    (reviews || []).forEach((r: any) => {
      const key = groupFn(new Date(r.created_at));
      if (buckets[key]) { buckets[key].sum += r.rating; buckets[key].count++; }
    });

    setTrendData(intervals.map(d => {
      const key = groupFn(d);
      const b = buckets[key];
      return { label: labelFn(d), avg: b.count > 0 ? Math.round((b.sum / b.count) * 10) / 10 : 0, count: b.count };
    }));
  };

  const fetchRevenueChart = async () => {
    const now = new Date();
    const months = revenueChartFilter === '6months' ? 5 : 11;
    const startDate = subMonths(now, months);
    const intervals = eachMonthOfInterval({ start: startOfMonth(startDate), end: now });

    const { data: orderData } = await supabase
      .from('orders')
      .select('total_amount, created_at, status')
      .gte('created_at', startOfMonth(startDate).toISOString())
      .neq('status', 'cancelled');

    const buckets: Record<string, { revenue: number; orders: number }> = {};
    intervals.forEach(d => {
      buckets[format(d, 'yyyy-MM')] = { revenue: 0, orders: 0 };
    });

    (orderData || []).forEach((o: any) => {
      const key = format(new Date(o.created_at), 'yyyy-MM');
      if (buckets[key]) {
        buckets[key].revenue += Number(o.total_amount);
        buckets[key].orders++;
      }
    });

    setRevenueChartData(intervals.map(d => {
      const key = format(d, 'yyyy-MM');
      return {
        label: format(d, 'MM/yyyy', { locale: vi }),
        revenue: buckets[key].revenue,
        orders: buckets[key].orders,
      };
    }));
  };

  useEffect(() => { fetchStats(); }, [currentWeek]);
  useEffect(() => { fetchTopShippers(); }, [shipperTimeFilter]);
  useEffect(() => { fetchTrendData(); }, [trendFilter]);
  useEffect(() => { fetchRevenueChart(); }, [revenueChartFilter]);

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const handleResetWeeklyRevenue = async () => {
    const { error } = await supabase.from('orders').update({ status: 'archived' }).gte('created_at', currentWeek.start.toISOString()).lte('created_at', currentWeek.end.toISOString());
    if (error) { toast.error('Lỗi khi reset doanh thu'); return; }
    toast.success('Đã reset doanh thu tuần này');
    fetchStats();
  };

  const handleResetWeeklyContacts = async () => {
    const { error } = await supabase.from('contacts').update({ is_read: true }).gte('created_at', currentWeek.start.toISOString()).lte('created_at', currentWeek.end.toISOString());
    if (error) { toast.error('Lỗi khi reset liên hệ'); return; }
    toast.success('Đã reset liên hệ tuần này');
    fetchStats();
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentWeek(prev => ({ start: subWeeks(prev.start, 1), end: subWeeks(prev.end, 1) }));
    } else {
      const nextStart = new Date(currentWeek.start); nextStart.setDate(nextStart.getDate() + 7);
      const nextEnd = new Date(currentWeek.end); nextEnd.setDate(nextEnd.getDate() + 7);
      if (nextStart <= new Date()) setCurrentWeek({ start: nextStart, end: nextEnd });
    }
  };

  const cards = [
    { label: 'Sản phẩm', value: stats.products, icon: Package, gradient: 'from-blue-500 to-blue-600' },
    { label: 'Đơn hàng', value: stats.orders, icon: ShoppingCart, gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'Tổng doanh thu', value: formatPrice(stats.revenue), icon: TrendingUp, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Bài viết', value: stats.blogs, icon: FileText, gradient: 'from-violet-500 to-purple-600' },
    { label: 'Tin nhắn mới', value: stats.contacts, icon: Mail, gradient: 'from-rose-500 to-red-500' },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Tổng quan hoạt động kinh doanh</p>
        </div>
        <ExportExcel />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.03] group-hover:opacity-[0.07] transition-opacity`} />
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-sm`}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold tracking-tight">{card.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly Stats */}
      <div className="rounded-xl border bg-card p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            Thống kê theo tuần
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>← Tuần trước</Button>
            <span className="text-sm font-medium px-3 py-1.5 rounded-lg bg-muted">
              {format(currentWeek.start, 'dd/MM', { locale: vi })} - {format(currentWeek.end, 'dd/MM/yyyy', { locale: vi })}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')} disabled={currentWeek.start >= startOfWeek(new Date(), { weekStartsOn: 1 })}>Tuần sau →</Button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: 'Doanh thu tuần này', value: formatPrice(weeklyStats.revenue), icon: TrendingUp, gradient: 'from-amber-500 to-orange-500', onReset: handleResetWeeklyRevenue, resetTitle: 'Reset doanh thu tuần?', resetDesc: `Đánh dấu đơn hàng trong tuần (${format(currentWeek.start, 'dd/MM')} - ${format(currentWeek.end, 'dd/MM')}) thành "Đã lưu trữ".` },
            { label: 'Liên hệ tuần này', value: weeklyStats.contacts, icon: Mail, gradient: 'from-rose-500 to-red-500', onReset: handleResetWeeklyContacts, resetTitle: 'Reset liên hệ tuần?', resetDesc: `Đánh dấu liên hệ trong tuần (${format(currentWeek.start, 'dd/MM')} - ${format(currentWeek.end, 'dd/MM')}) thành "Đã đọc".` },
          ].map((item) => (
            <div key={item.label} className="p-5 rounded-xl bg-muted/40 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm`}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{item.value}</p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                      <RefreshCw className="h-3.5 w-3.5" />Reset
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{item.resetTitle}</AlertDialogTitle>
                      <AlertDialogDescription>{item.resetDesc}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={item.onReset}>Xác nhận</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue & Orders Chart */}
      <div className="rounded-xl border bg-card p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            Doanh thu & Đơn hàng theo tháng
          </h2>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {([['6months', '6 tháng'], ['12months', '12 tháng']] as const).map(([key, label]) => (
              <Button key={key} variant={revenueChartFilter === key ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-3" onClick={() => setRevenueChartFilter(key)}>
                {label}
              </Button>
            ))}
          </div>
        </div>
        {revenueChartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={revenueChartData} barGap={2}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="revenue"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                  label={{ value: 'Doanh thu (VNĐ)', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 }, offset: 10 }}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Đơn hàng', angle: 90, position: 'insideRight', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 } }}
                />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 }}
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatPrice(value) : `${value} đơn`,
                    name === 'revenue' ? 'Doanh thu' : 'Đơn hàng'
                  ]}
                />
                <Bar yAxisId="revenue" dataKey="revenue" fill="url(#revenueGrad)" radius={[6, 6, 0, 0]} barSize={28} />
                <Bar yAxisId="orders" dataKey="orders" fill="url(#ordersGrad)" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span>Doanh thu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span>Đơn hàng</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shipper Review Overview + Distribution */}
      <div className="rounded-xl border bg-card p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
            <Truck className="h-4 w-4 text-white" />
          </div>
          Đánh giá Shipper
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-5">
            <div className="p-5 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border border-yellow-200/50 dark:border-yellow-800/30 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Star className="h-7 w-7 fill-yellow-500 text-yellow-500" />
                <span className="text-4xl font-bold tracking-tight">{shipperReviewStats.avg}</span>
                <span className="text-muted-foreground text-sm self-end mb-1">/5</span>
              </div>
              <p className="text-sm text-muted-foreground">{shipperReviewStats.total} đánh giá</p>
            </div>
            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = shipperReviewStats.distribution[star - 1];
                const pct = shipperReviewStats.total > 0 ? (count / shipperReviewStats.total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2.5 text-sm">
                    <span className="w-4 text-right font-medium">{star}</span>
                    <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-muted-foreground text-right tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={[
                { name: '1 ⭐', value: shipperReviewStats.distribution[0] },
                { name: '2 ⭐', value: shipperReviewStats.distribution[1] },
                { name: '3 ⭐', value: shipperReviewStats.distribution[2] },
                { name: '4 ⭐', value: shipperReviewStats.distribution[3] },
                { name: '5 ⭐', value: shipperReviewStats.distribution[4] },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Cell key={i} fill={['hsl(var(--destructive))', '#f59e0b', '#a3a3a3', 'hsl(var(--primary))', 'hsl(var(--primary))'][i]} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="rounded-xl border bg-card p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            Xu hướng đánh giá Shipper
          </h2>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {([['7days', '7 ngày'], ['30days', '30 ngày'], ['6months', '6 tháng'], ['12months', '12 tháng']] as const).map(([key, label]) => (
              <Button key={key} variant={trendFilter === key ? 'default' : 'ghost'} size="sm" className="h-7 text-xs px-3" onClick={() => setTrendFilter(key)}>
                {label}
              </Button>
            ))}
          </div>
        </div>
        {trendData.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={trendFilter === '30days' ? 4 : trendFilter === '12months' ? 1 : 'preserveStartEnd'}
                />
                <YAxis
                  yAxisId="avg"
                  domain={[0, 5]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Điểm TB', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 } }}
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Số lượng', angle: 90, position: 'insideRight', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 } }}
                />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 }}
                  formatter={(value: number, name: string) => [
                    name === 'avg' ? `${value} ⭐` : `${value} đánh giá`,
                    name === 'avg' ? 'Điểm TB' : 'Số lượng'
                  ]}
                />
                <Area yAxisId="avg" type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#avgGradient)" dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }} />
                <Area yAxisId="count" type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" fill="url(#countGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-primary rounded-full" />
                <span>Điểm trung bình</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-amber-500 rounded-full border-dashed" style={{ borderTop: '2px dashed #f59e0b', height: 0 }} />
                <span>Số đánh giá</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Shipper */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            Bảng xếp hạng Top Shipper
          </h2>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {([['all', 'Tất cả'], ['week', 'Tuần'], ['month', 'Tháng'], ['year', 'Năm']] as const).map(([key, label]) => (
              <Button key={key} variant={shipperTimeFilter === key ? 'default' : 'ghost'} size="sm" className="h-7 text-xs" onClick={() => setShipperTimeFilter(key)}>
                {label}
              </Button>
            ))}
          </div>
        </div>
        {topShippers.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Chưa có đánh giá nào</p>
        ) : (
          <div className="space-y-2.5">
            {topShippers.map((shipper, index) => {
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
              const isTop3 = index < 3;
              return (
                <div
                  key={shipper.id}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                    isTop3
                      ? 'bg-gradient-to-r from-yellow-50/80 to-amber-50/40 dark:from-yellow-950/10 dark:to-amber-950/5 border border-yellow-200/50 dark:border-yellow-800/20 shadow-sm'
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div className="w-9 text-center font-bold text-lg">
                    {medal || <span className="text-muted-foreground">#{index + 1}</span>}
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 ${isTop3 ? 'border-yellow-400/50' : 'border-border'}`}>
                    {shipper.avatar ? (
                      <img src={shipper.avatar} alt={shipper.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{shipper.name}</p>
                    <p className="text-xs text-muted-foreground">{shipper.total} đánh giá</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-background/80 rounded-lg px-3 py-1.5 border border-border/50">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-bold text-lg tabular-nums">{shipper.avg}</span>
                    <span className="text-muted-foreground text-xs">/5</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
