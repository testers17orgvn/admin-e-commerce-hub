import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

interface FooterSettings {
  site_name?: string;
  site_description?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  facebook_url?: string;
  instagram_url?: string;
  footer_text?: string;
}

export function Footer() {
  const [settings, setSettings] = useState<FooterSettings>({});

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const settingsMap: FooterSettings = {};
        data.forEach((item: { key: string; value: unknown }) => {
          settingsMap[item.key as keyof FooterSettings] = item.value as string;
        });
        setSettings(settingsMap);
      }
    };
    fetchSettings();
  }, []);

  const socialLinks = [
    { Icon: Facebook, url: settings.facebook_url },
    { Icon: Instagram, url: settings.instagram_url },
    { Icon: Youtube, url: '#' },
  ].filter(s => s.url);

  return (
    <footer className="bg-charcoal text-cream relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
              <img 
                src={logo} 
                alt={settings.site_name || 'Hibiki'} 
                className="h-14 w-auto object-contain filter brightness-0 invert transition-transform duration-300 group-hover:scale-105" 
              />
              <span className="font-display text-2xl font-bold">
                {settings.site_name || 'Hibiki'}<span className="text-accent">Shop</span>
              </span>
            </Link>
            <p className="text-cream/60 text-sm leading-relaxed mb-6 max-w-xs">
              {settings.site_description || 'Cửa hàng thời trang cao cấp với những sản phẩm được tuyển chọn kỹ lưỡng từ các thương hiệu hàng đầu.'}
            </p>
            <div className="flex gap-3">
              {socialLinks.length > 0 ? (
                socialLinks.map(({ Icon, url }, i) => (
                  <a 
                    key={i}
                    href={url || '#'} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-accent hover:text-charcoal transition-all duration-300"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))
              ) : (
                [Facebook, Instagram, Youtube].map((Icon, i) => (
                  <a 
                    key={i}
                    href="#" 
                    className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-accent hover:text-charcoal transition-all duration-300"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-6 text-lg relative inline-block">
              Liên kết
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-accent" />
            </h4>
            <ul className="space-y-4">
              {[
                { to: '/products', label: 'Sản phẩm' },
                { to: '/blog', label: 'Blog' },
                { to: '/contact', label: 'Liên hệ' },
                { to: '/profile', label: 'Tài khoản' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-cream/60 hover:text-accent transition-colors text-sm inline-flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-accent transition-all duration-300" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-6 text-lg relative inline-block">
              Liên hệ
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-accent" />
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm group">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 transition-colors">
                  <MapPin className="h-4 w-4 text-accent" />
                </div>
                <span className="text-cream/60 pt-1">{settings.contact_address || '123 Nguyễn Huệ, Quận 1, TP.HCM'}</span>
              </li>
              <li className="flex items-center gap-3 text-sm group">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 transition-colors">
                  <Phone className="h-4 w-4 text-accent" />
                </div>
                <span className="text-cream/60">{settings.contact_phone || '0909 123 456'}</span>
              </li>
              <li className="flex items-center gap-3 text-sm group">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/30 transition-colors">
                  <Mail className="h-4 w-4 text-accent" />
                </div>
                <span className="text-cream/60">{settings.contact_email || 'contact@hibiki.vn'}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-display font-semibold mb-6 text-lg relative inline-block">
              Đăng ký nhận tin
              <span className="absolute -bottom-2 left-0 w-8 h-0.5 bg-accent" />
            </h4>
            <p className="text-cream/60 text-sm mb-4">
              Nhận thông tin về sản phẩm mới và ưu đãi độc quyền.
            </p>
            <div className="flex gap-2">
              <Input 
                placeholder="Email của bạn" 
                className="bg-cream/10 border-cream/20 text-cream placeholder:text-cream/40 focus:border-accent"
              />
              <Button size="icon" className="bg-accent hover:bg-accent/90 text-charcoal flex-shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-cream/10 mt-12 lg:mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-cream/40">
          <p>{settings.footer_text || `© ${new Date().getFullYear()} HibikiShop. All rights reserved.`}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-accent transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-accent transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-accent transition-colors">Cookie</a>
          </div>
        </div>
      </div>
    </footer>
  );
}