import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/products', label: 'Sản phẩm' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Liên hệ' },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex h-16 items-center justify-between lg:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold tracking-tight">
            Luxe<span className="text-accent">Shop</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors link-underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
          </Button>
          <Link to="/auth">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-xs font-medium flex items-center justify-center text-accent-foreground">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 border-t border-border',
          isOpen ? 'max-h-64' : 'max-h-0'
        )}
      >
        <nav className="container py-4 flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
