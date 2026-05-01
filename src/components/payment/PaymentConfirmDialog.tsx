import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  orderId: string;
  totalAmount: number;
  onConfirmed?: () => void;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm';
}

export function PaymentConfirmDialog({ orderId, totalAmount, onConfirmed, variant = 'default', size = 'default' }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(String(totalAmount));
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  const confirm = async () => {
    if (!user) return;
    const paid = Number(amount);
    if (!paid || paid <= 0) {
      toast.error('Số tiền không hợp lệ');
      return;
    }
    setLoading(true);
    const status = paid >= totalAmount ? 'paid' : 'partial';
    const { error: e1 } = await supabase
      .from('orders')
      .update({
        payment_status: status,
        paid_amount: paid,
        payment_reference: reference || null,
        confirmed_by: user.id,
      })
      .eq('id', orderId);

    if (e1) {
      setLoading(false);
      toast.error('Cập nhật thất bại: ' + e1.message);
      return;
    }

    await supabase.from('payment_transactions').insert({
      order_id: orderId,
      amount: paid,
      source: 'manual',
      reference_code: reference || null,
      description: note || null,
      created_by: user.id,
      matched: true,
    });

    setLoading(false);
    setOpen(false);
    toast.success(status === 'paid' ? '✅ Đã xác nhận thanh toán' : 'Đã ghi nhận thanh toán một phần');
    onConfirmed?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <CheckCircle2 className="h-4 w-4" /> Xác nhận thanh toán
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận đã nhận tiền</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Số tiền đã nhận (VND)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(totalAmount)}
            />
            <p className="text-xs text-muted-foreground">
              Tổng đơn: {new Intl.NumberFormat('vi-VN').format(totalAmount)}đ
            </p>
          </div>
          <div className="space-y-2">
            <Label>Mã giao dịch / Mã tham chiếu</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="VD: FT2026050100123"
            />
          </div>
          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
          <Button onClick={confirm} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
