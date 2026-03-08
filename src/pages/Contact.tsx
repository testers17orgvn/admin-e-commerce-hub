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
import { Mail, Phone, MapPin, Clock, Send, Loader2, MessageCircle, Facebook } from 'lucide-react';
import { ContactFormField, DEFAULT_FORM_FIELDS } from '@/components/admin/ContactFormFieldManager';

const Contact = () => {
  const { settings, loading: settingsLoading } = useContactSettings();
  const [loading, setLoading] = useState(false);
  const [formFields, setFormFields] = useState<ContactFormField[]>(DEFAULT_FORM_FIELDS);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Fetch form field config
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

    // Validate required fields
    for (const field of enabledFields) {
      if (field.required && !formData[field.id]?.trim()) {
        toast.error(`Vui lòng điền "${field.label}"`);
        return;
      }
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Email không hợp lệ');
      return;
    }

    setLoading(true);

    // Separate built-in fields from custom fields
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

  if (settingsLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  // Group fields into rows (half-width fields are paired)
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
        <div className="container py-16 md:py-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              {settings.intro_title}
            </h1>
            <p className="text-lg md:text-xl text-white/80">
              {settings.intro_description}
            </p>
          </div>
        </div>
      </div>

      <div className="container py-12 md:py-16">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">
                Thông tin liên hệ
              </h2>
              <div className="space-y-6">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="p-4 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Địa chỉ</h3>
                      <p className="text-muted-foreground whitespace-pre-line">{settings.address}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="p-4 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Phone className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Điện thoại</h3>
                      <p className="text-muted-foreground">{settings.phone}</p>
                      <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="text-accent hover:underline text-sm mt-1 inline-block">
                        Gọi ngay
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="p-4 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Mail className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Email</h3>
                      <p className="text-muted-foreground">{settings.email}</p>
                      <a href={`mailto:${settings.email}`} className="text-accent hover:underline text-sm mt-1 inline-block">
                        Gửi email
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="p-4 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <Clock className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Giờ làm việc</h3>
                      <p className="text-muted-foreground whitespace-pre-line">{settings.working_hours}</p>
                    </div>
                  </CardContent>
                </Card>

                {(settings.facebook || settings.zalo) && (
                  <div className="flex gap-4 pt-4">
                    {settings.facebook && (
                      <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                        <Facebook className="h-5 w-5" /> Facebook
                      </a>
                    )}
                    {settings.zalo && (
                      <a href={settings.zalo.startsWith('http') ? settings.zalo : `https://zalo.me/${settings.zalo}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-3 bg-blue-400 hover:bg-blue-500 text-white rounded-xl transition-colors">
                        <MessageCircle className="h-5 w-5" /> Zalo
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {settings.map_embed && (
              <div className="rounded-2xl overflow-hidden shadow-lg border">
                <div
                  className="aspect-video"
                  dangerouslySetInnerHTML={{
                    __html: settings.map_embed
                      .replace(/width="\d+"/, 'width="100%"')
                      .replace(/height="\d+"/, 'height="100%"'),
                  }}
                />
              </div>
            )}
          </div>

          {/* Dynamic Contact Form */}
          <div>
            <Card className="border-0 shadow-lg overflow-hidden sticky top-24">
              <div className="bg-gradient-to-r from-accent/10 to-transparent p-6 border-b">
                <h2 className="font-display text-2xl font-bold">Gửi tin nhắn</h2>
                <p className="text-muted-foreground mt-1">
                  Chúng tôi sẽ phản hồi trong thời gian sớm nhất
                </p>
              </div>
              <CardContent className="p-6 md:p-8">
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
      </div>
    </Layout>
  );
};

export default Contact;
