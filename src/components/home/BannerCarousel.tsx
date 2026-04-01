import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  position: number;
  is_active: boolean;
  page_location: string;
  display_type: string;
  autoplay_interval: number;
  show_navigation: boolean;
  show_indicators: boolean;
}

interface BannerCarouselProps {
  pageLocation?: string;
  displayType?: string;
  className?: string;
  compact?: boolean;
}

export function BannerCarousel({ 
  pageLocation = 'home', 
  displayType = 'carousel',
  className,
  compact = false,
}: BannerCarouselProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .eq('page_location', pageLocation)
        .eq('display_type', displayType)
        .order('position');
      
      setBanners((data as Banner[]) || []);
      setLoading(false);
    };

    fetchBanners();
  }, [pageLocation, displayType]);

  // Auto-play
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = banners[0]?.autoplay_interval || 5000;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, interval);

    return () => clearInterval(timer);
  }, [banners]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (loading) {
    return (
      <div className={cn(
        "relative w-full bg-muted animate-pulse rounded-xl",
        compact ? "h-[140px] md:h-[180px]" : "h-[400px] md:h-[500px]",
        className
      )} />
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const showNav = banners[0]?.show_navigation && banners.length > 1;
  const showIndicators = banners[0]?.show_indicators && banners.length > 1;

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl group", className)}>
      {/* Slides */}
      <div 
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="min-w-full relative">
            {banner.link_url ? (
              <Link to={banner.link_url} className="block">
                {compact ? (
                  <CompactBannerSlide banner={banner} />
                ) : (
                  <BannerSlide banner={banner} />
                )}
              </Link>
            ) : compact ? (
              <CompactBannerSlide banner={banner} />
            ) : (
              <BannerSlide banner={banner} />
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showNav && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full shadow-lg",
              compact ? "h-8 w-8" : "h-12 w-12 left-4"
            )}
            onClick={goToPrev}
          >
            <ChevronLeft className={compact ? "h-4 w-4" : "h-6 w-6"} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full shadow-lg",
              compact ? "h-8 w-8" : "h-12 w-12 right-4"
            )}
            onClick={goToNext}
          >
            <ChevronRight className={compact ? "h-4 w-4" : "h-6 w-6"} />
          </Button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && (
        <div className={cn("absolute left-1/2 -translate-x-1/2 flex gap-1.5", compact ? "bottom-2" : "bottom-4 gap-2")}>
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "rounded-full transition-all duration-300 hover:scale-110",
                compact ? "w-2 h-2" : "w-3 h-3",
                index === currentIndex 
                  ? cn("bg-accent", compact ? "w-5" : "w-8")
                  : "bg-background/60 hover:bg-background/80"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BannerSlide({ banner }: { banner: Banner }) {
  return (
    <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
      <img
        src={banner.image_url}
        alt={banner.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/40 to-transparent" />
      <div className="absolute inset-0 flex items-center">
        <div className="container px-4 md:px-6">
          <div className="max-w-xl space-y-4 animate-slide-up">
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-cream">
              {banner.title}
            </h2>
            {banner.subtitle && (
              <p className="text-cream/80 text-lg md:text-xl">
                {banner.subtitle}
              </p>
            )}
            {banner.link_url && (
              <Button variant="hero" size="lg" className="mt-4">
                Khám phá ngay
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactBannerSlide({ banner }: { banner: Banner }) {
  return (
    <div className="relative h-[140px] md:h-[180px]">
      <img
        src={banner.image_url}
        alt={banner.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-charcoal/60 via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-center px-6 md:px-10">
        <div className="space-y-1">
          <h3 className="font-display text-lg md:text-2xl font-bold text-cream">
            {banner.title}
          </h3>
          {banner.subtitle && (
            <p className="text-cream/80 text-xs md:text-sm line-clamp-1">
              {banner.subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
