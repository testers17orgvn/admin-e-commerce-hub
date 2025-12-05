import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Store, Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';
import { toast } from 'sonner';

interface Settings {
  site_name?: string;
  site_description?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  facebook_url?: string;
  instagram_url?: string;
  footer_text?: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const settingsMap: Settings = {};
      data.forEach((item: { key: string; value: unknown }) => {
        settingsMap[item.key as keyof Settings] = item.value as string;
      });
      setSettings(settingsMap);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const saveSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from('settings').select('id').eq('key', key).maybeSingle();
    
    if (existing) {
      await supabase.from('settings').update({ value }).eq('key', key);
    } else {
      await supabase.from('settings').insert({ key, value });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(settings);
      await Promise.all(entries.map(([key, value]) => saveSetting(key, value || '')));
      toast.success('Lưu cài đặt thành công');
    } catch (error) {
      toast.error('Lỗi khi lưu cài đặt');
    }
    setSaving(false);
  };

  const updateSetting = (key: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cài đặt</h1>
        <Button variant="hero" onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">Tổng quan</TabsTrigger>
          <TabsTrigger value="contact">Liên hệ</TabsTrigger>
          <TabsTrigger value="social">Mạng xã hội</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Store className="h-4 w-4" /> Thông tin cửa hàng</h3>
            <div>
              <label className="text-sm font-medium">Tên cửa hàng</label>
              <Input value={settings.site_name || ''} onChange={(e) => updateSetting('site_name', e.target.value)} placeholder="Tên website" />
            </div>
            <div>
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea value={settings.site_description || ''} onChange={(e) => updateSetting('site_description', e.target.value)} placeholder="Mô tả ngắn về cửa hàng" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Footer text</label>
              <Input value={settings.footer_text || ''} onChange={(e) => updateSetting('footer_text', e.target.value)} placeholder="Text hiển thị ở footer" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Phone className="h-4 w-4" /> Thông tin liên hệ</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-2"><Mail className="h-3 w-3" /> Email</label>
                <Input value={settings.contact_email || ''} onChange={(e) => updateSetting('contact_email', e.target.value)} placeholder="email@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium flex items-center gap-2"><Phone className="h-3 w-3" /> Số điện thoại</label>
                <Input value={settings.contact_phone || ''} onChange={(e) => updateSetting('contact_phone', e.target.value)} placeholder="0123 456 789" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2"><MapPin className="h-3 w-3" /> Địa chỉ</label>
              <Textarea value={settings.contact_address || ''} onChange={(e) => updateSetting('contact_address', e.target.value)} placeholder="Địa chỉ cửa hàng" rows={2} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">Mạng xã hội</h3>
            <div>
              <label className="text-sm font-medium flex items-center gap-2"><Facebook className="h-3 w-3" /> Facebook</label>
              <Input value={settings.facebook_url || ''} onChange={(e) => updateSetting('facebook_url', e.target.value)} placeholder="https://facebook.com/yourpage" />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2"><Instagram className="h-3 w-3" /> Instagram</label>
              <Input value={settings.instagram_url || ''} onChange={(e) => updateSetting('instagram_url', e.target.value)} placeholder="https://instagram.com/yourpage" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
