import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useContactSettings } from '@/hooks/useContactSettings';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Clock, Send, Loader2, MessageCircle, Facebook } from 'lucide-react';

const Contact = () => {
  const { settings, loading: settingsLoading } = useContactSettings();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('contacts').insert({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      subject: formData.subject,
      message: formData.message,
    });

    if (error) {
      toast.error('Đã có lỗi xảy ra. Vui lòng thử lại.');
      setLoading(false);
      return;
    }

    toast.success('Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm.');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
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
                      <p className="text-muted-foreground whitespace-pre-line">
                        {settings.address}
                      </p>
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
                      <a 
                        href={`tel:${settings.phone.replace(/\s/g, '')}`}
                        className="text-accent hover:underline text-sm mt-1 inline-block"
                      >
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
                      <a 
                        href={`mailto:${settings.email}`}
                        className="text-accent hover:underline text-sm mt-1 inline-block"
                      >
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
                      <p className="text-muted-foreground whitespace-pre-line">
                        {settings.working_hours}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Links */}
                {(settings.facebook || settings.zalo) && (
                  <div className="flex gap-4 pt-4">
                    {settings.facebook && (
                      <a 
                        href={settings.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                      >
                        <Facebook className="h-5 w-5" />
                        Facebook
                      </a>
                    )}
                    {settings.zalo && (
                      <a 
                        href={settings.zalo.startsWith('http') ? settings.zalo : `https://zalo.me/${settings.zalo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-3 bg-blue-400 hover:bg-blue-500 text-white rounded-xl transition-colors"
                      >
                        <MessageCircle className="h-5 w-5" />
                        Zalo
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
            {settings.map_embed && (
              <div className="rounded-2xl overflow-hidden shadow-lg border">
                <div 
                  className="aspect-video"
                  dangerouslySetInnerHTML={{ 
                    __html: settings.map_embed
                      .replace(/width="\d+"/, 'width="100%"')
                      .replace(/height="\d+"/, 'height="100%"') 
                  }}
                />
              </div>
            )}
          </div>

          {/* Contact Form */}
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
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Họ tên *</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nguyễn Văn A"
                        className="h-12 rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="h-12 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Số điện thoại</label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0909 123 456"
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tiêu đề</label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Tiêu đề tin nhắn"
                        className="h-12 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nội dung *</label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Nhập nội dung tin nhắn của bạn..."
                      rows={6}
                      className="rounded-xl resize-none"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-xl bg-accent hover:bg-accent/90 text-lg font-medium" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        Gửi tin nhắn
                        <Send className="h-5 w-5 ml-2" />
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