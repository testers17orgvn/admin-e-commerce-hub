import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HomepageSection {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

const defaultSections: HomepageSection[] = [
  { id: 'hero', name: 'Hero Banner', enabled: true, order: 0 },
  { id: 'featured', name: 'Sản phẩm nổi bật', enabled: true, order: 1 },
  { id: 'categories', name: 'Danh mục sản phẩm', enabled: true, order: 2 },
  { id: 'newsletter', name: 'Đăng ký nhận tin', enabled: true, order: 3 },
];

export function useHomepageSections() {
  const [sections, setSections] = useState<HomepageSection[]>(defaultSections);
  const [loading, setLoading] = useState(true);

  const fetchSections = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'homepage_sections')
        .maybeSingle();

      if (data?.value && Array.isArray(data.value)) {
        const savedSections = data.value as unknown as HomepageSection[];
        // Merge with defaults to ensure new sections are included
        const mergedSections = defaultSections.map((defaultSection) => {
          const saved = savedSections.find((s) => s.id === defaultSection.id);
          return saved || defaultSection;
        });
        // Sort by order
        mergedSections.sort((a, b) => a.order - b.order);
        setSections(mergedSections);
      }
    } catch (error) {
      console.error('Error fetching homepage sections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const saveSections = async (newSections: HomepageSection[]) => {
    try {
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'homepage_sections')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('settings')
          .update({ value: newSections as never })
          .eq('key', 'homepage_sections');
      } else {
        await supabase
          .from('settings')
          .insert([{ key: 'homepage_sections', value: newSections as never }]);
      }
      setSections(newSections);
      return true;
    } catch (error) {
      console.error('Error saving homepage sections:', error);
      return false;
    }
  };

  const updateSections = (newSections: HomepageSection[]) => {
    setSections(newSections);
  };

  return { sections, loading, saveSections, updateSections, refetch: fetchSections };
}
