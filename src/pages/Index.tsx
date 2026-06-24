import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { PromoBannerSection } from '@/components/home/PromoBannerSection';
import { FlashSaleSection } from '@/components/home/FlashSaleSection';
import { NewArrivalsSection } from '@/components/home/NewArrivalsSection';
import { useHomepageSections } from '@/hooks/useHomepageSections';

const sectionComponents: Record<string, React.ComponentType> = {
  hero: HeroSection,
  categories: CategoriesSection,
  promo_banner: PromoBannerSection,
  flash_sale: FlashSaleSection,
  new_arrivals: NewArrivalsSection,
  featured: FeaturedProducts,
  newsletter: NewsletterSection,
};

const Index = () => {
  const { sections } = useHomepageSections();

  const enabledSections = sections
    .filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <Layout>
      {enabledSections.map((section) => {
        const Component = sectionComponents[section.id];
        return Component ? <Component key={section.id} /> : null;
      })}
    </Layout>
  );
};

export default Index;
