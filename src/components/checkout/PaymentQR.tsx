import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Smartphone } from 'lucide-react';

interface PaymentSettings {
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  momo_phone: string;
  momo_name: string;
  enable_bank: boolean;
  enable_momo: boolean;
}

interface PaymentQRProps {
  amount: number;
  orderDescription?: string;
  sellerId?: string | null;
}

export function PaymentQR({ amount, orderDescription = 'Thanh toan don hang', sellerId }: PaymentQRProps) {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      // Ưu tiên lấy tài khoản ngân hàng của seller
      if (sellerId) {
        const { data: seller } = await supabase
          .from('profiles')
          .select('bank_name, bank_account_number, bank_account_holder')
          .eq('id', sellerId)
          .maybeSingle();
        if (seller?.bank_account_number && seller?.bank_name) {
          setSettings({
            bank_name: seller.bank_name,
            bank_account: seller.bank_account_number,
            bank_holder: seller.bank_account_holder || '',
            momo_phone: '', momo_name: '',
            enable_bank: true, enable_momo: false,
          });
          setLoading(false);
          return;
        }
      }

      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'payment_settings')
        .maybeSingle();

      if (data?.value) {
        setSettings(data.value as unknown as PaymentSettings);
      }
      setLoading(false);
    }
    fetchSettings();
  }, [sellerId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Generate VietQR URL for bank transfer
  const generateBankQR = () => {
    if (!settings?.bank_account || !settings?.bank_name) return null;
    
    // VietQR format: https://img.vietqr.io/image/{bank_code}-{account_number}-{template}.png?amount={amount}&addInfo={description}
    const bankCodes: Record<string, string> = {
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
      'HDBank': 'HDB',
      'OCB': 'OCB',
      'SHB': 'SHB',
      'VIB': 'VIB',
      'MSB': 'MSB',
      'SeABank': 'SEAB',
      'Eximbank': 'EIB',
      'LienVietPostBank': 'LPB',
      'NamABank': 'NAB',
      'BacABank': 'BAB',
      'PVcomBank': 'PVCB',
      'SCB': 'SCB',
    };

    const bankCode = bankCodes[settings.bank_name] || settings.bank_name;
    const description = encodeURIComponent(orderDescription);
    
    return `https://img.vietqr.io/image/${bankCode}-${settings.bank_account}-compact2.png?amount=${amount}&addInfo=${description}&accountName=${encodeURIComponent(settings.bank_holder || '')}`;
  };

  // Generate MoMo QR URL
  const generateMomoQR = () => {
    if (!settings?.momo_phone) return null;
    
    // MoMo deeplink format for QR
    const momoData = `2|99|${settings.momo_phone}|||0|0|${amount}|${orderDescription}|transfer_myqr`;
    const encodedData = encodeURIComponent(momoData);
    
    // Use a QR generator API
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedData}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!settings || (!settings.enable_bank && !settings.enable_momo)) {
    return null;
  }

  const hasBank = settings.enable_bank && settings.bank_account;
  const hasMomo = settings.enable_momo && settings.momo_phone;

  if (!hasBank && !hasMomo) {
    return null;
  }

  const defaultTab = hasBank ? 'bank' : 'momo';

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Thanh toán chuyển khoản</CardTitle>
        <p className="text-sm text-muted-foreground">
          Quét mã QR để thanh toán với số tiền: <span className="font-bold text-accent">{formatPrice(amount)}</span>
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          {hasBank && hasMomo && (
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="bank" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Ngân hàng
              </TabsTrigger>
              <TabsTrigger value="momo" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                MoMo
              </TabsTrigger>
            </TabsList>
          )}

          {hasBank && (
            <TabsContent value="bank" className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <img
                    src={generateBankQR() || ''}
                    alt="Bank QR Code"
                    className="w-64 h-64 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
              <div className="text-center space-y-1 text-sm">
                <p><span className="text-muted-foreground">Ngân hàng:</span> <strong>{settings.bank_name}</strong></p>
                <p><span className="text-muted-foreground">Số tài khoản:</span> <strong>{settings.bank_account}</strong></p>
                <p><span className="text-muted-foreground">Chủ tài khoản:</span> <strong>{settings.bank_holder}</strong></p>
                <p><span className="text-muted-foreground">Số tiền:</span> <strong className="text-accent">{formatPrice(amount)}</strong></p>
                <p><span className="text-muted-foreground">Nội dung:</span> <strong>{orderDescription}</strong></p>
              </div>
            </TabsContent>
          )}

          {hasMomo && (
            <TabsContent value="momo" className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-4 rounded-lg">
                  <div className="bg-white p-2 rounded-lg">
                    <img
                      src={generateMomoQR() || ''}
                      alt="MoMo QR Code"
                      className="w-60 h-60 object-contain"
                    />
                  </div>
                </div>
              </div>
              <div className="text-center space-y-1 text-sm">
                <p><span className="text-muted-foreground">Số điện thoại:</span> <strong>{settings.momo_phone}</strong></p>
                <p><span className="text-muted-foreground">Tên:</span> <strong>{settings.momo_name}</strong></p>
                <p><span className="text-muted-foreground">Số tiền:</span> <strong className="text-accent">{formatPrice(amount)}</strong></p>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Sau khi chuyển khoản, đơn hàng sẽ được xử lý trong 24h
        </p>
      </CardContent>
    </Card>
  );
}
