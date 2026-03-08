import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { updatePageMeta, setJsonLd } from '@/lib/slugify';

const SITE_NAME = 'VSM Shop';
const SITE_URL = 'https://store.vsm.org.vn';
const DEFAULT_DESC = 'VSM Shop - Cửa hàng thời trang trực tuyến hàng đầu. Mua sắm quần áo, phụ kiện chất lượng cao với giá tốt nhất.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

// SEO config per route
const routeSEO: Record<string, { title: string; description: string }> = {
  '/': {
    title: `${SITE_NAME} - Cửa hàng thời trang trực tuyến`,
    description: DEFAULT_DESC,
  },
  '/products': {
    title: `Sản phẩm | ${SITE_NAME}`,
    description: 'Khám phá bộ sưu tập thời trang đa dạng với nhiều phong cách, màu sắc và kích thước tại VSM Shop.',
  },
  '/blog': {
    title: `Blog Thời Trang | ${SITE_NAME}`,
    description: 'Cập nhật xu hướng thời trang mới nhất, mẹo phối đồ và tin tức từ VSM Shop.',
  },
  '/contact': {
    title: `Liên hệ | ${SITE_NAME}`,
    description: 'Liên hệ với VSM Shop để được hỗ trợ mua hàng, đổi trả và giải đáp thắc mắc.',
  },
  '/cart': {
    title: `Giỏ hàng | ${SITE_NAME}`,
    description: 'Xem giỏ hàng và tiến hành thanh toán tại VSM Shop.',
  },
  '/wishlist': {
    title: `Yêu thích | ${SITE_NAME}`,
    description: 'Danh sách sản phẩm yêu thích của bạn tại VSM Shop.',
  },
  '/orders': {
    title: `Lịch sử đơn hàng | ${SITE_NAME}`,
    description: 'Theo dõi và quản lý đơn hàng của bạn tại VSM Shop.',
  },
  '/auth': {
    title: `Đăng nhập / Đăng ký | ${SITE_NAME}`,
    description: 'Đăng nhập hoặc tạo tài khoản VSM Shop để mua sắm và theo dõi đơn hàng.',
  },
  '/profile': {
    title: `Tài khoản | ${SITE_NAME}`,
    description: 'Quản lý thông tin tài khoản cá nhân tại VSM Shop.',
  },
  '/terms': {
    title: `Điều khoản sử dụng | ${SITE_NAME}`,
    description: 'Điều khoản và điều kiện sử dụng dịch vụ tại VSM Shop.',
  },
  '/privacy': {
    title: `Chính sách bảo mật | ${SITE_NAME}`,
    description: 'Chính sách bảo mật thông tin khách hàng tại VSM Shop.',
  },
  '/cookie': {
    title: `Chính sách Cookie | ${SITE_NAME}`,
    description: 'Chính sách sử dụng cookie tại VSM Shop.',
  },
};

/**
 * Resets and updates SEO meta tags on every route change.
 * Individual pages (ProductDetail, BlogDetail) can override after mount.
 */
export function SEOHead() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const seo = routeSEO[path];

    const title = seo?.title || `${SITE_NAME}`;
    const description = seo?.description || DEFAULT_DESC;

    updatePageMeta({
      title,
      description,
      image: DEFAULT_IMAGE,
      url: `${SITE_URL}${path}`,
      type: 'website',
    });

    // Reset JSON-LD to default WebSite schema on navigation
    setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      description: DEFAULT_DESC,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/products?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    });
  }, [location.pathname]);

  return null;
}
