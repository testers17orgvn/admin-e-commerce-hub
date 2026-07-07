import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, Package, FolderOpen, Image, FileText, Mail, ShoppingCart, 
  Settings, LogOut, Users, Ticket, MessageSquare, Star, PackageCheck, ChevronRight,
  UserCheck, Truck, Menu, X, MessageCircle, BookOpen, LayoutTemplate
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminNotificationBell } from '@/components/notifications/AdminNotificationBell';
import { ScrollArea } from '@/components/ui/scroll-area';

const menuGroups = [
  {
    label: 'Tổng quan',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    label: 'Quản lý sản phẩm',
    items: [
      { href: '/admin/products', icon: Package, label: 'Sản phẩm' },
      { href: '/admin/categories', icon: FolderOpen, label: 'Danh mục' },
      { href: '/admin/seller-products', icon: PackageCheck, label: 'Duyệt SP Seller' },
      { href: '/admin/seller-requests', icon: UserCheck, label: 'Duyệt đăng ký Seller' },
    ]
  },
  {
    label: 'Bán hàng',
    items: [
      { href: '/admin/orders', icon: ShoppingCart, label: 'Đơn hàng' },
      { href: '/admin/shipper', icon: Truck, label: 'Quản lý giao hàng' },
      { href: '/admin/vouchers', icon: Ticket, label: 'Voucher' },
      { href: '/admin/reviews', icon: Star, label: 'Đánh giá' },
      { href: '/admin/chat', icon: MessageCircle, label: 'Chat' },
    ]
  },
  {
    label: 'Nội dung',
    items: [
      { href: '/admin/banners', icon: Image, label: 'Banner' },
      { href: '/admin/blogs', icon: FileText, label: 'Blog' },
      { href: '/admin/homepage', icon: Image, label: 'Trang chủ' },
    ]
  },
  {
    label: 'Hệ thống',
    items: [
      { href: '/admin/users', icon: Users, label: 'Người dùng' },
      { href: '/admin/contacts', icon: Mail, label: 'Liên hệ' },
      { href: '/admin/contact-settings', icon: MessageSquare, label: 'Cài đặt liên hệ' },
      { href: '/admin/guides', icon: BookOpen, label: 'Hướng dẫn role' },
      { href: '/admin/settings', icon: Settings, label: 'Cài đặt' },
    ]
  },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, loading, navigate]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-sm">L</span>
            </div>
            <span>VSM<span className="text-accent"> Shop </span></span>
          </Link>
          <div className="flex items-center gap-1">
            <AdminNotificationBell />
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Admin Panel
        </p>
      </div>
      
      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-2.5 space-y-1">
          {menuGroups.map((group, index) => (
            <div key={index} className="pb-2">
              {index > 0 && <div className="mx-3 my-2 h-px bg-border/60" />}
              <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.12em]">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                        isActive
                          ? 'bg-accent text-accent-foreground shadow-sm font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-accent-foreground')} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>


      {/* Footer */}
      <div className="p-3 border-t flex-shrink-0 bg-card">
        <div className="p-3 rounded-lg bg-muted/50 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-accent font-semibold text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Đăng xuất
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b z-50 flex items-center justify-between px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/" className="font-display text-lg font-bold flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-xs">L</span>
          </div>
          <span>VSM<span className="text-accent"> Shop</span></span>
        </Link>
        <AdminNotificationBell />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setSidebarOpen(false)}>
          <aside className="fixed left-0 top-0 h-full w-72 bg-card z-50 flex flex-col animate-in slide-in-from-left duration-200" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-card border-r z-40 flex-col">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-14 lg:pt-0">
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
