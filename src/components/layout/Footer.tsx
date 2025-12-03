import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-charcoal text-cream">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <h3 className="font-display text-2xl font-bold mb-4">
              Luxe<span className="text-accent">Shop</span>
            </h3>
            <p className="text-cream/70 text-sm leading-relaxed mb-6">
              Cửa hàng thời trang cao cấp với những sản phẩm được tuyển chọn kỹ lưỡng từ các thương hiệu hàng đầu.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-accent transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-accent transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Liên kết</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/products" className="text-cream/70 hover:text-accent transition-colors text-sm">
                  Sản phẩm
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-cream/70 hover:text-accent transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-cream/70 hover:text-accent transition-colors text-sm">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-cream/70 hover:text-accent transition-colors text-sm">
                  Về chúng tôi
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Chính sách</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-cream/70 hover:text-accent transition-colors text-sm">
                  Chính sách đổi trả
                </a>
              </li>
              <li>
                <a href="#" className="text-cream/70 hover:text-accent transition-colors text-sm">
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a href="#" className="text-cream/70 hover:text-accent transition-colors text-sm">
                  Điều khoản dịch vụ
                </a>
              </li>
              <li>
                <a href="#" className="text-cream/70 hover:text-accent transition-colors text-sm">
                  Hướng dẫn mua hàng
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">Liên hệ</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span className="text-cream/70">123 Nguyễn Huệ, Quận 1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="h-5 w-5 text-accent flex-shrink-0" />
                <span className="text-cream/70">0909 123 456</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="h-5 w-5 text-accent flex-shrink-0" />
                <span className="text-cream/70">contact@luxeshop.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cream/10 mt-12 pt-8 text-center text-sm text-cream/50">
          <p>&copy; {new Date().getFullYear()} LuxeShop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
