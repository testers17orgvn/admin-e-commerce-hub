import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, ChevronDown } from 'lucide-react'
import { useHomepageSettings } from '@/hooks/useHomepageSettings'
import { useEffect, useState } from 'react'

export function HeroSection() {
  const { settings, loading } = useHomepageSettings()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  if (loading || !settings?.hero) return null

  const hero = settings.hero

  const showBadge = hero.show_badge !== false
  const showDescription = hero.show_description !== false
  const showButtons = hero.show_buttons !== false
  const showStats = hero.show_stats !== false

  const anim = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translate3d(0,0,0)' : 'translate3d(0, 30px, 0)',
    transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
  })

  return (
    <section className="relative min-h-[70svh] sm:min-h-[80svh] md:min-h-[90vh] max-h-[100svh] flex items-center overflow-hidden w-full max-w-full">
      
      {/* Background with parallax-like slow zoom */}
      <div className="absolute inset-0">
        <img
          src={hero.background_image}
          alt="Hero banner"
          className="w-full h-full object-cover object-center animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-charcoal/95 via-charcoal/85 to-charcoal/60 md:from-charcoal/95 md:via-charcoal/80 md:to-charcoal/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
        
        {/* Decorative floating orbs */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-accent/8 rounded-full blur-2xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="max-w-2xl space-y-4 md:space-y-8 pt-16 md:pt-0">

          {/* Badge */}
          {showBadge && (
            <div style={anim(0.2)}>
              <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-accent/20 backdrop-blur-sm text-accent rounded-full text-xs md:text-sm font-medium tracking-wide border border-accent/30">
                <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
                {hero.badge_text}
              </div>
            </div>
          )}

          {/* Title */}
          <h1 style={anim(0.4)} className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-cream leading-[1.05]">
            {hero.title_line1}
            <br />
            <span className="text-gradient-gold">{hero.title_line2}</span>
          </h1>

          {/* Description */}
          {showDescription && (
            <p style={anim(0.6)} className="text-cream/70 text-base md:text-lg lg:text-xl max-w-lg leading-relaxed">
              {hero.description}
            </p>
          )}

          {/* Buttons */}
          {showButtons && (
            <div style={anim(0.8)} className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
              <Link to="/products" className="w-full sm:w-auto">
                <Button variant="hero" size="lg" className="group w-full text-sm md:text-base h-12 md:h-14">
                  {hero.button_primary_text}
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              <Link to="/contact" className="w-full sm:w-auto">
                <Button variant="hero-outline" size="lg" className="w-full text-sm md:text-base h-12 md:h-14">
                  {hero.button_secondary_text}
                </Button>
              </Link>
            </div>
          )}

          {/* Stats with counter animation feel */}
          {showStats && hero.stats?.length > 0 && (
            <div style={anim(1.0)} className="flex items-center justify-start gap-6 md:gap-8 pt-6 md:pt-8">
              {hero.stats.map((stat: { value: string; label: string }, i: number) => (
                <div key={i} className="text-center group">
                  <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-accent transition-transform duration-300 group-hover:scale-110">
                    {stat.value}
                  </p>
                  <p className="text-cream/50 text-xs md:text-sm">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10" style={anim(1.2)}>
        <button
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          className="flex flex-col items-center gap-1 text-cream/40 hover:text-cream/70 transition-colors"
          aria-label="Scroll down"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Khám phá</span>
          <ChevronDown className="h-4 w-4 animate-scroll-hint" />
        </button>
      </div>
    </section>
  )
}
