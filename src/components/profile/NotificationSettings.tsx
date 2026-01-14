import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Mail, Package, Tag, Sparkles, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface NotificationSettingsData {
  order_updates: boolean;
  promotions: boolean;
  new_products: boolean;
  email_notifications: boolean;
}

export function NotificationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettingsData>({
    order_updates: true,
    promotions: true,
    new_products: true,
    email_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setSettings({
          order_updates: data.order_updates ?? true,
          promotions: data.promotions ?? true,
          new_products: data.new_products ?? true,
          email_notifications: data.email_notifications ?? true,
        });
      }
      setLoading(false);
    };

    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('notification_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('notification_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } else {
        await supabase.from('notification_settings').insert({
          user_id: user.id,
          ...settings,
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

  const notificationTypes = [
    {
      key: 'order_updates' as const,
      title: 'Cập nhật đơn hàng',
      description: 'Nhận thông báo khi đơn hàng được xác nhận, đang giao hoặc đã giao',
      icon: Package,
    },
    {
      key: 'promotions' as const,
      title: 'Khuyến mãi',
      description: 'Nhận thông báo về các chương trình khuyến mãi và voucher',
      icon: Tag,
    },
    {
      key: 'new_products' as const,
      title: 'Sản phẩm mới',
      description: 'Nhận thông báo khi có sản phẩm mới',
      icon: Sparkles,
    },
    {
      key: 'email_notifications' as const,
      title: 'Thông báo qua Email',
      description: 'Nhận các thông báo quan trọng qua email',
      icon: Mail,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Cài đặt thông báo
        </CardTitle>
        <CardDescription>
          Tùy chỉnh các loại thông báo bạn muốn nhận
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {notificationTypes.map(({ key, title, description, icon: Icon }) => (
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