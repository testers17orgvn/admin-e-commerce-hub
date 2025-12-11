-- Create payment_settings in settings table for bank/momo QR codes
-- Admin will store their bank account/momo number to auto-generate QR codes

-- Note: We'll use the existing settings table with keys like:
-- 'payment_bank_name', 'payment_bank_account', 'payment_bank_holder', 'payment_momo_phone', 'payment_momo_name'
-- No new table needed, just inserting default settings

INSERT INTO public.settings (key, value) VALUES
  ('payment_settings', '{"bank_name": "", "bank_account": "", "bank_holder": "", "momo_phone": "", "momo_name": "", "enable_bank": true, "enable_momo": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;