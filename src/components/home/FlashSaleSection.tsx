import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

interface FlashSaleSettings {
  title: string;
  end_time: string;
  banner_image?: string;
  is_active: boolean;
  product_ids?: string[];
}

const defaultSettings: FlashSaleSettings = {
  title: '⚡ Flash Sale',
  end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  is_active: true,
};

function CountdownTimer({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (expired) return null;

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-destructive text-destructive-foreground font-bold text-lg md:text-2xl rounded-lg w-12 h-12 md:w-14 md:h-14 flex items-center justify-center shadow-lg">
        {String(value).padStart(2, '0')}
      </div>
      <span className="text-[10px] md:text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <TimeBox value={timeLeft.hours} label="Giờ" />
      <span className="text-destructive font-bold text-xl mb-4">:</span>
      <TimeBox value={timeLeft.minutes} label="Phút" />
      <span className="text-destructive font-bold text-xl mb-4">:</span>
      <TimeBox value={timeLeft.seconds} label="Giây" />
    </div>
  );
}

export function FlashSaleSection() {
  const [settings, setSettings] = useState<FlashSaleSettings>(defaultSettings);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data: settingsData } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'flash_sale')
          .maybeSingle();

        const s = settingsData?.value
          ? { ...defaultSettings, ...(settingsData.value as unknown as FlashSaleSettings) }
          : defaultSettings;
        setSettings(s);

        if (!s.is_active) { setLoading(false); return; }

        // Fetch flash sale products (is_hot or specific ids)
        let query = supabase.from('products').select('*').eq('is_active', true);
        if (s.product_ids && s.product_ids.length > 0) {
          query = query.in('id', s.product_ids);
        } else {
          query = query.eq('is_hot', true);
        }
        const { data } = await query.limit(8);
        setProducts((data as Product[]) || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  // Check if sale expired
  const isExpired = useMemo(() => new Date(settings.end_time).getTime() <= Date.now(), [settings.end_time]);

  if (!settings.is_active || isExpired || (!loading && products.length === 0)) return null;

  return (
    <section className="py-6 md:py-10">
      <div className="container">
        {/* Banner image */}
        {settings.banner_image && (
          <ScrollReveal direction="up">
            <div className="rounded-2xl overflow-hidden mb-6 max-h-[160px] md:max-h-[200px]">
              <img
                src={settings.banner_image}
                alt="Flash Sale Banner"
                className="w-full h-full object-cover"
              />
            </div>
          </ScrollReveal>
        )}

        {/* Header */}
        <ScrollReveal direction="up">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-4 md:p-6 bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent rounded-2xl border border-destructive/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive rounded-xl animate-pulse">
                <Zap className="h-6 w-6 text-destructive-foreground" />
              </div>
              <div>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                  {settings.title}
                </h2>
                <p className="text-sm text-muted-foreground">Kết thúc sau</p>
              </div>
            </div>
            <CountdownTimer endTime={settings.end_time} />
          </div>
        </ScrollReveal>

        {/* Products */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, index) => (
              <ScrollReveal key={product.id} direction="up" delay={index * 0.06} distance={20}>
                <ProductCard product={product} showFlashSale />
              </ScrollReveal>
            ))}
          </div>
        )}

        <ScrollReveal direction="up" delay={0.15}>
          <div className="text-center mt-8">
            <Link to="/products">
              <Button variant="outline" size="lg" className="group border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                Xem tất cả deal
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
