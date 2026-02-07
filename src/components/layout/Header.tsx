import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Menu,
  X,
  User,
  Search,
  Package,
  Heart,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';

import { SearchBar } from './SearchBar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

import defaultLogo from '@/assets/logo.png';

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/products', label: 'Sản phẩm' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Liên hệ' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [logo, setLogo] = useState(defaultLogo);
  const [brand, setBrand] = useState({ first: 'VSM', second: 'STORE' });

  const { totalItems } = useCart();
  const { user, isAdmin } = useAuth();
  const { items: wishlist } = useWishlist();

  /* ------------------ BRANDING ------------------ */
  useEffect(() => {
    const loadBranding = async () => {
      const { data } = await supabase
        .from('settings')
        .select('key,value')
        .in('key', ['logo_url', 'site_name']);

      if (!data) return;

      data.forEach(item => {
        if (item.key === 'logo_url' && typeof item.value === 'string' && item.value.trim()) {
          setLogo(item.value);
        }
        if (item.key === 'site_name' && typeof item.value === 'string' && item.value.trim()) {
          const parts = item.value.trim().split(' ');
          setBrand({
            first: parts[0],
            second: parts.slice(1).join(' ') || '',
          });
        }
      });
    };

    loadBranding();
  }, []);

  /* ------------------ SEARCH HOTKEY ------------------ */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="container flex h-16 lg:h-20 items-center justify-between">

          {/* ---------- LOGO ---------- */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="VSM Store"
              className="h-11 w-auto transition-transform group-hover:scale-105"
            />
            <span className="hidden sm:block font-display text-xl font-extrabold tracking-tight">
              <span>{brand.first}</span>
              {brand.second && (
                <span className="text-accent ml-1">{brand.second}</span>
              )}
            </span>
          </Link>

          {/* ---------- DESKTOP NAV ---------- */}
          <nav className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="relative text-sm font-semibold text-muted-foreground hover:text-foreground transition after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 hover:after:w-full after:bg-accent after:transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ---------- ACTIONS ---------- */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Search */}
            <Button
              variant="ghost"
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 rounded-full"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Tìm kiếm</span>
              <kbd className="hidden lg:inline-flex ml-1 rounded border bg-muted px-1.5 text-[10px]">
                ⌘K
              </kbd>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="md:hidden"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Logged in */}
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" className="hidden sm:flex text-accent">
                      Admin
                    </Button>
                  </Link>
                )}

                <NotificationBell />

                <Link to="/wishlist" className="relative hidden sm:block">
                  <Button variant="ghost" size="icon">
                    <Heart className="w-5 h-5" />
                    {wishlist.length > 0 && (
                      <span className="badge">
                        {wishlist.length}
                      </span>
                    )}
                  </Button>
                </Link>

                <Link to="/orders" className="hidden sm:block">
                  <Button variant="ghost" size="icon">
                    <Package className="w-5 h-5" />
                  </Button>
                </Link>

                <Link to="/profile">
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="badge bg-accent text-accent-foreground">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile Menu */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMenuOpen(v => !v)}
            >
              {menuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* ---------- MOBILE MENU ---------- */}
        <div
          className={cn(
            'lg:hidden overflow-hidden transition-all duration-300 bg-card/95 backdrop-blur-xl border-t',
            menuOpen ? 'max-h-[420px]' : 'max-h-0'
          )}
        >
          <nav className="container py-4 space-y-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-accent/10 hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* ================= SEARCH MODAL ================= */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-2xl bg-transparent border-0 shadow-none p-0">
          <VisuallyHidden>
            <DialogTitle>Tìm kiếm</DialogTitle>
          </VisuallyHidden>
          <div className="bg-card rounded-2xl shadow-2xl border">
            <SearchBar isModal onClose={() => setSearchOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
