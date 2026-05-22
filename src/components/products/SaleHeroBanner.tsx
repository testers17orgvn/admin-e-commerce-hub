import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Tag, Flame, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { defaultSaleBanner, type SaleBannerSettings } from '@/components/admin/SaleBannerManager';

function getTimeLeft(endIso: string) {
  const end = new Date(endIso).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
        <span className="font-display text-sm sm:text-base md:text-lg font-black text-white tabular-nums">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-white/80 uppercase tracking-wider mt-1">{label}</span>
    </div>
  );
}

function CountdownSeparator() {
  return (
    <div className="flex flex-col justify-center pb-4 sm:pb-5">
      <span className="text-white/70 font-black text-sm sm:text-base md:text-lg">:</span>
    </div>
  );
}

export function SaleHeroBanner() {
  const [s, setS] = useState<SaleBannerSettings>(defaultSaleBanner);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'sale_hero_banner')
        .maybeSingle();
      if (data?.value) {
        setS({ ...defaultSaleBanner, ...(data.value as unknown as SaleBannerSettings) });
      }
      setLoaded(true);
    })();
  }, []);

  if (!loaded || !s.is_active) return null;

  const content = (
    <div className="relative overflow-hidden rounded-3xl mb-6 shadow-xl shadow-primary/20 isolate">
      {s.background_image ? (
        <>
          <img src={s.background_image} alt={s.badge_text} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/70 via-primary/40 to-accent/60" />
        </>
      ) : (
        <div className="absolute inset-0 animate-gradient-shift bg-[linear-gradient(120deg,hsl(var(--primary)),hsl(var(--accent)),hsl(var(--primary)),#ff4d8d,hsl(var(--primary)))]" />
      )}

      <div className="pointer-events-none absolute -top-16 -left-10 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 w-72 h-72 bg-yellow-300/30 rounded-full blur-3xl animate-pulse-slow" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-slide" />
      </div>

      <Sparkles className="pointer-events-none absolute top-4 left-6 w-4 h-4 text-yellow-200 animate-sparkle" style={{ animationDelay: '0s' }} />
      <Sparkles className="pointer-events-none absolute top-10 right-1/4 w-5 h-5 text-white animate-sparkle" style={{ animationDelay: '0.4s' }} />
      <Sparkles className="pointer-events-none absolute bottom-6 left-1/3 w-3 h-3 text-yellow-100 animate-sparkle" style={{ animationDelay: '0.9s' }} />
      <Sparkles className="pointer-events-none absolute bottom-10 right-10 w-4 h-4 text-white animate-sparkle" style={{ animationDelay: '1.3s' }} />
      <Sparkles className="pointer-events-none absolute top-1/2 left-10 w-3 h-3 text-yellow-200 animate-sparkle" style={{ animationDelay: '1.7s' }} />

      <div className="relative z-10 px-5 py-7 md:px-10 md:py-10 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          {s.badge_text && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-3 animate-flash-pulse">
              <Flame className="w-3.5 h-3.5 text-yellow-200" />
              <span className="text-[11px] md:text-xs font-bold text-white uppercase tracking-wider">{s.badge_text}</span>
            </div>
          )}
          <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-lg">
            {s.title_prefix}{' '}
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-yellow-200 animate-gradient-shift">
              {s.highlight_text}
            </span>
          </h2>
          {s.subtitle && (
            <p className="text-white/90 text-xs md:text-sm mt-1.5 md:mt-2 font-medium drop-shadow">{s.subtitle}</p>
          )}
          <div className="flex items-center gap-2 md:gap-3 mt-3 md:mt-4 flex-wrap">
            {s.chip1_text && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-white text-primary text-[11px] md:text-xs font-bold shadow-md">
                <Zap className="w-3.5 h-3.5 fill-primary" />
                {s.chip1_text}
              </div>
            )}
            {s.chip2_text && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-yellow-300 text-yellow-900 text-[11px] md:text-xs font-bold shadow-md">
                <Tag className="w-3.5 h-3.5" />
                {s.chip2_text}
              </div>
            )}
          </div>
        </div>

        <div className="hidden sm:flex flex-shrink-0 relative animate-float-y">
          <div className="absolute inset-0 bg-yellow-300 rounded-full blur-xl opacity-60 animate-pulse-slow" />
          <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-300 to-orange-400 flex flex-col items-center justify-center shadow-2xl border-4 border-white/40">
            {s.big_label_top && <span className="text-[10px] md:text-xs font-bold text-orange-900 uppercase">{s.big_label_top}</span>}
            {s.big_label_main && <span className="font-display text-2xl md:text-4xl font-black text-orange-900 leading-none">{s.big_label_main}</span>}
            {s.big_label_bottom && <span className="text-[10px] md:text-xs font-bold text-orange-900 uppercase">{s.big_label_bottom}</span>}
          </div>
        </div>
      </div>
    </div>
  );

  if (s.link_url) {
    if (s.link_url.startsWith('http')) {
      return <a href={s.link_url} target="_blank" rel="noopener noreferrer" className="block">{content}</a>;
    }
    return <Link to={s.link_url} className="block">{content}</Link>;
  }
  return content;
}
