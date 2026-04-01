import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { useHomepageSections } from '@/hooks/useHomepageSections';

const sectionComponents: Record<string, React.ComponentType> = {
  hero: HeroSection,
  featured: FeaturedProducts,
  categories: CategoriesSection,
  newsletter: NewsletterSection,
};

const Index = () => {
  const { sections, loading } = useHomepageSections();

  // Get enabled sections sorted by order
  const enabledSections = sections
    .filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <Layout>
      {loading ? (
        // Show default order while loading
        <>
          <HeroSection />
          <CategoriesSection />
          <FeaturedProducts />
          <NewsletterSection />
        </>
      ) : (
        // Render sections in configured order
        enabledSections.map((section) => {
          const Component = sectionComponents[section.id];
          return Component ? <Component key={section.id} /> : null;
        })
      )}
    </Layout>
  );
};

export default Index;
