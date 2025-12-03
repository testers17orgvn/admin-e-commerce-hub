import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Package, ShoppingCart, FileText, Mail, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, blogs: 0, contacts: 0, revenue: 0 });

  useEffect(() => {
    async function fetchStats() {
      const [products, orders, blogs, contacts] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, total_amount'),
        supabase.from('blogs').select('id', { count: 'exact', head: true }),
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('is_read', false),
      ]);
      
      const revenue = (orders.data as any[])?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      
      setStats({
        products: products.count || 0,
        orders: orders.data?.length || 0,
        blogs: blogs.count || 0,
        contacts: contacts.count || 0,
        revenue,
      });
    }
    fetchStats();
  }, []);

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const cards = [
    { label: 'Sản phẩm', value: stats.products, icon: Package, color: 'bg-blue-500' },
    { label: 'Đơn hàng', value: stats.orders, icon: ShoppingCart, color: 'bg-green-500' },
    { label: 'Doanh thu', value: formatPrice(stats.revenue), icon: TrendingUp, color: 'bg-accent' },
    { label: 'Bài viết', value: stats.blogs, icon: FileText, color: 'bg-purple-500' },
    { label: 'Tin nhắn mới', value: stats.contacts, icon: Mail, color: 'bg-red-500' },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
    </AdminLayout>
  );
}
