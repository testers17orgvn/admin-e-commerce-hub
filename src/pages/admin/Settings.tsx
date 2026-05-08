import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Store, Phone, Mail, MapPin, Facebook, Instagram, CreditCard, Building2, Smartphone, Image as ImageIcon, Palette, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { ThemeSelector } from '@/components/admin/ThemeSelector';
import { CustomMascotManager } from '@/components/admin/CustomMascotManager';
import { MobilePopupManager } from '@/components/admin/MobilePopupManager';

interface Settings {
  site_name?: string;
  site_description?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  facebook_url?: string;
  instagram_url?: string;
  footer_text?: string;
  logo_url?: string;
  favicon_url?: string;
  auth_banner_url?: string;
  auth_welcome_title?: string;
  auth_welcome_subtitle?: string;
  auth_features?: string;
  auth_login_title?: string;
  auth_login_subtitle?: string;
  auth_signup_title?: string;
  auth_signup_subtitle?: string;
  auth_login_button?: string;
  auth_signup_button?: string;
  auth_switch_to_signup?: string;
  auth_switch_to_login?: string;
  auth_error_empty?: string;
  auth_error_name?: string;
  auth_error_duplicate?: string;
  auth_success_login?: string;
  auth_success_signup?: string;
  auth_footer_text?: string;
}

interface PaymentSettings {
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  momo_phone: string;
  momo_name: string;
  enable_bank: boolean;
  enable_momo: boolean;
}

