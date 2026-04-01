import { BannerCarousel } from './BannerCarousel';
import { ScrollReveal } from './ScrollReveal';

export function PromoBannerSection() {
  return (
    <section className="py-4 md:py-6">
      <div className="container">
        <ScrollReveal direction="up">
          <BannerCarousel
            pageLocation="home_promo"
            displayType="carousel"
            className="rounded-2xl overflow-hidden max-h-[180px] md:max-h-[220px]"
            compact
          />
        </ScrollReveal>
      </div>
    </section>
  );
}
