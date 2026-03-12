import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  Search,
  Package,
  Heart,
  Home,
  ShoppingCart,
  BookOpen,
  Phone,
  Shield,
  ChevronRight,
  Sparkles,
  LogOut,
  Settings,
  Store,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { supabase } from '@/integrations/supabase/client';

import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';

import { SearchBar } from './SearchBar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

import defaultLogo from '@/assets/logo.png';

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/products', label: 'Sản phẩm', icon: ShoppingCart },
  { href: '/blog', label: 'Blog', icon: BookOpen },
  { href: '/contact', label: 'Liên hệ', icon: Phone },
];

const USER_LINKS = [
  { href: '/profile', label: 'Tài khoản', icon: User },
  { href: '/orders', label: 'Đơn hàng', icon: Package },
  { href: '/wishlist', label: 'Yêu thích', icon: Heart },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [logo, setLogo] = useState(defaultLogo);
  const [brand, setBrand] = useState({ first: '', second: '' });
  const [scrolled, setScrolled] = useState(false);

  const { totalItems } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const { items: wishlist } = useWishlist();
  const location = useLocation();

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* BRANDING */
  useEffect(() => {
    const loadBranding = async () => {
      const { data } = await supabase
        .from('settings')
        .select('key,value')
        .in('key', ['logo_url', 'site_name']);
      if (!data) return;
      data.forEach(item => {
        if (item.key === 'logo_url' && typeof item.value === 'string' && item.value.trim()) setLogo(item.value);
        if (item.key === 'site_name' && typeof item.value === 'string' && item.value.trim()) {
          const parts = item.value.trim().split(' ');
          setBrand({ first: parts[0], second: parts.slice(1).join(' ') || '' });
        }
      });
    };
    loadBranding();
  }, []);

  /* SEARCH HOTKEY */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSignOut = useCallback(async () => {
    setMenuOpen(false);
    await signOut();
  }, [signOut]);

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-background/95 backdrop-blur-2xl shadow-[var(--shadow-md)] border-b border-border/40"
          : "bg-background/80 backdrop-blur-xl border-b border-border/60"
      )}>
        <div className="container flex h-14 sm:h-16 lg:h-20 items-center justify-between">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2.5 group relative z-[60]">
            <div className="relative">
              <img
                src={logo}
                alt="VSM Store"
                className="h-9 sm:h-11 w-auto transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
              />
              <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <span className="hidden sm:block font-display text-xl font-extrabold tracking-tight">
              <span>{brand.first}</span>
              {brand.second && <span className="text-accent ml-1">{brand.second}</span>}
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "relative text-sm font-semibold transition-all duration-300",
                  "after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:bg-accent after:transition-all after:duration-500",
                  isActive(link.href)
                    ? "text-accent after:w-full"
                    : "text-muted-foreground hover:text-foreground after:w-0 hover:after:w-full"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ACTIONS */}
          <div className="flex items-center gap-0.5 sm:gap-1.5">
            {/* Search Desktop */}
            <Button
              variant="ghost"
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 rounded-full"
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Tìm kiếm</span>
              <kbd className="hidden lg:inline-flex ml-1 rounded border bg-muted px-1.5 text-[10px]">⌘K</kbd>
            </Button>

            {/* Search Mobile */}
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="md:hidden h-9 w-9">
              <Search className="w-[18px] h-[18px]" />
            </Button>

            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="hidden sm:block">
                    <Button variant="ghost" className="text-accent text-xs px-2">Admin</Button>
                  </Link>
                )}
                <div className="hidden sm:block"><NotificationBell /></div>
                <Link to="/wishlist" className="relative hidden sm:block">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Heart className="w-[18px] h-[18px]" />
                    {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
                  </Button>
                </Link>
                <Link to="/orders" className="hidden sm:block">
                  <Button variant="ghost" size="icon" className="h-9 w-9"><Package className="w-[18px] h-[18px]" /></Button>
                </Link>
                <Link to="/profile" className="hidden sm:block">
                  <Button variant="ghost" size="icon" className="h-9 w-9"><User className="w-[18px] h-[18px]" /></Button>
                </Link>
              </>
            ) : (
              <Link to="/auth" className="hidden sm:block">
                <Button variant="ghost" size="icon" className="h-9 w-9"><User className="w-[18px] h-[18px]" /></Button>
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ShoppingBag className="w-[18px] h-[18px]" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-scale-in">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* Hamburger Button */}
            <button
              onClick={() => { haptic('medium'); setMenuOpen(v => !v); }}
              className="lg:hidden relative z-[60] w-10 h-10 flex items-center justify-center rounded-xl transition-colors duration-300 hover:bg-muted tap-ripple"
              aria-label="Menu"
            >
              <div className="w-5 h-4 relative flex flex-col justify-between">
                <span className={cn(
                  "block h-[2px] w-full bg-foreground rounded-full transition-all duration-500 origin-center",
                  menuOpen && "rotate-45 translate-y-[7px]"
                )} />
                <span className={cn(
                  "block h-[2px] w-full bg-foreground rounded-full transition-all duration-300",
                  menuOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
                )} />
                <span className={cn(
                  "block h-[2px] w-full bg-foreground rounded-full transition-all duration-500 origin-center",
                  menuOpen && "-rotate-45 -translate-y-[7px]"
                )} />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MOBILE FULLSCREEN MENU ================= */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden transition-all duration-500",
        menuOpen ? "pointer-events-auto" : "pointer-events-none"
      )}>
        {/* Backdrop */}
        <div className={cn(
          "absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-500",
          menuOpen ? "opacity-100" : "opacity-0"
        )} onClick={() => setMenuOpen(false)} />

        {/* Menu Panel - slides from right */}
        <div className={cn(
          "absolute top-0 right-0 h-full w-[85%] max-w-[380px] bg-background/98 backdrop-blur-2xl shadow-2xl",
          "flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "border-l border-border/30",
          menuOpen ? "translate-x-0" : "translate-x-full"
        )}>
          {/* Menu Header */}
          <div className="px-6 pt-16 pb-4 border-b border-border/30">
            <div className={cn(
              "flex items-center gap-3 transition-all duration-700 delay-200",
              menuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            )}>
              <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-display font-bold text-sm">{brand.first} {brand.second}</p>
                <p className="text-[11px] text-muted-foreground">
                  {user ? `Xin chào! 👋` : 'Chào mừng bạn'}
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {/* Navigation */}
            <div className="px-4 py-4">
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 px-2 mb-2 transition-all duration-500 delay-100",
                menuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
              )}>
                Điều hướng
              </p>
              <nav className="space-y-0.5">
                {NAV_LINKS.map((link, i) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "group flex items-center gap-3.5 px-3 py-3 rounded-2xl transition-all duration-300",
                      isActive(link.href)
                        ? "bg-accent/10 text-accent"
                        : "text-foreground hover:bg-muted/60 active:scale-[0.98]",
                      // Stagger animation
                      "transition-all duration-500",
                      menuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10",
                    )}
                    style={{ transitionDelay: menuOpen ? `${200 + i * 60}ms` : '0ms' }}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                      isActive(link.href)
                        ? "bg-accent text-accent-foreground shadow-[var(--shadow-gold)]"
                        : "bg-muted/80 text-muted-foreground group-hover:bg-accent/20 group-hover:text-accent"
                    )}>
                      <link.icon className="w-[18px] h-[18px]" />
                    </div>
                    <span className="flex-1 font-semibold text-[13px]">{link.label}</span>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-muted-foreground/40 transition-all duration-300",
                      "group-hover:text-accent group-hover:translate-x-0.5"
                    )} />
                  </Link>
                ))}
              </nav>
            </div>

            {/* User Section */}
            {user && (
              <div className="px-4 pb-4">
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 px-2 mb-2 transition-all duration-500 delay-300",
                  menuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
                )}>
                  Tài khoản
                </p>
                <nav className="space-y-0.5">
                  {USER_LINKS.map((link, i) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "group flex items-center gap-3.5 px-3 py-3 rounded-2xl transition-all duration-300",
                        isActive(link.href)
                          ? "bg-accent/10 text-accent"
                          : "text-foreground hover:bg-muted/60 active:scale-[0.98]",
                        "transition-all duration-500",
                        menuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10",
                      )}
                      style={{ transitionDelay: menuOpen ? `${450 + i * 60}ms` : '0ms' }}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                        isActive(link.href)
                          ? "bg-accent text-accent-foreground shadow-[var(--shadow-gold)]"
                          : "bg-muted/80 text-muted-foreground group-hover:bg-accent/20 group-hover:text-accent"
                      )}>
                        <link.icon className="w-[18px] h-[18px]" />
                        {link.href === '/wishlist' && wishlist.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {wishlist.length}
                          </span>
                        )}
                      </div>
                      <span className="flex-1 font-semibold text-[13px]">{link.label}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-300" />
                    </Link>
                  ))}

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "group flex items-center gap-3.5 px-3 py-3 rounded-2xl transition-all duration-500",
                        menuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10",
                      )}
                      style={{ transitionDelay: menuOpen ? '650ms' : '0ms' }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                        <Shield className="w-[18px] h-[18px] text-accent" />
                      </div>
                      <span className="flex-1 font-semibold text-[13px]">Quản trị</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-300" />
                    </Link>
                  )}
                </nav>
              </div>
            )}

            {/* Quick Actions */}
            <div className="px-4 pb-4">
              <div className={cn(
                "grid grid-cols-3 gap-2 transition-all duration-500",
                menuOpen ? "opacity-100 translate-y-0 delay-500" : "opacity-0 translate-y-4"
              )} style={{ transitionDelay: menuOpen ? '600ms' : '0ms' }}>
                <Link
                  to="/cart"
                  onClick={() => setMenuOpen(false)}
                  className="relative flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-muted/50 hover:bg-accent/10 transition-all duration-300 active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                    <ShoppingBag className="w-[18px] h-[18px]" />
                  </div>
                  <span className="text-[11px] font-medium">Giỏ hàng</span>
                  {totalItems > 0 && (
                    <span className="absolute top-2 right-2 bg-accent text-accent-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setMenuOpen(false)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-muted/50 hover:bg-accent/10 transition-all duration-300 active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                    <Heart className="w-[18px] h-[18px]" />
                  </div>
                  <span className="text-[11px] font-medium">Yêu thích</span>
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); setSearchOpen(true); }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-muted/50 hover:bg-accent/10 transition-all duration-300 active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                    <Search className="w-[18px] h-[18px]" />
                  </div>
                  <span className="text-[11px] font-medium">Tìm kiếm</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className={cn(
            "px-4 py-4 border-t border-border/30 space-y-2 transition-all duration-500",
            menuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )} style={{ transitionDelay: menuOpen ? '700ms' : '0ms' }}>
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-300 active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-[13px] font-medium">Đăng xuất</span>
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl bg-accent text-accent-foreground font-semibold text-sm transition-all duration-300 hover:opacity-90 active:scale-[0.98] shadow-[var(--shadow-gold)]"
              >
                <User className="w-4 h-4" />
                Đăng nhập / Đăng ký
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ================= SEARCH MODAL ================= */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-2xl bg-transparent border-0 shadow-none p-0">
          <VisuallyHidden><DialogTitle>Tìm kiếm</DialogTitle></VisuallyHidden>
          <div className="bg-card rounded-2xl shadow-2xl border">
            <SearchBar isModal onClose={() => setSearchOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="bg-background/95 backdrop-blur-2xl border-t border-border/40 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-around px-2 py-1.5 max-w-md mx-auto">
            {[
              { href: '/', icon: Home, label: 'Home' },
              { href: '/products', icon: Store, label: 'Shop' },
              { href: '/cart', icon: ShoppingBag, label: 'Giỏ', badge: totalItems },
              { href: '/wishlist', icon: Heart, label: 'Thích', badge: wishlist.length },
              { href: user ? '/profile' : '/auth', icon: User, label: 'Tôi' },
            ].map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => haptic('selection')}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 tap-bounce",
                  isActive(item.href)
                    ? "text-accent"
                    : "text-muted-foreground active:scale-90"
                )}
              >
                <div className="relative">
                  <item.icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive(item.href) && "scale-110"
                  )} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-accent text-accent-foreground text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive(item.href) && (
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-accent" />
                )}
              </Link>
            ))}
          </div>
          {/* Safe area bottom */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </>
  );
}
