import DOMPurify from 'dompurify';

// Sanitize rich-text HTML (blog content, descriptions)
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}

// Sanitize map embeds (Google Maps iframe) — allow iframe only with safe attrs
export function sanitizeMapEmbed(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'loading', 'referrerpolicy'],
    ALLOWED_TAGS: ['iframe', 'div'],
    ALLOWED_ATTR: ['src', 'width', 'height', 'style', 'allow', 'allowfullscreen', 'frameborder', 'loading', 'referrerpolicy', 'title', 'class'],
    ALLOWED_URI_REGEXP: /^https:\/\/(www\.)?(google\.com|google\.[a-z.]+|maps\.google\.[a-z.]+)\//i,
  });
}
