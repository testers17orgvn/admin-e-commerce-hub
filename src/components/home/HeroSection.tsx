import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useHomepageSettings } from '@/hooks/useHomepageSettings'

export function HeroSection() {
  const { settings, loading } = useHomepageSettings()

  if (loading || !settings?.hero) return null

  const hero = settings.hero

  const showBadge = hero.show_badge !== false
  const showDescription = hero.show_description !== false
  const showButtons = hero.show_buttons !== false
  const showStats = hero.show_stats !== false

  return (
    <section className="relative min-h-[100svh] md:min-h-[90vh] flex items-center overflow-hidden">
      
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={hero.background_image}
          alt="Hero banner"
          className="w-full h-full object-cover object-center scale-105 animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-charcoal/95 via-charcoal/85 to-charcoal/60 md:from-charcoal/95 md:via-charcoal/80 md:to-charcoal/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="max-w-2xl space-y-4 md:space-y-8 pt-16 md:pt-0">

          {/* Badge */}
          {showBadge && (
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-accent/20 backdrop-blur-sm text-accent rounded-full text-xs md:text-sm font-medium tracking-wide border border-accent/30">
              <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
              {hero.badge_text}
            </div>
          )}

          {/* Title */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-cream leading-[1.05]">
            {hero.title_line1}
            <br />
            <span className="text-gradient-gold">{hero.title_line2}</span>
          </h1>

          {/* Description */}
          {showDescription && (
            <p className="text-cream/70 text-base md:text-lg lg:text-xl max-w-lg leading-relaxed">
              {hero.description}
            </p>
          )}

          {/* Buttons */}
          {showButtons && (
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
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

          {/* Stats */}
          {showStats && hero.stats?.length > 0 && (
            <div className="flex items-center justify-start gap-6 md:gap-8 pt-6 md:pt-8">
              {hero.stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-accent">
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
    </section>
  )
}