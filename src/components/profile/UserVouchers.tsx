import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ticket, Gift, Clock, Copy, CheckCircle, Loader2, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface UserVoucher {
  id: string;
  voucher_id: string;
  is_used: boolean;
  claimed_at: string;
  voucher: Voucher;
}

export function UserVouchers() {
  const { user } = useAuth();
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([]);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;

    // Fetch user's claimed vouchers
    const { data: userVouchersData } = await supabase
      .from('user_vouchers')
      .select('*, voucher:vouchers(*)')
      .eq('user_id', user.id)
      .order('claimed_at', { ascending: false });

    if (userVouchersData) {
      setUserVouchers(userVouchersData as unknown as UserVoucher[]);
    }

    // Fetch available vouchers to claim
    const now = new Date().toISOString();
    const { data: availableData } = await supabase
      .from('vouchers')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now);

    if (availableData) {
      // Filter out already claimed vouchers
      const claimedIds = (userVouchersData || []).map(uv => (uv as any).voucher_id);
      const available = (availableData as Voucher[]).filter(v => !claimedIds.includes(v.id));
      setAvailableVouchers(available);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const claimVoucher = async (voucherId: string) => {
    if (!user) return;
    
    setClaiming(voucherId);
    const { error } = await supabase.from('user_vouchers').insert([{
      user_id: user.id,
      voucher_id: voucherId,
    }]);

    if (error) {
      if (error.message.includes('duplicate')) {
        toast.error('Bạn đã nhận voucher này rồi');
      } else {
        toast.error('Lỗi nhận voucher');
      }
    } else {
      toast.success('Nhận voucher thành công!');
      fetchData();
    }
    setClaiming(null);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã sao chép mã: ' + code);
  };

  const getVoucherStatus = (voucher: Voucher, isUsed: boolean) => {
    const now = new Date();
    const endDate = new Date(voucher.end_date);
    
    if (isUsed) return { label: 'Đã sử dụng', color: 'bg-gray-100 text-gray-600' };
    if (now > endDate) return { label: 'Hết hạn', color: 'bg-red-100 text-red-600' };
    return { label: 'Có thể sử dụng', color: 'bg-green-100 text-green-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Vouchers */}
      {availableVouchers.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <Gift className="h-5 w-5 text-accent" />
            Voucher có thể nhận
          </h3>
          <div className="grid gap-4">
            {availableVouchers.map((voucher) => (
              <Card key={voucher.id} className="overflow-hidden border-dashed border-2 border-accent/30 hover:border-accent transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center flex-shrink-0">
                      {voucher.discount_type === 'percentage' ? (
                        <div className="text-center">
                          <span className="text-2xl font-bold text-accent">{voucher.discount_value}%</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <span className="text-lg font-bold text-accent">{(voucher.discount_value / 1000)}K</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate">{voucher.name}</h4>
                      {voucher.description && (
                        <p className="text-sm text-muted-foreground truncate">{voucher.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        HSD: {format(new Date(voucher.end_date), 'dd/MM/yyyy', { locale: vi })}
                      </div>
                    </div>
                    <Button 
                      onClick={() => claimVoucher(voucher.id)}
                      disabled={claiming === voucher.id}
                      className="bg-accent hover:bg-accent/90"
                    >
                      {claiming === voucher.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Nhận ngay'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* My Vouchers */}
      <div>
        <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
          <Ticket className="h-5 w-5 text-accent" />
          Voucher của tôi ({userVouchers.length})
        </h3>
        
        {userVouchers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Ticket className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="font-medium mb-2">Chưa có voucher nào</h4>
              <p className="text-muted-foreground text-sm">
                Nhận voucher từ cửa hàng để được giảm giá khi mua hàng
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {userVouchers.map((uv) => {
              const status = getVoucherStatus(uv.voucher, uv.is_used);
              return (
                <Card key={uv.id} className={`overflow-hidden ${uv.is_used ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 ${uv.is_used ? 'bg-gray-100' : 'bg-gradient-to-br from-accent/20 to-accent/5'}`}>
                        {uv.voucher.discount_type === 'percentage' ? (
                          <div className="text-center">
                            <span className={`text-2xl font-bold ${uv.is_used ? 'text-gray-400' : 'text-accent'}`}>{uv.voucher.discount_value}%</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className={`text-lg font-bold ${uv.is_used ? 'text-gray-400' : 'text-accent'}`}>{(uv.voucher.discount_value / 1000)}K</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold truncate">{uv.voucher.name}</h4>
                          <Badge variant="secondary" className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono font-bold">
                            {uv.voucher.code}
                          </code>
                          {!uv.is_used && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(uv.voucher.code)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {uv.voucher.min_order_value > 0 && (
                            <span>Đơn tối thiểu: {uv.voucher.min_order_value.toLocaleString('vi-VN')}đ</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            HSD: {format(new Date(uv.voucher.end_date), 'dd/MM/yyyy', { locale: vi })}
                          </span>
                        </div>
                      </div>
                      {uv.is_used && (
                        <CheckCircle className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
