import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaymentQR } from '@/components/checkout/PaymentQR';

interface AppliedVoucher {
  id: string;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
  max_discount: number | null;
  min_order_value: number | null;
}

const Cart = () => {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCheckout, setIsCheckout] = useState(false);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  
  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Calculate discount amount
  const calculateDiscount = () => {
    if (!appliedVoucher) return 0;
    
    let discount = 0;
    if (appliedVoucher.discount_type === 'percentage') {
      discount = (totalPrice * appliedVoucher.discount_value) / 100;
      if (appliedVoucher.max_discount && discount > appliedVoucher.max_discount) {
        discount = appliedVoucher.max_discount;
      }
    } else {
      discount = appliedVoucher.discount_value;
    }
    
    return Math.min(discount, totalPrice);
  };

  const discountAmount = calculateDiscount();
  const finalPrice = totalPrice - discountAmount;

  // Apply voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }

    setVoucherLoading(true);
    try {
      // Check if voucher exists and is valid
      const { data: voucher, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !voucher) {
        toast.error('Mã giảm giá không hợp lệ hoặc không tồn tại');
        return;
      }

      // Check date validity
      const now = new Date();
      const startDate = new Date(voucher.start_date);
      const endDate = new Date(voucher.end_date);
      
      if (now < startDate || now > endDate) {
        toast.error('Mã giảm giá đã hết hạn hoặc chưa được kích hoạt');
        return;
      }

      // Check usage limit
      if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
        toast.error('Mã giảm giá đã hết lượt sử dụng');
        return;
      }

      // Check minimum order value
      if (voucher.min_order_value && totalPrice < voucher.min_order_value) {
        toast.error(`Đơn hàng tối thiểu ${formatPrice(voucher.min_order_value)} để áp dụng mã này`);
        return;
      }

      // Check if user already used this voucher (if logged in)
      if (user) {
        const { data: userVoucher } = await supabase
          .from('user_vouchers')
          .select('*')
          .eq('user_id', user.id)
          .eq('voucher_id', voucher.id)
          .eq('is_used', true)
          .single();

        if (userVoucher) {
          toast.error('Bạn đã sử dụng mã giảm giá này rồi');
          return;
        }
      }

      setAppliedVoucher({
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        discount_type: voucher.discount_type,
        discount_value: voucher.discount_value,
        max_discount: voucher.max_discount,
        min_order_value: voucher.min_order_value,
      });
      setVoucherCode('');
      toast.success(`Áp dụng mã "${voucher.code}" thành công!`);
    } catch (error) {
      toast.error('Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setVoucherLoading(false);
    }
  };

  // Remove voucher
  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    toast.info('Đã hủy mã giảm giá');
  };

  // Auto-fill từ profile khi user đăng nhập
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, address')
        .eq('id', user.id)
        .single();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          name: profile.full_name || prev.name,
          email: user.email || prev.email,
          phone: profile.phone || prev.phone,
          address: profile.address || prev.address,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          email: user.email || prev.email,
        }));
      }
    };

    fetchProfile();
  }, [user]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    const orderItems = items.map(item => ({
      product_id: item.id,
      product_name: item.name,
      price: item.price,
      quantity: item.quantity,
      image_url: item.image_url,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
    }));

    const orderNotes = appliedVoucher 
      ? `${formData.notes ? formData.notes + '\n' : ''}Mã giảm giá: ${appliedVoucher.code} (-${formatPrice(discountAmount)})`
      : formData.notes;

    const { data, error } = await supabase.from('orders').insert({
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone,
      customer_address: formData.address,
      items: orderItems,
      total_amount: finalPrice,
      notes: orderNotes,
      user_id: user?.id || null,
    }).select('id').single();

    if (error) {
      toast.error('Đã có lỗi xảy ra. Vui lòng thử lại.');
      setLoading(false);
      return;
    }

    // Update voucher usage
    if (appliedVoucher) {
      // First get current used_count
      const { data: voucherData } = await supabase
        .from('vouchers')
        .select('used_count')
        .eq('id', appliedVoucher.id)
        .single();

      if (voucherData) {
        await supabase
          .from('vouchers')
          .update({ used_count: (voucherData.used_count || 0) + 1 })
          .eq('id', appliedVoucher.id);
      }

      // Track user voucher usage if logged in
      if (user) {
        await supabase.from('user_vouchers').upsert({
          user_id: user.id,
          voucher_id: appliedVoucher.id,
          is_used: true,
          used_at: new Date().toISOString(),
        });
      }
    }

    setOrderId(data.id);
    setShowPaymentQR(true);
    toast.success('Đặt hàng thành công! Vui lòng thanh toán theo mã QR bên dưới.');
    setLoading(false);
  };

  const handleCompleteOrder = () => {
    clearCart();
    if (orderId) {
      navigate(`/orders/${orderId}`);
    } else {
      navigate('/orders');
    }
    toast.success('Cảm ơn bạn đã mua hàng! Đơn hàng đang được xử lý.');
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="font-display text-3xl font-bold mb-4">Giỏ hàng trống</h1>
          <p className="text-muted-foreground mb-8">
            Bạn chưa có sản phẩm nào trong giỏ hàng
          </p>
          <Link to="/products">
            <Button variant="hero" size="lg">
              Tiếp tục mua sắm
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">
          {isCheckout ? 'Thanh toán' : 'Giỏ hàng'}
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {!isCheckout ? (
              items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex gap-4 p-4 bg-card rounded-lg border"
                >
                  <Link to={`/products/${item.slug}`} className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-md overflow-hidden bg-muted">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.slug}`}>
                      <h3 className="font-medium hover:text-accent transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                    </Link>
                    {/* Show selected variants */}
                    {(item.selectedColor || item.selectedSize) && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        {item.selectedColor && (
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-current" style={{ color: item.selectedColor === 'Đen' ? '#000' : item.selectedColor === 'Trắng' ? '#fff' : undefined }} />
                            {item.selectedColor}
                          </span>
                        )}
                        {item.selectedColor && item.selectedSize && <span>•</span>}
                        {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                      </div>
                    )}
                    <p className="text-lg font-semibold mt-1">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeItem(item.cartItemId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Họ tên *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@vsm.org.vn"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Số điện thoại *</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0909 123 456"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Địa chỉ giao hàng *</label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ghi chú</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ghi chú cho đơn hàng (tùy chọn)"
                  />
                </div>
              </form>
            )}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-lg border p-6 space-y-4">
              <h2 className="font-display text-xl font-bold">Tóm tắt đơn hàng</h2>
              
              {/* Voucher Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Mã giảm giá
                </label>
                {appliedVoucher ? (
                  <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg border border-accent/20">
                    <div>
                      <p className="font-medium text-accent">{appliedVoucher.code}</p>
                      <p className="text-xs text-muted-foreground">{appliedVoucher.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={handleRemoveVoucher}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      placeholder="Nhập mã giảm giá"
                      className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyVoucher()}
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleApplyVoucher}
                      disabled={voucherLoading}
                    >
                      {voucherLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Áp dụng'
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between text-accent">
                    <span>Giảm giá ({appliedVoucher.code})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span>Miễn phí</span>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-accent">{formatPrice(finalPrice)}</span>
                </div>
              </div>
              {!isCheckout ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setIsCheckout(true)}
                >
                  Tiến hành thanh toán
                </Button>
              ) : !showPaymentQR ? (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    size="lg"
                    type="submit"
                    form="checkout-form"
                    disabled={loading}
                  >
                    {loading ? 'Đang xử lý...' : 'Đặt hàng'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsCheckout(false)}
                  >
                    Quay lại giỏ hàng
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCompleteOrder}
                >
                  Hoàn tất đơn hàng
                </Button>
              )}
            </div>

            {/* Payment QR */}
            {showPaymentQR && (
              <PaymentQR 
                amount={finalPrice} 
                orderDescription={`DH${orderId?.slice(0, 8).toUpperCase()}`} 
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
