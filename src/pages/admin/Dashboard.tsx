import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Package, ShoppingCart, FileText, Mail, TrendingUp, RefreshCw, Calendar, Star, Truck, Trophy, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, subWeeks, subMonths, subYears, startOfMonth, startOfYear } from 'date-fns';
import { vi } from 'date-fns/locale';
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
} from '@/components/ui/alert-dialog';
import { ExportExcel } from '@/components/admin/ExportExcel';

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, blogs: 0, contacts: 0, revenue: 0 });
  const [weeklyStats, setWeeklyStats] = useState({ revenue: 0, contacts: 0 });
  const [shipperReviewStats, setShipperReviewStats] = useState({ total: 0, avg: 0, distribution: [0, 0, 0, 0, 0] });
  const [topShippers, setTopShippers] = useState<{ id: string; name: string; avatar: string | null; avg: number; total: number }[]>([]);
  const [shipperTimeFilter, setShipperTimeFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [currentWeek, setCurrentWeek] = useState({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) });

  const fetchStats = async () => {
    const [products, orders, blogs, contacts, shipperReviews] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id, total_amount, created_at'),
      supabase.from('blogs').select('id', { count: 'exact', head: true }),
      supabase.from('contacts').select('id, created_at').eq('is_read', false),
      supabase.from('shipper_reviews').select('rating'),
    ]);
    
    const allRevenue = (orders.data as any[])?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    
    // Tính doanh thu tuần này
    const weekStart = currentWeek.start.toISOString();
    const weekEnd = currentWeek.end.toISOString();
    
    const weeklyRevenue = (orders.data as any[])?.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate >= currentWeek.start && orderDate <= currentWeek.end;
    }).reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    
    const weeklyContacts = (contacts.data as any[])?.filter(c => {
      const contactDate = new Date(c.created_at);
      return contactDate >= currentWeek.start && contactDate <= currentWeek.end;
    }).length || 0;
    
    setStats({
      products: products.count || 0,
      orders: orders.data?.length || 0,
      blogs: blogs.count || 0,
      contacts: contacts.count || 0,
      revenue: allRevenue,
    });
    
    setWeeklyStats({
      revenue: weeklyRevenue,
      contacts: weeklyContacts,
    });

    // Shipper review stats
    const reviews = shipperReviews.data || [];
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r: any) => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++; });
    const avg = reviews.length > 0 ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0;
    setShipperReviewStats({ total: reviews.length, avg: Math.round(avg * 10) / 10, distribution: dist });

  };

  const fetchTopShippers = async () => {
    let query = supabase.from('shipper_reviews').select('shipper_id, rating, created_at');
    const now = new Date();
    if (shipperTimeFilter === 'week') {
      query = query.gte('created_at', startOfWeek(now, { weekStartsOn: 1 }).toISOString());
    } else if (shipperTimeFilter === 'month') {
      query = query.gte('created_at', startOfMonth(now).toISOString());
    } else if (shipperTimeFilter === 'year') {
      query = query.gte('created_at', startOfYear(now).toISOString());
    }
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
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', ranked.map(r => r.id));
      const profileMap: Record<string, { name: string; avatar: string | null }> = {};
      (profiles || []).forEach((p: any) => { profileMap[p.id] = { name: p.full_name || 'Shipper', avatar: p.avatar_url }; });
      setTopShippers(ranked.map(r => ({
        ...r,
        name: profileMap[r.id]?.name || 'Shipper',
        avatar: profileMap[r.id]?.avatar || null,
      })));
    } else {
      setTopShippers([]);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentWeek]);

  useEffect(() => {
    fetchTopShippers();
  }, [shipperTimeFilter]);

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const handleResetWeeklyRevenue = async () => {
    // Reset bằng cách cập nhật trạng thái đơn hàng trong tuần thành 'archived'
    const weekStart = currentWeek.start.toISOString();
    const weekEnd = currentWeek.end.toISOString();
    
    const { error } = await supabase
      .from('orders')
      .update({ status: 'archived' })
      .gte('created_at', weekStart)
      .lte('created_at', weekEnd);
    
    if (error) {
      toast.error('Lỗi khi reset doanh thu');
      return;
    }
    
    toast.success('Đã reset doanh thu tuần này');
    fetchStats();
  };

  const handleResetWeeklyContacts = async () => {
    // Reset bằng cách đánh dấu đã đọc tất cả liên hệ trong tuần
    const weekStart = currentWeek.start.toISOString();
    const weekEnd = currentWeek.end.toISOString();
    
    const { error } = await supabase
      .from('contacts')
      .update({ is_read: true })
      .gte('created_at', weekStart)
      .lte('created_at', weekEnd);
    
    if (error) {
      toast.error('Lỗi khi reset liên hệ');
      return;
    }
    
    toast.success('Đã reset liên hệ tuần này');
    fetchStats();
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentWeek(prev => ({
        start: subWeeks(prev.start, 1),
        end: subWeeks(prev.end, 1),
      }));
    } else {
      const nextStart = new Date(currentWeek.start);
      nextStart.setDate(nextStart.getDate() + 7);
      const nextEnd = new Date(currentWeek.end);
      nextEnd.setDate(nextEnd.getDate() + 7);
      
      if (nextStart <= new Date()) {
        setCurrentWeek({ start: nextStart, end: nextEnd });
      }
    }
  };

  const cards = [
    { label: 'Sản phẩm', value: stats.products, icon: Package, color: 'bg-blue-500' },
    { label: 'Đơn hàng', value: stats.orders, icon: ShoppingCart, color: 'bg-green-500' },
    { label: 'Tổng doanh thu', value: formatPrice(stats.revenue), icon: TrendingUp, color: 'bg-accent' },
    { label: 'Bài viết', value: stats.blogs, icon: FileText, color: 'bg-purple-500' },
    { label: 'Tin nhắn mới', value: stats.contacts, icon: Mail, color: 'bg-red-500' },
  ];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <ExportExcel />
      </div>
      
      {/* Tổng quan */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-card rounded-lg border p-4">
            <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Thống kê theo tuần */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Thống kê theo tuần
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              ← Tuần trước
            </Button>
            <span className="text-sm font-medium px-3">
              {format(currentWeek.start, 'dd/MM', { locale: vi })} - {format(currentWeek.end, 'dd/MM/yyyy', { locale: vi })}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateWeek('next')}
              disabled={currentWeek.start >= startOfWeek(new Date(), { weekStartsOn: 1 })}
            >
              Tuần sau →
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Doanh thu tuần */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Doanh thu tuần này</p>
                  <p className="text-2xl font-bold">{formatPrice(weeklyStats.revenue)}</p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset doanh thu tuần?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Thao tác này sẽ đánh dấu tất cả đơn hàng trong tuần ({format(currentWeek.start, 'dd/MM')} - {format(currentWeek.end, 'dd/MM')}) thành "Đã lưu trữ". Bạn vẫn có thể xem lại trong phần quản lý đơn hàng.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetWeeklyRevenue}>Xác nhận</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Liên hệ tuần */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Liên hệ tuần này</p>
                  <p className="text-2xl font-bold">{weeklyStats.contacts}</p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset liên hệ tuần?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Thao tác này sẽ đánh dấu tất cả liên hệ trong tuần ({format(currentWeek.start, 'dd/MM')} - {format(currentWeek.end, 'dd/MM')}) thành "Đã đọc". Bạn vẫn có thể xem lại trong phần quản lý liên hệ.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetWeeklyContacts}>Xác nhận</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Thống kê đánh giá shipper */}
      <div className="bg-card rounded-lg border p-6 mt-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
          <Truck className="h-5 w-5" />
          Đánh giá Shipper
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Tổng quan */}
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                <span className="text-3xl font-bold">{shipperReviewStats.avg}</span>
                <span className="text-muted-foreground text-sm">/5</span>
              </div>
              <p className="text-sm text-muted-foreground">{shipperReviewStats.total} đánh giá</p>
            </div>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = shipperReviewStats.distribution[star - 1];
                const pct = shipperReviewStats.total > 0 ? (count / shipperReviewStats.total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-4 text-right">{star}</span>
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-muted-foreground text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Biểu đồ cột */}
          <div className="md:col-span-2">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: '1 ⭐', value: shipperReviewStats.distribution[0], fill: 'hsl(var(--destructive))' },
                { name: '2 ⭐', value: shipperReviewStats.distribution[1], fill: 'hsl(var(--accent))' },
                { name: '3 ⭐', value: shipperReviewStats.distribution[2], fill: 'hsl(var(--muted-foreground))' },
                { name: '4 ⭐', value: shipperReviewStats.distribution[3], fill: 'hsl(var(--primary))' },
                { name: '5 ⭐', value: shipperReviewStats.distribution[4], fill: 'hsl(var(--primary))' },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Cell key={i} fill={['hsl(var(--destructive))', 'hsl(var(--accent))', 'hsl(var(--muted-foreground))', 'hsl(var(--primary))', 'hsl(var(--primary))'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Top Shipper */}
      <div className="bg-card rounded-lg border p-6 mt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Bảng xếp hạng Top Shipper
          </h2>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {([['all', 'Tất cả'], ['week', 'Tuần'], ['month', 'Tháng'], ['year', 'Năm']] as const).map(([key, label]) => (
              <Button
                key={key}
                variant={shipperTimeFilter === key ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShipperTimeFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        {topShippers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Chưa có đánh giá nào</p>
        ) : (
          <div className="space-y-3">
            {topShippers.map((shipper, index) => {
              const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
              return (
                <div
                  key={shipper.id}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                    index < 3 ? 'bg-muted/70 border border-border' : 'bg-muted/30'
                  }`}
                >
                  <div className="w-8 text-center font-bold text-lg">
                    {medal || <span className="text-muted-foreground">#{index + 1}</span>}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                    {shipper.avatar ? (
                      <img src={shipper.avatar} alt={shipper.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{shipper.name}</p>
                    <p className="text-xs text-muted-foreground">{shipper.total} đánh giá</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-bold text-lg">{shipper.avg}</span>
                    <span className="text-muted-foreground text-sm">/5</span>
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
