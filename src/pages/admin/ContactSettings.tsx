import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, MapPin, Phone, Mail, Clock, MessageSquare, Globe, Eye, Map, FormInput } from 'lucide-react';
import { toast } from 'sonner';
import { ContactFormFieldManager, ContactFormField, DEFAULT_FORM_FIELDS } from '@/components/admin/ContactFormFieldManager';
import { sanitizeMapEmbed } from '@/lib/sanitize';

interface ContactSettings {
  address: string;
  phone: string;
  email: string;
  working_hours: string;
  map_embed: string;
  facebook: string;
  zalo: string;
  intro_title: string;
  intro_description: string;
}

const defaultSettings: ContactSettings = {
  address: '',
  phone: '',
  email: '',
  working_hours: 'Thứ 2 - Thứ 7: 9:00 - 21:00\nChủ nhật: 10:00 - 18:00',
  map_embed: '',
  facebook: '',
  zalo: '',
  intro_title: 'Liên hệ với chúng tôi',
  intro_description: 'Hãy liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào',
};

export default function AdminContactSettings() {
  const [settings, setSettings] = useState<ContactSettings>(defaultSettings);
  const [formFields, setFormFields] = useState<ContactFormField[]>(DEFAULT_FORM_FIELDS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const { data, error } = await supabase.from('contact_settings').select('*');
    
    if (error) {
      console.error('Error fetching contact settings:', error);
    } else if (data) {
      const settingsMap: Partial<ContactSettings> = {};
      data.forEach((item: { key: string; value: string | null }) => {
        if (item.key === 'contact_form_fields') {
          try {
            const parsed = JSON.parse(item.value || '[]');
            if (Array.isArray(parsed) && parsed.length > 0) {
              setFormFields(parsed);
            }
          } catch {}
        } else {
          settingsMap[item.key as keyof ContactSettings] = item.value || '';
        }
      });
      setSettings(prev => ({ ...prev, ...settingsMap }));
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save regular settings + form fields config
      const entries: [string, string][] = [
        ...Object.entries(settings),
        ['contact_form_fields', JSON.stringify(formFields)],
      ];
      
      for (const [key, value] of entries) {
        const { data: existing } = await supabase
          .from('contact_settings')
          .select('id')
          .eq('key', key)
          .maybeSingle();
        
        if (existing) {
          await supabase.from('contact_settings').update({ value }).eq('key', key);
        } else {
          await supabase.from('contact_settings').insert([{ key, value }]);
        }
      }
      
      toast.success('Lưu cài đặt liên hệ thành công');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Lỗi khi lưu cài đặt');
    }
    setSaving(false);
  };

  const updateSetting = (key: keyof ContactSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <AdminLayout><div className="p-8 text-center">Đang tải...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Cài đặt trang Liên hệ
          </h1>
          <p className="text-muted-foreground">Quản lý thông tin hiển thị trên trang liên hệ</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-accent hover:bg-accent/90">
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Thông tin liên hệ</TabsTrigger>
          <TabsTrigger value="form" className="gap-1">
            <FormInput className="h-4 w-4" /> Biểu mẫu
          </TabsTrigger>
          <TabsTrigger value="map">Bản đồ</TabsTrigger>
          <TabsTrigger value="content">Nội dung</TabsTrigger>
          <TabsTrigger value="preview">Xem trước</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-accent" /> Địa chỉ cửa hàng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={settings.address} onChange={(e) => updateSetting('address', e.target.value)} placeholder="Nhập địa chỉ cửa hàng..." rows={3} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-accent" /> Giờ làm việc
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={settings.working_hours} onChange={(e) => updateSetting('working_hours', e.target.value)} placeholder="Thứ 2 - Thứ 6: 9:00 - 18:00..." rows={3} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5 text-accent" /> Số điện thoại
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input value={settings.phone} onChange={(e) => updateSetting('phone', e.target.value)} placeholder="0909 123 456" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Mail className="h-5 w-5 text-accent" /> Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input value={settings.email} onChange={(e) => updateSetting('email', e.target.value)} placeholder="contact@vsm.org.vn" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-blue-500" /> Facebook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input value={settings.facebook} onChange={(e) => updateSetting('facebook', e.target.value)} placeholder="https://facebook.com/yourpage" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-blue-400" /> Zalo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input value={settings.zalo} onChange={(e) => updateSetting('zalo', e.target.value)} placeholder="0909123456 hoặc https://zalo.me/..." />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="form">
          <ContactFormFieldManager fields={formFields} onChange={setFormFields} />
        </TabsContent>

        <TabsContent value="map" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-accent" /> Nhúng bản đồ Google Maps
              </CardTitle>
              <CardDescription>
                Dán mã nhúng iframe từ Google Maps. Để lấy mã, vào Google Maps → Tìm địa chỉ → Chia sẻ → Nhúng bản đồ → Sao chép HTML
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={settings.map_embed} onChange={(e) => updateSetting('map_embed', e.target.value)} placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." ...' rows={4} className="font-mono text-sm" />
              {settings.map_embed && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Xem trước:</p>
                  <div className="rounded-lg overflow-hidden border aspect-video" dangerouslySetInnerHTML={{ __html: sanitizeMapEmbed(settings.map_embed.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"')) }} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Tiêu đề trang liên hệ</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tiêu đề chính</label>
                <Input value={settings.intro_title} onChange={(e) => updateSetting('intro_title', e.target.value)} placeholder="Liên hệ với chúng tôi" />
              </div>
              <div>
                <label className="text-sm font-medium">Mô tả</label>
                <Textarea value={settings.intro_description} onChange={(e) => updateSetting('intro_description', e.target.value)} placeholder="Hãy liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào" rows={2} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Xem trước trang Liên hệ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">{settings.intro_title}</h2>
                  <p className="text-muted-foreground">{settings.intro_description}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {[
                      { icon: MapPin, label: 'Địa chỉ', value: settings.address },
                      { icon: Phone, label: 'Điện thoại', value: settings.phone },
                      { icon: Mail, label: 'Email', value: settings.email },
                      { icon: Clock, label: 'Giờ làm việc', value: settings.working_hours },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-4">
                        <div className="p-3 bg-accent/10 rounded-lg"><Icon className="h-5 w-5 text-accent" /></div>
                        <div>
                          <h4 className="font-semibold">{label}</h4>
                          <p className="text-muted-foreground text-sm whitespace-pre-line">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-3">Biểu mẫu ({formFields.filter(f => f.enabled).length} trường):</p>
                    <div className="space-y-2">
                      {formFields.filter(f => f.enabled).map(f => (
                        <div key={f.id} className="flex items-center gap-2 text-sm p-2 bg-background rounded border">
                          <span className="font-medium">{f.label}</span>
                          {f.required && <span className="text-destructive">*</span>}
                          <span className="text-muted-foreground text-xs ml-auto">{f.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
