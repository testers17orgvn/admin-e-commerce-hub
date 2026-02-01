import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Facebook,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Send,
} from 'lucide-react';

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
      if (!data) return;

      const map: FooterSettings = {};
      data.forEach((item: { key: string; value: unknown }) => {
        map[item.key as keyof FooterSettings] = item.value as string;
      });

      setSettings(map);
    };

    fetchSettings();
  }, []);

  const socialLinks = [
    { Icon: Facebook, url: settings.facebook_url },
    { Icon: Instagram, url: settings.instagram_url },
    { Icon: Youtube, url: '#' },
  ].filter(item => item.url);

  return (
    <footer className="relative bg-charcoal text-cream overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="container relative z-10 py-14 lg:py-20">
        {/* Main grid */}
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img
                src={logo}
                alt={settings.site_name || 'Logo'}
                className="h-12 w-auto brightness-0 invert"
              />
              {settings.site_name && (
                <span className="font-display text-2xl font-bold">
                  {settings.site_name}
                </span>
              )}
            </Link>

            {settings.site_description && (
              <p className="text-sm text-cream/60 max-w-xs mb-5">
                {settings.site_description}
              </p>
            )}

            <div className="flex gap-3">
              {socialLinks.map(({ Icon, url }, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center hover:bg-accent hover:text-charcoal transition"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-5">
              Liên kết nhanh
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { to: '/products', label: 'Sản phẩm' },
                { to: '/blog', label: 'Blog' },
                { to: '/contact', label: 'Liên hệ' },
                { to: '/profile', label: 'Tài khoản' },
              ].map(link => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-cream/60 hover:text-accent transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-5">
              Thông tin liên hệ
            </h4>
            <ul className="space-y-4 text-sm text-cream/60">
              {settings.contact_address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <span>{settings.contact_address}</span>
                </li>
              )}
              {settings.contact_phone && (
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-accent shrink-0" />
                  <span>{settings.contact_phone}</span>
                </li>
              )}
              {settings.contact_email && (
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-accent shrink-0" />
                  <span>{settings.contact_email}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="rounded-2xl bg-cream/5 backdrop-blur border border-cream/10 p-6">
            <h4 className="font-display text-lg font-semibold mb-3">
              Nhận ưu đãi mới
            </h4>
            <p className="text-sm text-cream/60 mb-4">
              Đăng ký để không bỏ lỡ sản phẩm và khuyến mãi.
            </p>

            <div className="flex gap-2">
              <Input
                placeholder="Email của bạn"
                className="bg-cream/10 border-cream/20 text-cream placeholder:text-cream/40 focus:border-accent"
              />
              <Button
                size="icon"
                className="bg-accent hover:bg-accent/90 text-charcoal shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-6 border-t border-cream/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-cream/40">
          <p>
            {settings.footer_text ||
              `© ${new Date().getFullYear()} All rights reserved.`}
          </p>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-accent transition">
              Điều khoản
            </Link>
            <Link to="/privacy" className="hover:text-accent transition">
              Bảo mật
            </Link>
            <Link to="/cookie" className="hover:text-accent transition">
              Cookie
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
