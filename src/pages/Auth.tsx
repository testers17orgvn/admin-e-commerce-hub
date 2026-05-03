import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useAuthSettings } from '@/hooks/useAuthSettings';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ShoppingBag, Truck, Shield, HeadphonesIcon, Gift } from 'lucide-react';
import authBannerFallback from '@/assets/auth-banner.jpg';

const FEATURE_ICONS = [Truck, Shield, Gift, HeadphonesIcon];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });
  const { user, isAdmin, signIn, signUp } = useAuth();
  const { settings } = useAuthSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(isAdmin ? '/admin' : '/');
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error(settings.auth_error_empty || 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    setLoading(true);
    if (isLogin) {
      const { error } = await signIn(formData.email, formData.password);
      if (error) toast.error(error.message || 'Đăng nhập thất bại');
      else toast.success(settings.auth_success_login || 'Đăng nhập thành công');
    } else {
      if (!formData.fullName) {
        toast.error(settings.auth_error_name || 'Vui lòng nhập họ tên');
        setLoading(false);
        return;
      }
      const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.phone);
      if (error) {
        toast.error(error.message.includes('already registered') ? (settings.auth_error_duplicate || 'Email này đã được đăng ký') : error.message);
      } else {
        toast.success(settings.auth_success_signup || 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.');
      }
    }
    setLoading(false);
  };

  const bannerUrl = settings.auth_banner_url || authBannerFallback;
  const features = settings.auth_features || [
    'Giao hàng nhanh chóng toàn quốc',
    'Thanh toán an toàn & bảo mật',
    'Ưu đãi độc quyền mỗi ngày',
    'Hỗ trợ khách hàng 24/7',
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Hero Banner */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={bannerUrl}
          alt="Shopping banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16 text-white">
          {settings.logo_url && (
            <img src={settings.logo_url} alt="Logo" className="h-12 w-auto object-contain mb-8 self-start" />
          )}
          <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight mb-4">
            {settings.auth_welcome_title || 'Mua sắm thông minh'}
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-md">
            {settings.auth_welcome_subtitle || 'Trải nghiệm mua sắm trực tuyến hiện đại'}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {features.map((feat, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white/90">{feat}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-8 lg:py-12">
        <div className="w-full max-w-[440px] animate-fade-in">
          {/* Mobile banner */}
          <div className="lg:hidden relative rounded-2xl overflow-hidden mb-8 aspect-[2.5/1]">
            <img
              src={bannerUrl}
              alt="Shopping banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="relative z-10 flex items-end h-full p-5">
              <div className="flex items-center gap-3">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo" className="h-8 w-auto object-contain" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-white" />
                  </div>
                )}
                <span className="text-white font-display text-lg font-bold">
                  {settings.site_name || 'VSM Shop'}
                </span>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="hidden lg:flex items-center justify-center gap-2 mb-6">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="h-10 w-auto object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-accent" />
                </div>
              )}
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-2">
              {isLogin ? (settings.auth_login_title || 'Chào mừng trở lại') : (settings.auth_signup_title || 'Tạo tài khoản mới')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isLogin ? (settings.auth_login_subtitle || 'Đăng nhập để tiếp tục mua sắm') : (settings.auth_signup_subtitle || 'Đăng ký để bắt đầu trải nghiệm')}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2 animate-slide-up">
                    <Label htmlFor="fullName" className="text-sm font-medium">Họ tên</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Nguyễn Văn A"
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 animate-slide-up">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Số điện thoại <span className="text-muted-foreground text-xs">(tùy chọn)</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">📱</span>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0912 345 678"
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    className="pl-10 h-12 rounded-xl"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="pl-10 pr-12 h-12 rounded-xl"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full h-12 rounded-xl text-base font-semibold gap-2 group mt-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : (
                  <>
                    {isLogin ? (settings.auth_login_button || 'Đăng nhập') : (settings.auth_signup_button || 'Đăng ký')}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">hoặc</span>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ email: '', password: '', fullName: '', phone: '' });
                }}
                className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
              >
                {isLogin ? (settings.auth_switch_to_signup || 'Chưa có tài khoản? Đăng ký ngay →') : (settings.auth_switch_to_login || '← Đã có tài khoản? Đăng nhập')}
              </button>
            </div>
          </div>

          {settings.auth_footer_text ? (
            <p className="text-center text-xs text-muted-foreground mt-6">{settings.auth_footer_text}</p>
          ) : (
            <p className="text-center text-xs text-muted-foreground mt-6">
              Bằng việc tiếp tục, bạn đồng ý với{' '}
              <a href="/terms" className="underline hover:text-foreground">Điều khoản</a>
              {' '}và{' '}
              <a href="/privacy" className="underline hover:text-foreground">Chính sách bảo mật</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
