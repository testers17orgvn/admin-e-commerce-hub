/**
 * Advanced Vietnamese slug generator with SEO optimization
 */

const VIETNAMESE_MAP: Record<string, string> = {
  'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
  'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
  'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
  'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
  'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
  'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
  'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
  'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
  'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
  'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
  'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
  'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
  'đ': 'd',
};

export function generateSlug(text: string, fallback = 'item'): string {
  if (!text.trim()) return fallback;
  
  let result = text
    .toLowerCase()
    .split('')
    .map(char => VIETNAMESE_MAP[char] || char)
    .join('');
  
  // Remove special chars, replace spaces/consecutive dashes
  result = result
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // Truncate for SEO (max ~80 chars)
  if (result.length > 80) {
    result = result.substring(0, 80).replace(/-[^-]*$/, '');
  }
  
  return result || fallback;
}

/**
 * Update document head meta tags dynamically for SPA SEO
 */
export function updatePageMeta(options: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}) {
  const { title, description, image, url, type = 'website' } = options;
  
  if (title) {
    document.title = title;
    setMeta('og:title', title);
    setMeta('twitter:title', title);
  }
  if (description) {
    setMeta('description', description, 'name');
    setMeta('og:description', description);
    setMeta('twitter:description', description);
  }
  if (image) {
    setMeta('og:image', image);
    setMeta('twitter:image', image);
  }
  if (url) {
    setMeta('og:url', url);
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }
  setMeta('og:type', type);
}

function setMeta(key: string, value: string, attr: 'property' | 'name' = 'property') {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`) 
    || document.querySelector<HTMLMetaElement>(`meta[property="${key}"]`)
    || document.querySelector<HTMLMetaElement>(`meta[name="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

/**
 * Generate JSON-LD structured data
 */
export function setJsonLd(data: Record<string, unknown>) {
  let script = document.querySelector<HTMLScriptElement>('script[data-seo="jsonld"]');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.seo = 'jsonld';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}