const BANKS = [
  'Vietcombank',
  'Techcombank',
  'MB Bank',
  'BIDV',
  'Agribank',
  'VPBank',
  'ACB',
  'Sacombank',
  'VietinBank',
  'TPBank',
  'HDBank',
  'OCB',
  'SHB',
  'VIB',
  'MSB',
  'SeABank',
  'Eximbank',
  'LienVietPostBank',
  'NamABank',
  'BacABank',
  'PVcomBank',
  'SCB',
];

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({});
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    bank_name: '',
    bank_account: '',
    bank_holder: '',
    momo_phone: '',
    momo_name: '',
    enable_bank: true,
    enable_momo: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const settingsMap: Settings = {};
      data.forEach((item: { key: string; value: unknown }) => {
        if (item.key === 'payment_settings') {
          setPaymentSettings(prev => ({ ...prev, ...(item.value as object) }));
        } else {
          settingsMap[item.key as keyof Settings] = item.value as string;
        }
      });
      setSettings(settingsMap);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const saveSetting = async (key: string, value: unknown) => {
    const { data: existing } = await supabase.from('settings').select('id').eq('key', key).maybeSingle();
    
    if (existing) {
      await supabase.from('settings').update({ value: value as never }).eq('key', key);
    } else {
      await supabase.from('settings').insert([{ key, value: value as never }]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(settings);
      await Promise.all([
        ...entries.map(([key, value]) => saveSetting(key, value || '')),
        saveSetting('payment_settings', paymentSettings),
      ]);
      toast.success('Lưu cài đặt thành công');
    } catch (error) {
      toast.error('Lỗi khi lưu cài đặt');
    }
    setSaving(false);
  };

  const updateSetting = (key: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updatePayment = <K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) => {
    setPaymentSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <AdminLayout><div className="p-8 text-center">Đang tải...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cài đặt</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general">Tổng quan</TabsTrigger>
          <TabsTrigger value="branding">Logo & Favicon</TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="h-4 w-4 mr-1" /> Theme
          </TabsTrigger>
          <TabsTrigger value="auth">
            <LogIn className="h-4 w-4 mr-1" /> Trang Auth
          </TabsTrigger>
          <TabsTrigger value="contact">Liên hệ</TabsTrigger>
          <TabsTrigger value="social">Mạng xã hội</TabsTrigger>
          <TabsTrigger value="payment">Thanh toán</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Header Preview */}
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Xem trước Header</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-background border rounded-lg p-4 flex items-center gap-3">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo preview" className="h-10 w-auto object-contain" />
                ) : (
                  <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <span className="font-display text-xl font-bold tracking-tight">
                  {(() => {
                    const name = (settings.site_name || 'VSM Shop').trim();
                    const parts = name.split(' ');
                    if (parts.length >= 2) {
                      return (
                        <>
                          <span className="text-foreground">{parts[0]}</span>
                          <span className="text-accent">{parts.slice(1).join(' ')}</span>
                        </>
                      );
                    }
                    return <span className="text-foreground">{name}</span>;
                  })()}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="bg-card rounded-lg border p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Store className="h-4 w-4" /> Thông tin cửa hàng</h3>
            <div>
              <label className="text-sm font-medium">Tên cửa hàng</label>
              <Input value={settings.site_name || ''} onChange={(e) => updateSetting('site_name', e.target.value)} placeholder="Tên website (vd: VSM Shop)" />
              <p className="text-xs text-muted-foreground mt-1">Từ đầu tiên sẽ có màu chính, các từ còn lại sẽ có màu accent</p>
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

        <TabsContent value="branding" className="space-y-6">
          {/* Header Preview */}
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Xem trước Header</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-background border rounded-lg p-4 flex items-center gap-3">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo preview" className="h-10 w-auto object-contain" />
                ) : (
                  <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <span className="font-display text-xl font-bold tracking-tight">
                  {(() => {
                    const name = (settings.site_name || 'VSM Shop').trim();
                    const parts = name.split(' ');
                    if (parts.length >= 2) {
                      return (
                        <>
                          <span className="text-foreground">{parts[0]}</span>
                          <span className="text-accent">{parts.slice(1).join(' ')}</span>
                        </>
                      );
                    }
                    return <span className="text-foreground">{name}</span>;
                  })()}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Logo
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Logo hiển thị trên header và các vị trí khác
                </p>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={settings.logo_url || ''}
                  onChange={(url) => updateSetting('logo_url', url)}
                  folder="branding"
                  label="Tải lên logo"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Favicon
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Icon hiển thị trên tab trình duyệt (khuyến nghị 32x32 hoặc 64x64 px)
                </p>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={settings.favicon_url || ''}
                  onChange={(url) => updateSetting('favicon_url', url)}
                  folder="branding"
                  label="Tải lên favicon"
                />
                {settings.favicon_url && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Xem trước favicon:</p>
                    <img src={settings.favicon_url} alt="Favicon" className="h-8 w-8 object-contain" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Lưu ý:</strong> Sau khi lưu thay đổi, reload lại trang chủ để xem cập nhật trên header thực tế.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-6">
          <ThemeSelector />
          <CustomMascotManager />
          <MobilePopupManager />
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

        <TabsContent value="payment" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Bank Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Chuyển khoản ngân hàng
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="enable-bank"
                      checked={paymentSettings.enable_bank}
                      onCheckedChange={(checked) => updatePayment('enable_bank', checked)}
                    />
                    <Label htmlFor="enable-bank" className="text-sm">Bật</Label>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cấu hình tài khoản ngân hàng để tự động tạo mã QR thanh toán
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Ngân hàng</label>
                  <Select 
                    value={paymentSettings.bank_name} 
                    onValueChange={(value) => updatePayment('bank_name', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn ngân hàng" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Số tài khoản</label>
                  <Input
                    value={paymentSettings.bank_account}
                    onChange={(e) => updatePayment('bank_account', e.target.value)}
                    placeholder="0123456789"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tên chủ tài khoản</label>
                  <Input
                    value={paymentSettings.bank_holder}
                    onChange={(e) => updatePayment('bank_holder', e.target.value)}
                    placeholder="NGUYEN VAN A"
                  />
                </div>
              </CardContent>
            </Card>

            {/* MoMo Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-pink-500" />
                    Ví MoMo
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="enable-momo"
                      checked={paymentSettings.enable_momo}
                      onCheckedChange={(checked) => updatePayment('enable_momo', checked)}
                    />
                    <Label htmlFor="enable-momo" className="text-sm">Bật</Label>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cấu hình ví MoMo để nhận thanh toán
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Số điện thoại MoMo</label>
                  <Input
                    value={paymentSettings.momo_phone}
                    onChange={(e) => updatePayment('momo_phone', e.target.value)}
                    placeholder="0909123456"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tên tài khoản MoMo</label>
                  <Input
                    value={paymentSettings.momo_name}
                    onChange={(e) => updatePayment('momo_name', e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Xem trước mã QR
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentSettings.enable_bank && paymentSettings.bank_account && paymentSettings.bank_name ? (
                <div className="flex flex-col items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Mã QR ngân hàng (ví dụ với 100,000đ)</p>
                  <div className="bg-white p-4 rounded-lg">
                    <img
                      src={`https://img.vietqr.io/image/${
                        {
                          'Vietcombank': 'VCB',
                          'Techcombank': 'TCB',
                          'MB Bank': 'MB',
                          'BIDV': 'BIDV',
                          'Agribank': 'VBA',
                          'VPBank': 'VPB',
                          'ACB': 'ACB',
                          'Sacombank': 'STB',
                          'VietinBank': 'ICB',
                          'TPBank': 'TPB',
                        }[paymentSettings.bank_name] || paymentSettings.bank_name
                      }-${paymentSettings.bank_account}-compact2.png?amount=100000&addInfo=Thanh%20toan%20don%20hang&accountName=${encodeURIComponent(paymentSettings.bank_holder)}`}
                      alt="Bank QR Preview"
                      className="w-48 h-48 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/200x200?text=QR+Preview';
                      }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Điền thông tin ngân hàng để xem trước mã QR
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="auth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5" /> Tùy chỉnh trang Đăng nhập / Đăng ký
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Ảnh banner (khuyến nghị 960×1280)</Label>
                <ImageUpload
                  value={settings.auth_banner_url || ''}
                  onChange={(url) => updateSetting('auth_banner_url', url)}
                  folder="auth"
                  label="Tải ảnh banner trang Auth"
                />
                <p className="text-xs text-muted-foreground">Hiển thị bên trái form đăng nhập trên desktop, phía trên trên mobile</p>
              </div>

              <div className="space-y-2">
                <Label>Tiêu đề chào mừng</Label>
                <Input
                  value={settings.auth_welcome_title || ''}
                  onChange={(e) => updateSetting('auth_welcome_title', e.target.value)}
                  placeholder="Mua sắm thông minh"
                />
              </div>

              <div className="space-y-2">
                <Label>Mô tả phụ</Label>
                <Input
                  value={settings.auth_welcome_subtitle || ''}
                  onChange={(e) => updateSetting('auth_welcome_subtitle', e.target.value)}
                  placeholder="Trải nghiệm mua sắm trực tuyến hiện đại"
                />
              </div>

              <div className="space-y-2">
                <Label>Tính năng nổi bật (mỗi dòng 1 tính năng, tối đa 4)</Label>
                <Textarea
                  value={settings.auth_features || 'Giao hàng nhanh chóng toàn quốc\nThanh toán an toàn & bảo mật\nƯu đãi độc quyền mỗi ngày\nHỗ trợ khách hàng 24/7'}
                  onChange={(e) => updateSetting('auth_features', e.target.value)}
                  rows={4}
                  placeholder="Mỗi dòng 1 tính năng"
                />
                <p className="text-xs text-muted-foreground">Hiển thị dưới banner trên desktop</p>
              </div>

              {/* Form Text Customization */}
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-base mb-4">📝 Văn bản trên form</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tiêu đề Đăng nhập</Label>
                    <Input
                      value={settings.auth_login_title || ''}
                      onChange={(e) => updateSetting('auth_login_title', e.target.value)}
                      placeholder="Chào mừng trở lại"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả Đăng nhập</Label>
                    <Input
                      value={settings.auth_login_subtitle || ''}
                      onChange={(e) => updateSetting('auth_login_subtitle', e.target.value)}
                      placeholder="Đăng nhập để tiếp tục mua sắm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tiêu đề Đăng ký</Label>
                    <Input
                      value={settings.auth_signup_title || ''}
                      onChange={(e) => updateSetting('auth_signup_title', e.target.value)}
                      placeholder="Tạo tài khoản mới"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả Đăng ký</Label>
                    <Input
                      value={settings.auth_signup_subtitle || ''}
                      onChange={(e) => updateSetting('auth_signup_subtitle', e.target.value)}
                      placeholder="Đăng ký để bắt đầu trải nghiệm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nút Đăng nhập</Label>
                    <Input
                      value={settings.auth_login_button || ''}
                      onChange={(e) => updateSetting('auth_login_button', e.target.value)}
                      placeholder="Đăng nhập"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nút Đăng ký</Label>
                    <Input
                      value={settings.auth_signup_button || ''}
                      onChange={(e) => updateSetting('auth_signup_button', e.target.value)}
                      placeholder="Đăng ký"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Link chuyển sang Đăng ký</Label>
                    <Input
                      value={settings.auth_switch_to_signup || ''}
                      onChange={(e) => updateSetting('auth_switch_to_signup', e.target.value)}
                      placeholder="Chưa có tài khoản? Đăng ký ngay →"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Link chuyển sang Đăng nhập</Label>
                    <Input
                      value={settings.auth_switch_to_login || ''}
                      onChange={(e) => updateSetting('auth_switch_to_login', e.target.value)}
                      placeholder="← Đã có tài khoản? Đăng nhập"
                    />
                  </div>
                </div>
              </div>

              {/* Placeholders */}
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-base mb-4">📝 Placeholder các ô nhập liệu</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={settings.auth_placeholder_email || ''}
                      onChange={(e) => updateSetting('auth_placeholder_email', e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mật khẩu</Label>
                    <Input
                      value={settings.auth_placeholder_password || ''}
                      onChange={(e) => updateSetting('auth_placeholder_password', e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Họ tên</Label>
                    <Input
                      value={settings.auth_placeholder_name || ''}
                      onChange={(e) => updateSetting('auth_placeholder_name', e.target.value)}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <Input
                      value={settings.auth_placeholder_phone || ''}
                      onChange={(e) => updateSetting('auth_placeholder_phone', e.target.value)}
                      placeholder="0912 345 678"
                    />
                  </div>
                </div>
              </div>

              {/* Error/Success Messages */}
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-base mb-4">💬 Thông báo lỗi & thành công</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lỗi: Chưa điền đủ</Label>
                    <Input
                      value={settings.auth_error_empty || ''}
                      onChange={(e) => updateSetting('auth_error_empty', e.target.value)}
                      placeholder="Vui lòng điền đầy đủ thông tin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lỗi: Chưa nhập tên</Label>
                    <Input
                      value={settings.auth_error_name || ''}
                      onChange={(e) => updateSetting('auth_error_name', e.target.value)}
                      placeholder="Vui lòng nhập họ tên"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lỗi: Email đã đăng ký</Label>
                    <Input
                      value={settings.auth_error_duplicate || ''}
                      onChange={(e) => updateSetting('auth_error_duplicate', e.target.value)}
                      placeholder="Email này đã được đăng ký"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Thành công: Đăng nhập</Label>
                    <Input
                      value={settings.auth_success_login || ''}
                      onChange={(e) => updateSetting('auth_success_login', e.target.value)}
                      placeholder="Đăng nhập thành công"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Thành công: Đăng ký</Label>
                    <Input
                      value={settings.auth_success_signup || ''}
                      onChange={(e) => updateSetting('auth_success_signup', e.target.value)}
                      placeholder="Đăng ký thành công! Vui lòng kiểm tra email để xác nhận."
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Ghi chú cuối trang</Label>
                    <Input
                      value={settings.auth_footer_text || ''}
                      onChange={(e) => updateSetting('auth_footer_text', e.target.value)}
                      placeholder="Bằng việc tiếp tục, bạn đồng ý với Điều khoản và Chính sách bảo mật"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Xem trước</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
                    {settings.auth_banner_url ? (
                      <img src={settings.auth_banner_url} alt="Auth banner preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="font-bold text-lg">{settings.auth_welcome_title || 'Mua sắm thông minh'}</h3>
                      <p className="text-white/80 text-sm">{settings.auth_welcome_subtitle || 'Trải nghiệm mua sắm trực tuyến hiện đại'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </AdminLayout>
  );
}
