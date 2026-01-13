import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, Search, Package, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import defaultLogo from '@/assets/logo.png';
import { SearchBar } from './SearchBar';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

const navLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/products', label: 'Sản phẩm' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Liên hệ' },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const [logo, setLogo] = useState(defaultLogo);
  const [shopName, setShopName] = useState({ first: 'Hibiki', second: 'Shop' });

  useEffect(() => {
    const fetchBranding = async () => {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['logo_url', 'site_name']);
      
      if (data) {
        data.forEach((item) => {
          if (item.key === 'logo_url' && item.value && typeof item.value === 'string') {
            setLogo(item.value);
          }
          if (item.key === 'site_name' && item.value && typeof item.value === 'string') {
            const name = item.value.trim();
            const parts = name.split(' ');
            if (parts.length >= 2) {
              setShopName({ first: parts[0], second: parts.slice(1).join(' ') });
            } else {
              setShopName({ first: name, second: '' });
            }
          }
        });
      }
    };
    fetchBranding();
  }, []);

  // Keyboard shortcut to open search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="container flex h-18 items-center justify-between lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={logo} 
              alt="Logo" 
              className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
            />
            <span className="font-display text-2xl font-bold tracking-tight hidden sm:block">
              <span className="text-foreground">{shopName.first}</span>
              {shopName.second && <span className="text-accent">{shopName.second}</span>}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 link-underline py-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Desktop Search Button */}
            <Button 
              variant="ghost" 
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 h-10 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Tìm kiếm</span>
              <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            {/* Mobile Search Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden hover:bg-accent/10 hover:text-accent transition-colors"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {user ? (
              <div className="flex items-center gap-1">
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="hidden sm:flex text-accent hover:bg-accent/10">
                      Admin
                    </Button>
                  </Link>
                )}
                <Link to="/wishlist" className="hidden sm:block relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-accent/10 hover:text-accent transition-colors"
                    title="Sản phẩm yêu thích"
                  >
                    <Heart className="h-5 w-5" />
                    {wishlistItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs font-bold flex items-center justify-center text-destructive-foreground shadow-md">
                        {wishlistItems.length}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link to="/orders" className="hidden sm:block">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-accent/10 hover:text-accent transition-colors"
                    title="Đơn hàng của tôi"
                  >
                    <Package className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="hover:bg-accent/10 hover:text-accent transition-colors"
                    title="Tài khoản"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="icon" className="hover:bg-accent/10 hover:text-accent transition-colors">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
            
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="hover:bg-accent/10 hover:text-accent transition-colors">
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-xs font-bold flex items-center justify-center text-accent-foreground shadow-md animate-scale-in">
                    {totalItems}
                  </span>
                )}
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-accent/10"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            'lg:hidden overflow-hidden transition-all duration-300 bg-card/95 backdrop-blur-xl border-t border-border/50',
            isOpen ? 'max-h-80' : 'max-h-0'
          )}
        >
          <nav className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 text-sm font-medium hover:bg-accent/10 hover:text-accent rounded-lg transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <Link
                  to="/wishlist"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 text-sm font-medium hover:bg-accent/10 hover:text-accent rounded-lg transition-all duration-200"
                >
                  Sản phẩm yêu thích
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 text-sm font-medium hover:bg-accent/10 hover:text-accent rounded-lg transition-all duration-200"
                >
                  Đơn hàng của tôi
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 text-sm font-medium hover:bg-accent/10 hover:text-accent rounded-lg transition-all duration-200"
                >
                  Tài khoản
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-accent hover:bg-accent/10 rounded-lg transition-all duration-200"
                  >
                    Quản trị
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Search Modal */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-2xl p-0 gap-0 bg-transparent border-0 shadow-none">
          <VisuallyHidden>
            <DialogTitle>Tìm kiếm sản phẩm</DialogTitle>
          </VisuallyHidden>
          <div className="bg-card rounded-2xl shadow-2xl border overflow-hidden">
            <SearchBar 
              isModal 
              onClose={() => setSearchOpen(false)} 
              className="w-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}