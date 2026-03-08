import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, ShoppingCart, Trash2, Package, UserCheck, Truck, Star, MessageSquare, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { haptic } from '@/lib/haptics';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export function AdminNotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (data) {
      setNotifications(data);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (user) {
      const notificationChannel = supabase
        .channel('admin-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const n = payload.new as Notification;
            setNotifications((prev) => [n, ...prev.slice(0, 29)]);

            // Role-aware toast notifications
            const isOrder = n.type === 'order';
            const isSeller = n.type === 'seller' || n.type === 'product';
            const isShipper = n.title.includes('shipper') || n.title.includes('giao') || n.title.includes('🚚');

            if (isOrder) {
              haptic('medium');
              toast(n.title, {
                description: n.message,
                action: n.link ? {
                  label: 'Xem ngay',
                  onClick: () => window.location.href = n.link!,
                } : undefined,
                duration: 6000,
              });
            } else if (isSeller) {
              haptic('light');
              toast(n.title, {
                description: n.message,
                action: n.link ? {
                  label: 'Chi tiết',
                  onClick: () => window.location.href = n.link!,
                } : undefined,
                duration: 5000,
              });
            } else if (isShipper) {
              haptic('success');
              toast(n.title, {
                description: n.message,
                action: n.link ? {
                  label: 'Theo dõi',
                  onClick: () => window.location.href = n.link!,
                } : undefined,
                duration: 8000,
              });
            } else {
              haptic('light');
              toast(n.title, { description: n.message, duration: 4000 });
            }
          }
        )
        .subscribe();

      const orderChannel = supabase
        .channel('admin-new-orders')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationChannel);
        supabase.removeChannel(orderChannel);
      };
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getTypeIcon = (type: string, title: string) => {
    // Shipper-related
    if (title.includes('🚚') || title.includes('🚗') || title.includes('📍') || title.includes('shipper')) {
      return <Truck className="h-4 w-4" />;
    }
    if (title.includes('⭐') || title.includes('đánh giá')) {
      return <Star className="h-4 w-4" />;
    }
    if (title.includes('✅') || title.includes('duyệt') || title.includes('Đăng ký')) {
      return <UserCheck className="h-4 w-4" />;
    }
    if (title.includes('❌') || title.includes('từ chối')) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4" />;
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'seller':
        return <UserCheck className="h-4 w-4" />;
      case 'contact':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeStyles = (type: string, title: string) => {
    if (title.includes('🚚') || title.includes('🚗') || title.includes('📍')) {
      return 'bg-blue-500/10 text-blue-600';
    }
    if (title.includes('✅') || title.includes('duyệt')) {
      return 'bg-emerald-500/10 text-emerald-600';
    }
    if (title.includes('❌') || title.includes('từ chối') || title.includes('thất bại')) {
      return 'bg-destructive/10 text-destructive';
    }
    switch (type) {
      case 'order':
        return 'bg-green-500/10 text-green-600';
      case 'product':
        return 'bg-purple-500/10 text-purple-600';
      case 'seller':
        return 'bg-amber-500/10 text-amber-600';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-600';
      default:
        return 'bg-primary/10 text-primary';
    }
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-accent/10 hover:text-accent transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs font-bold flex items-center justify-center text-destructive-foreground shadow-md animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Thông báo Admin</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} mới
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3" />
              Đọc tất cả
            </Button>
          )}
        </div>

        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Chưa có thông báo</p>
              <p className="text-xs mt-1">Thông báo đơn hàng mới sẽ hiển thị ở đây</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-muted/50 transition-colors relative group',
                    !notification.is_read && 'bg-accent/5 border-l-2 border-l-accent'
                  )}
                >
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                        getTypeStyles(notification.type, notification.title)
                      )}
                    >
                      {getTypeIcon(notification.type, notification.title)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notification.created_at), "dd/MM/yyyy 'lúc' HH:mm", {
                          locale: vi,
                        })}
                      </p>
                    </div>
                  </div>
                  {notification.link && (
                    <Link
                      to={notification.link}
                      className="absolute inset-0"
                      onClick={() => {
                        markAsRead(notification.id);
                        setOpen(false);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t bg-muted/30">
          <Link to="/admin/orders" onClick={() => setOpen(false)}>
            <Button variant="outline" className="w-full text-sm gap-2">
              <ShoppingCart className="h-4 w-4" />
              Xem tất cả đơn hàng
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
