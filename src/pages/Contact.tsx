import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useContactSettings } from '@/hooks/useContactSettings';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Clock, Send, Loader2, MessageCircle, Facebook, Share2, Copy, ExternalLink } from 'lucide-react';
import { ContactFormField, DEFAULT_FORM_FIELDS } from '@/components/admin/ContactFormFieldManager';

const SITE_URL = 'https://store.vsm.org.vn';

const Contact = () => {
  const { settings, loading: settingsLoading } = useContactSettings();
  const [loading, setLoading] = useState(false);
  const [formFields, setFormFields] = useState<ContactFormField[]>(DEFAULT_FORM_FIELDS);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchFields = async () => {
      const { data } = await supabase
        .from('contact_settings')
        .select('value')
        .eq('key', 'contact_form_fields')
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFormFields(parsed);
          }
        } catch {}
      }
    };
    fetchFields();
  }, []);

  const enabledFields = formFields.filter((f) => f.enabled);

  const updateField = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const field of enabledFields) {
      if (field.required && !formData[field.id]?.trim()) {
        toast.error(`Vui lòng điền "${field.label}"`);
        return;
      }
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Email không hợp lệ');
      return;
    }
    setLoading(true);
    const builtinKeys = ['name', 'email', 'phone', 'subject', 'message'];
    const customFields: Record<string, string> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (!builtinKeys.includes(key) && value?.trim()) {
        const fieldConfig = formFields.find((f) => f.id === key);
        customFields[fieldConfig?.label || key] = value.trim();
      }
    }
    const { error } = await supabase.from('contacts').insert({
      name: formData.name || '',
      email: formData.email || '',
      phone: formData.phone || null,
      subject: formData.subject || null,
      message: formData.message || '',
      custom_fields: Object.keys(customFields).length > 0 ? customFields : null,
    } as any);
    if (error) {
      toast.error('Đã có lỗi xảy ra. Vui lòng thử lại.');
      setLoading(false);
      return;
    }
    toast.success('Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm.');
    setFormData({});
    setLoading(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${SITE_URL}/contact`);
    toast.success('Đã sao chép liên kết!');
  };

  const shareUrl = `${SITE_URL}/contact`;
  const shareText = 'Liên hệ VSM Shop - Cửa hàng thời trang trực tuyến';

  if (settingsLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  const renderFormFields = () => {
    const rows: ContactFormField[][] = [];
    let currentRow: ContactFormField[] = [];
    for (const field of enabledFields) {
      if (field.halfWidth) {
        currentRow.push(field);
        if (currentRow.length === 2) {
          rows.push(currentRow);
          currentRow = [];
        }
      } else {
        if (currentRow.length > 0) {
          rows.push(currentRow);
          currentRow = [];
        }
        rows.push([field]);
      }
    }
    if (currentRow.length > 0) rows.push(currentRow);

    return rows.map((row, i) => {
      const isMulti = row.length > 1;
      return (
        <div key={i} className={isMulti ? 'grid md:grid-cols-2 gap-4' : ''}>
          {row.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="text-sm font-medium">
                {field.label} {field.required && <span className="text-destructive">*</span>}
              </label>
              {field.type === 'textarea' ? (
                <Textarea
                  value={formData[field.id] || ''}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  rows={6}
                  className="rounded-xl resize-none"
                  required={field.required}
                  maxLength={2000}
                />
              ) : field.type === 'select' ? (
                <Select
                  value={formData[field.id] || ''}
                  onValueChange={(v) => updateField(field.id, v)}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder={field.placeholder || 'Chọn...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options || []).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type}
                  value={formData[field.id] || ''}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="h-12 rounded-xl"
                  required={field.required}
                  maxLength={500}
                />
              )}
            </div>
          ))}
        </div>
      );
    });
  };

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-charcoal via-charcoal-light to-charcoal overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--accent)/0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.2),transparent_40%)]" />
        </div>
        <div className="container px-4 sm:px-6 py-10 sm:py-16 md:py-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4">
              {settings.intro_title}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/80">
              {settings.intro_description}
            </p>
          </div>
        </div>
      </div>

      <div className="container px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="grid lg:grid-cols-5 gap-6 md:gap-8 lg:gap-12 max-w-7xl mx-auto">
          {/* Contact Info – wider column */}
          <div className="lg:col-span-3 space-y-8 md:space-y-10">
            <div>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">
                Thông tin liên hệ
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                {settings.address && (
                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group h-full">
                    <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4 h-full">
                      <div className="p-2.5 sm:p-3 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl group-hover:scale-110 transition-transform duration-300 shrink-0">
                        <MapPin className="h-5 w-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base mb-1">Địa chỉ</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{settings.address}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {settings.phone && (
                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group h-full">
                    <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4 h-full">
                      <div className="p-2.5 sm:p-3 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl group-hover:scale-110 transition-transform duration-300 shrink-0">
                        <Phone className="h-5 w-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base mb-1">Điện thoại</h3>
                        <p className="text-sm text-muted-foreground">{settings.phone}</p>
                        <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="text-accent hover:underline text-xs mt-1 inline-block">
                          Gọi ngay
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {settings.email && (
                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group h-full">
                    <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4 h-full">
                      <div className="p-2.5 sm:p-3 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl group-hover:scale-110 transition-transform duration-300 shrink-0">
                        <Mail className="h-5 w-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base mb-1">Email</h3>
                        <p className="text-sm text-muted-foreground break-all">{settings.email}</p>
                        <a href={`mailto:${settings.email}`} className="text-accent hover:underline text-xs mt-1 inline-block">
                          Gửi email
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {settings.working_hours && (
                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group h-full">
                    <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4 h-full">
                      <div className="p-2.5 sm:p-3 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl group-hover:scale-110 transition-transform duration-300 shrink-0">
                        <Clock className="h-5 w-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base mb-1">Giờ làm việc</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{settings.working_hours}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Social Media & Sharing */}
            <div className="space-y-4">
              <h3 className="font-display text-xl font-bold">Kết nối với chúng tôi</h3>
              
              {/* Social links */}
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {settings.facebook && (
                  <a
                    href={settings.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="font-medium">Facebook</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
                {settings.zalo && (
                  <a
                    href={settings.zalo.startsWith('http') ? settings.zalo : `https://zalo.me/${settings.zalo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-blue-400 to-cyan-400 text-white text-sm shadow-lg shadow-blue-400/20 hover:shadow-xl hover:shadow-blue-400/30 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="font-medium">Zalo</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </a>
                )}
              </div>

              {/* Share buttons */}
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Share2 className="h-4 w-4" /> Chia sẻ trang này
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-600/20 hover:border-transparent transition-all duration-300 text-sm font-medium"
                  >
                    <Facebook className="h-4 w-4" /> Facebook
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white border border-sky-500/20 hover:border-transparent transition-all duration-300 text-sm font-medium"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X (Twitter)
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 hover:border-transparent transition-all duration-300 text-sm font-medium"
                  >
                    <Mail className="h-4 w-4" /> Email
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-border hover:border-transparent transition-all duration-300 text-sm font-medium"
                  >
                    <Copy className="h-4 w-4" /> Sao chép link
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg overflow-hidden lg:sticky lg:top-24">
              <div className="bg-gradient-to-r from-accent/10 to-transparent p-5 sm:p-6 border-b">
                <h2 className="font-display text-xl sm:text-2xl font-bold">Gửi tin nhắn</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Chúng tôi sẽ phản hồi trong thời gian sớm nhất
                </p>
              </div>
              <CardContent className="p-5 sm:p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {renderFormFields()}
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-xl bg-accent hover:bg-accent/90 text-lg font-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang gửi...
                      </>
                    ) : (
                      <>
                        Gửi tin nhắn <Send className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Google Map – full width below */}
        {settings.map_embed && (
          <div className="max-w-7xl mx-auto mt-12 md:mt-16">
            <div className="flex items-end justify-between mb-4 gap-4">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-accent" /> Vị trí cửa hàng
                </h2>
                {settings.address && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{settings.address}</p>
                )}
              </div>
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(settings.address || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-4 py-2 bg-accent hover:bg-accent/90 text-white text-xs md:text-sm font-medium rounded-full transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Xem trên Maps
              </a>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl ring-1 ring-border">
              <div
                className="aspect-[16/7] md:aspect-[21/8]"
                dangerouslySetInnerHTML={{
                  __html: settings.map_embed
                    .replace(/width="\d+"/, 'width="100%"')
                    .replace(/height="\d+"/, 'height="100%"')
                    .replace(/style="[^"]*"/, 'style="border:0;"'),
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Contact;
