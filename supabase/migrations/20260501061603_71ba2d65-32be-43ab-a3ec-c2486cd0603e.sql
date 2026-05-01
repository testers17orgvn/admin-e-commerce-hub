-- 1. Add bank account fields to profiles for sellers
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_holder TEXT,
  ADD COLUMN IF NOT EXISTS bank_branch TEXT;

-- 2. Add payment fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'bank_transfer',
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seller_id UUID,
  ADD COLUMN IF NOT EXISTS confirmed_by UUID;

-- 3. Payment transactions log (for both manual confirms and webhook auto-match)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'incoming', -- incoming/refund
  source TEXT NOT NULL DEFAULT 'manual', -- manual / casso / sepay
  reference_code TEXT,
  bank_name TEXT,
  account_number TEXT,
  description TEXT,
  raw_payload JSONB DEFAULT '{}'::jsonb,
  matched BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all transactions" ON public.payment_transactions
  FOR ALL USING (is_admin());

CREATE POLICY "Sellers can view their order transactions" ON public.payment_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = payment_transactions.order_id AND o.seller_id = auth.uid())
  );

CREATE POLICY "Users can view their order transactions" ON public.payment_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = payment_transactions.order_id AND o.user_id = auth.uid())
  );

-- 4. Sellers update payment_status of their orders
CREATE POLICY "Sellers can update their orders" ON public.orders
  FOR UPDATE USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can view their orders" ON public.orders
  FOR SELECT USING (auth.uid() = seller_id);

-- 5. Trigger: when payment_status -> 'paid', notify seller + buyer, mark order confirmed
CREATE OR REPLACE FUNCTION public.notify_payment_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status) AND NEW.payment_status = 'paid' THEN
    -- Auto-confirm order
    IF NEW.status = 'pending' THEN
      NEW.status := 'confirmed';
    END IF;
    NEW.paid_at := COALESCE(NEW.paid_at, now());

    -- Notify buyer
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (NEW.user_id, '💰 Thanh toán thành công',
        'Đơn #' || LEFT(NEW.id::text, 8) || ' đã được xác nhận thanh toán. Sản phẩm đã thêm vào "Đã mua".',
        'payment', '/my-products');
    END IF;

    -- Notify seller
    IF NEW.seller_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (NEW.seller_id, '💵 Nhận thanh toán mới',
        'Đơn #' || LEFT(NEW.id::text, 8) || ' từ ' || NEW.customer_name || ' đã thanh toán ' || TO_CHAR(NEW.total_amount, 'FM999,999,999') || 'đ',
        'payment', '/seller/dashboard');
    END IF;

    -- Notify admins
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT ur.user_id, '✅ Đơn đã thanh toán',
      'Đơn #' || LEFT(NEW.id::text, 8) || ' - ' || TO_CHAR(NEW.total_amount, 'FM999,999,999') || 'đ',
      'payment', '/admin/orders'
    FROM public.user_roles ur WHERE ur.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_payment_received ON public.orders;
CREATE TRIGGER trg_notify_payment_received
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_payment_received();

-- 6. RPC for webhook auto-matching (used by edge function with service role; safe wrapper)
CREATE OR REPLACE FUNCTION public.match_payment_to_order(
  _amount NUMERIC,
  _description TEXT,
  _reference TEXT,
  _bank_name TEXT,
  _account_number TEXT,
  _raw JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched_order_id UUID;
  short_code TEXT;
BEGIN
  -- Try to find DH<short-id> pattern in description
  short_code := UPPER(SUBSTRING(COALESCE(_description, '') FROM 'DH([A-Fa-f0-9]{6,8})'));
  IF short_code IS NOT NULL THEN
    SELECT id INTO matched_order_id FROM public.orders
    WHERE UPPER(LEFT(id::text, LENGTH(short_code))) = short_code
      AND payment_status <> 'paid'
    LIMIT 1;
  END IF;

  -- Log transaction
  INSERT INTO public.payment_transactions (order_id, amount, source, reference_code, bank_name, account_number, description, raw_payload, matched)
  VALUES (matched_order_id, _amount, 'webhook', _reference, _bank_name, _account_number, _description, _raw, matched_order_id IS NOT NULL);

  -- Mark paid if amount enough
  IF matched_order_id IS NOT NULL THEN
    UPDATE public.orders
    SET payment_status = CASE WHEN _amount >= total_amount THEN 'paid' ELSE 'partial' END,
        paid_amount = COALESCE(paid_amount, 0) + _amount,
        payment_reference = COALESCE(payment_reference, _reference)
    WHERE id = matched_order_id;
  END IF;

  RETURN matched_order_id;
END;
$$;