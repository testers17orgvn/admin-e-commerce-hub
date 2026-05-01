import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ShoppingBag, Star, Repeat, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface PurchasedItem {
  product_id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  slug?: string;
  order_id: string;
  paid_at: string;
}

export default function MyProducts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<PurchasedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, items, paid_at, payment_status, created_at')
        .eq('user_id', user.id)
        .eq('payment_status', 'paid')
        .order('paid_at', { ascending: false });

      const flat: PurchasedItem[] = [];
      (data || []).forEach((o: any) => {
        const arr = Array.isArray(o.items) ? o.items : [];
        arr.forEach((it: any) => {
          flat.push({
            product_id: it.product_id || it.id,
            name: it.name || 'Sản phẩm',
            image: it.image || it.image_url || '/placeholder.svg',
            price: Number(it.price || 0),
            quantity: Number(it.quantity || 1),
            slug: it.slug,
            order_id: o.id,
            paid_at: o.paid_at || o.created_at,
          });
        });
      });
      setItems(flat);
      setLoading(false);
    })();
  }, [user]);

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Sản phẩm đã mua</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} sản phẩm đã thanh toán thành công
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có sản phẩm nào</h3>
              <p className="text-muted-foreground mb-4">
                Hãy mua hàng và hoàn tất thanh toán để xem ở đây.
              </p>
              <Button onClick={() => navigate('/products')}>Khám phá sản phẩm</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((it, idx) => (
              <Card
                key={`${it.order_id}-${it.product_id}-${idx}`}
                className="group overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="relative aspect-square bg-muted overflow-hidden">
                  <img
                    src={it.image}
                    alt={it.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <Badge className="absolute top-2 left-2 bg-emerald-500 text-white border-0 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Đã thanh toán
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold line-clamp-2 min-h-[3rem]">{it.name}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-accent font-bold">{formatPrice(it.price)}</span>
                    <span className="text-muted-foreground">SL: {it.quantity}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(it.paid_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </p>
                  <div className="flex gap-2 pt-2">
                    {it.slug && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/products/${it.slug}`)}
                      >
                        <Repeat className="h-3 w-3 mr-1" /> Mua lại
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/orders/${it.order_id}`)}
                    >
                      <Star className="h-3 w-3 mr-1" /> Đánh giá
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
