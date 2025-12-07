import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import heroBanner from '@/assets/hero-banner.jpg';

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Hero banner"
          className="w-full h-full object-cover scale-105 animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/95 via-charcoal/80 to-charcoal/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-transparent" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-accent/10 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="container relative z-10">
        <div className="max-w-2xl space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 backdrop-blur-sm text-accent rounded-full text-sm font-medium tracking-wide animate-slide-up border border-accent/30">
            <Sparkles className="h-4 w-4" />
            Bộ sưu tập mới 2024
          </div>
          
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-cream leading-[1.1] animate-slide-up stagger-1">
            Phong cách
            <br />
            <span className="text-gradient-gold">Đẳng cấp</span>
          </h1>
          
          <p className="text-cream/70 text-lg md:text-xl max-w-lg leading-relaxed animate-slide-up stagger-2">
            Khám phá những thiết kế độc quyền, tinh tế được tuyển chọn từ các thương hiệu hàng đầu thế giới.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-slide-up stagger-3">
            <Link to="/products">
              <Button variant="hero" size="xl" className="group w-full sm:w-auto">
                Khám phá ngay
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
                Liên hệ tư vấn
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 pt-8 animate-slide-up stagger-4">
            {[
              { value: '500+', label: 'Sản phẩm' },
              { value: '10K+', label: 'Khách hàng' },
              { value: '5★', label: 'Đánh giá' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-display text-2xl md:text-3xl font-bold text-accent">{stat.value}</p>
                <p className="text-cream/50 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-cream/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-cream/50 rounded-full animate-scroll-hint" />
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
