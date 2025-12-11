import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PaymentQR } from '@/components/checkout/PaymentQR';

const Cart = () => {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
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

    const { data, error } = await supabase.from('orders').insert({
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone,
      customer_address: formData.address,
      items: orderItems,
      total_amount: totalPrice,
      notes: formData.notes,
    }).select('id').single();

    if (error) {
      toast.error('Đã có lỗi xảy ra. Vui lòng thử lại.');
      setLoading(false);
      return;
    }

    setOrderId(data.id);
    setShowPaymentQR(true);
    toast.success('Đặt hàng thành công! Vui lòng thanh toán theo mã QR bên dưới.');
    setLoading(false);
  };

  const handleCompleteOrder = () => {
    clearCart();
    navigate('/');
    toast.success('Cảm ơn bạn đã mua hàng!');
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
                    placeholder="email@example.com"
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
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span>Miễn phí</span>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-accent">{formatPrice(totalPrice)}</span>
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
                amount={totalPrice} 
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
