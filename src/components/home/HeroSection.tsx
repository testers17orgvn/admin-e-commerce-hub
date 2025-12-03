import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import heroBanner from '@/assets/hero-banner.jpg';

export function HeroSection() {
  return (
    <section className="relative h-[85vh] min-h-[600px] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Hero banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="container relative z-10">
        <div className="max-w-2xl space-y-6 animate-fade-in">
          <span className="inline-block px-4 py-1.5 bg-accent/20 text-accent rounded-full text-sm font-medium tracking-wide animate-slide-up">
            Bộ sưu tập mới 2024
          </span>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-cream leading-tight animate-slide-up stagger-1">
            Phong cách
            <br />
            <span className="text-accent">Đẳng cấp</span>
          </h1>
          <p className="text-cream/80 text-lg md:text-xl max-w-lg leading-relaxed animate-slide-up stagger-2">
            Khám phá những thiết kế độc quyền, tinh tế được tuyển chọn từ các thương hiệu hàng đầu thế giới.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-slide-up stagger-3">
            <Link to="/products">
              <Button variant="hero" size="xl" className="group">
                Khám phá ngay
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/about">
              <Button variant="hero-outline" size="xl">
                Về chúng tôi
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
