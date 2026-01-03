import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import heroBanner from '@/assets/hero-banner.jpg';
import { useHomepageSettings } from '@/hooks/useHomepageSettings';

export function HeroSection() {
  const { settings, loading } = useHomepageSettings();
  const hero = settings.hero;

  const showBadge = hero.show_badge !== false;
  const showDescription = hero.show_description !== false;
  const showButtons = hero.show_buttons !== false;
  const showStats = hero.show_stats !== false;

  return (
    <section className="relative min-h-[100svh] md:min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={hero.background_image || heroBanner}
          alt="Hero banner"
          className="w-full h-full object-cover object-center scale-105 animate-slow-zoom"
        />
        {/* Mobile gradient - stronger for readability */}
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-charcoal/95 via-charcoal/85 to-charcoal/60 md:from-charcoal/95 md:via-charcoal/80 md:to-charcoal/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
      </div>

      {/* Decorative elements - hidden on mobile for performance */}
      <div className="hidden md:block absolute top-1/4 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="hidden md:block absolute bottom-1/3 right-1/3 w-48 h-48 bg-accent/10 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="container relative z-10 px-4 md:px-6">
        <div className="max-w-2xl space-y-4 md:space-y-8 pt-16 md:pt-0">
          {/* Badge */}
          {showBadge && (
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-accent/20 backdrop-blur-sm text-accent rounded-full text-xs md:text-sm font-medium tracking-wide animate-slide-up border border-accent/30">
              <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
              {loading ? '...' : hero.badge_text}
            </div>
          )}
          
          {/* Title */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-cream leading-[1.05] animate-slide-up stagger-1">
            {loading ? '...' : hero.title_line1}
            <br />
            <span className="text-gradient-gold">{loading ? '...' : hero.title_line2}</span>
          </h1>
          
          {/* Description */}
          {showDescription && (
            <p className="text-cream/70 text-base md:text-lg lg:text-xl max-w-lg leading-relaxed animate-slide-up stagger-2">
              {loading ? '...' : hero.description}
            </p>
          )}
          
          {/* Buttons */}
          {showButtons && (
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4 animate-slide-up stagger-3">
              <Link to="/products" className="w-full sm:w-auto">
                <Button variant="hero" size="lg" className="group w-full text-sm md:text-base h-12 md:h-14">
                  {loading ? '...' : hero.button_primary_text}
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/contact" className="w-full sm:w-auto">
                <Button variant="hero-outline" size="lg" className="w-full text-sm md:text-base h-12 md:h-14">
                  {loading ? '...' : hero.button_secondary_text}
                </Button>
              </Link>
            </div>
          )}

          {/* Stats */}
          {showStats && (hero.stats || []).length > 0 && (
            <div className="flex items-center justify-start gap-6 md:gap-8 pt-6 md:pt-8 animate-slide-up stagger-4">
              {(hero.stats || []).map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-accent">{stat.value}</p>
                  <p className="text-cream/50 text-xs md:text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator - hidden on mobile */}
      <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-cream/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-cream/50 rounded-full animate-scroll-hint" />
        </div>
      </div>

      {/* Mobile swipe indicator */}
      <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-pulse">
        <div className="w-8 h-1 bg-cream/30 rounded-full" />
        <span className="text-cream/40 text-xs">Cuộn xuống</span>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
