import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Landmark, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BANKS = [
  'Vietcombank', 'Techcombank', 'MB Bank', 'BIDV', 'Agribank', 'VPBank',
  'ACB', 'Sacombank', 'VietinBank', 'TPBank', 'HDBank', 'OCB', 'SHB',
  'VIB', 'MSB', 'SeABank', 'Eximbank',
];

export function SellerBankSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
    bank_branch: '',
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('bank_name, bank_account_number, bank_account_holder, bank_branch')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setForm({
          bank_name: data.bank_name || '',
          bank_account_number: data.bank_account_number || '',
          bank_account_holder: data.bank_account_holder || '',
          bank_branch: data.bank_branch || '',
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (!form.bank_name || !form.bank_account_number || !form.bank_account_holder) {
      toast.error('Vui lòng điền đầy đủ ngân hàng, số tài khoản và chủ tài khoản');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id);
    setSaving(false);
    if (error) toast.error('Lưu thất bại: ' + error.message);
    else toast.success('Đã lưu thông tin tài khoản nhận tiền');
  };

  return (
    <Card className="border-emerald-200 dark:border-emerald-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
            <Landmark className="h-4 w-4" />
          </div>
          Tài khoản nhận tiền
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Khách hàng sẽ thanh toán trực tiếp vào tài khoản này khi mua sản phẩm của bạn.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Ngân hàng *</Label>
            <Select
              value={form.bank_name}
              onValueChange={(v) => setForm({ ...form, bank_name: v })}
              disabled={loading}
            >
              <SelectTrigger><SelectValue placeholder="Chọn ngân hàng" /></SelectTrigger>
              <SelectContent>
                {BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Số tài khoản *</Label>
            <Input
              value={form.bank_account_number}
              onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
              placeholder="VD: 1234567890"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Chủ tài khoản *</Label>
            <Input
              value={form.bank_account_holder}
              onChange={(e) => setForm({ ...form, bank_account_holder: e.target.value.toUpperCase() })}
              placeholder="NGUYEN VAN A"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Chi nhánh</Label>
            <Input
              value={form.bank_branch}
              onChange={(e) => setForm({ ...form, bank_branch: e.target.value })}
              placeholder="VD: Hà Nội"
              disabled={loading}
            />
          </div>
        </div>
        <Button onClick={save} disabled={saving || loading} className="w-full md:w-auto">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Lưu thông tin
        </Button>
      </CardContent>
    </Card>
  );
}
