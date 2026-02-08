import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';

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
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    if (isLogin) {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        toast.error(error.message || 'Đăng nhập thất bại');
      } else {
        toast.success('Đăng nhập thành công');
      }
    } else {
      if (!formData.fullName) {
        toast.error('Vui lòng nhập họ tên');
        setLoading(false);
        return;
      }
      const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.phone);
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Email này đã được đăng ký');
        } else {
          toast.error(error.message || 'Đăng ký thất bại');
        }
      } else {
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.');
      }
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo / Brand */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-5">
              <Sparkles className="h-8 w-8 text-accent" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
              {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? 'Đăng nhập để tiếp tục mua sắm'
                : 'Đăng ký để bắt đầu trải nghiệm'}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name - signup only */}
              {!isLogin && (
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
              )}

              {/* Phone - signup only */}
              {!isLogin && (
                <div className="space-y-2 animate-slide-up stagger-1">
                  <Label htmlFor="phone" className="text-sm font-medium">Số điện thoại <span className="text-muted-foreground text-xs">(tùy chọn)</span></Label>
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
              )}

              {/* Email */}
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

              {/* Password */}
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

              {/* Submit */}
              <Button 
                type="submit" 
                variant="hero" 
                className="w-full h-12 rounded-xl text-base font-semibold gap-2 group" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : (
                  <>
                    {isLogin ? 'Đăng nhập' : 'Đăng ký'}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">hoặc</span>
              </div>
            </div>

            {/* Toggle */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ email: '', password: '', fullName: '', phone: '' });
                }}
                className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
              >
                {isLogin ? 'Chưa có tài khoản? Đăng ký ngay →' : '← Đã có tài khoản? Đăng nhập'}
              </button>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Bằng việc tiếp tục, bạn đồng ý với{' '}
            <a href="/terms" className="underline hover:text-foreground">Điều khoản</a>
            {' '}và{' '}
            <a href="/privacy" className="underline hover:text-foreground">Chính sách bảo mật</a>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;