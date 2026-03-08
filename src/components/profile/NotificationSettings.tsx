import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Mail, Package, Tag, Sparkles, Save, MessageSquare, Truck, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface NotificationSettingsData {
  order_updates: boolean;
  promotions: boolean;
  new_products: boolean;
  email_notifications: boolean;
  new_contacts: boolean;
}

interface NotificationOption {
  key: keyof NotificationSettingsData;
  title: string;
  description: string;
  icon: React.ElementType;
  roles: string[]; // empty = all roles
}

const allNotificationTypes: NotificationOption[] = [
  {
    key: 'order_updates',
    title: 'Cập nhật đơn hàng',
    description: 'Nhận thông báo khi đơn hàng được xác nhận, đang giao hoặc đã giao',
    icon: Package,
    roles: [],
  },
  {
    key: 'new_contacts',
    title: 'Liên hệ mới',
    description: 'Nhận thông báo khi có khách hàng gửi form liên hệ',
    icon: MessageSquare,
    roles: ['admin'],
  },
  {
    key: 'promotions',
    title: 'Khuyến mãi',
    description: 'Nhận thông báo về các chương trình khuyến mãi và voucher',
    icon: Tag,
    roles: [],
  },
  {
    key: 'new_products',
    title: 'Sản phẩm mới',
    description: 'Nhận thông báo khi có sản phẩm mới hoặc sản phẩm cần duyệt',
    icon: Sparkles,
    roles: [],
  },
  {
    key: 'email_notifications',
    title: 'Thông báo qua Email',
    description: 'Nhận các thông báo quan trọng qua email',
    icon: Mail,
    roles: [],
  },
];

export function NotificationSettings() {
  const { user, isAdmin } = useAuth();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [settings, setSettings] = useState<NotificationSettingsData>({
    order_updates: true,
    promotions: true,
    new_products: true,
    email_notifications: true,
    new_contacts: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [settingsRes, rolesRes] = await Promise.all([
        supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        isAdmin
          ? Promise.resolve({ data: [{ role: 'admin' }] })
          : supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id),
      ]);

      if (settingsRes.data) {
        setSettings({
          order_updates: settingsRes.data.order_updates ?? true,
          promotions: settingsRes.data.promotions ?? true,
          new_products: settingsRes.data.new_products ?? true,
          email_notifications: settingsRes.data.email_notifications ?? true,
          new_contacts: (settingsRes.data as any).new_contacts ?? true,
        });
      }

      if (rolesRes.data) {
        setUserRoles(rolesRes.data.map((r: any) => r.role));
      }

      setLoading(false);
    };

    fetchData();
  }, [user, isAdmin]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('notification_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const payload: any = {
        order_updates: settings.order_updates,
        promotions: settings.promotions,
        new_products: settings.new_products,
        email_notifications: settings.email_notifications,
        new_contacts: settings.new_contacts,
      };

      if (existing) {
        await supabase
          .from('notification_settings')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      } else {
        await supabase.from('notification_settings').insert({
          user_id: user.id,
          ...payload,
        });
      }

      toast.success('Đã lưu cài đặt thông báo');
    } catch (error) {
      toast.error('Lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: keyof NotificationSettingsData) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return <div className="p-4 text-center">Đang tải...</div>;
  }

  // Filter notification types based on user roles
  const visibleTypes = allNotificationTypes.filter((type) => {
    if (type.roles.length === 0) return true;
    return type.roles.some((r) => userRoles.includes(r) || (r === 'admin' && isAdmin));
  });

  const getRoleLabel = () => {
    if (isAdmin) return 'Quản trị viên';
    if (userRoles.includes('seller')) return 'Người bán';
    if (userRoles.includes('shipper')) return 'Shipper';
    if (userRoles.includes('dealer')) return 'Đại lý';
    return 'Khách hàng';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Cài đặt thông báo
        </CardTitle>
        <CardDescription>
          Tùy chỉnh các loại thông báo bạn muốn nhận ({getRoleLabel()})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {visibleTypes.map(({ key, title, description, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <Label htmlFor={key} className="font-medium cursor-pointer">
                  {title}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
            </div>
            <Switch
              id={key}
              checked={settings[key]}
              onCheckedChange={() => toggleSetting(key)}
            />
          </div>
        ))}

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </Button>
      </CardContent>
    </Card>
  );
}
