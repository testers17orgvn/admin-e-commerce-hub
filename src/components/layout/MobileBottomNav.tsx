import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingCart, MessageCircle, User } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', label: 'Trang chủ', icon: Home },
  { to: '/products', label: 'Sản phẩm', icon: LayoutGrid },
  { to: '/cart', label: 'Giỏ hàng', icon: ShoppingCart, cart: true },
  { to: '/chat', label: 'Tin nhắn', icon: MessageCircle },
  { to: '/profile', label: 'Tôi', icon: User },
];

export function MobileBottomNav() {
  const { items: cartItems } = useCart();
  const location = useLocation();
  const cartCount = cartItems.reduce((n, i) => n + i.quantity, 0);

  // Hide on admin/seller/shipper dashboards
  if (/^\/(admin|seller|shipper)(\/|$)/.test(location.pathname)) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border mobile-bottom-nav"
      aria-label="Điều hướng mobile"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, cart }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                  'min-h-[56px]',
                  isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {cart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className="truncate max-w-full">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
