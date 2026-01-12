-- Create vouchers table
CREATE TABLE public.vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_discount NUMERIC(10,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_vouchers for tracking user-claimed vouchers
CREATE TABLE public.user_vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, voucher_id)
);

-- Create user_addresses table for address book
CREATE TABLE public.user_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  province VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  ward VARCHAR(100),
  address_detail TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create contact_settings table for CMS contact page
CREATE TABLE public.contact_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;

-- Vouchers policies (public read, admin write)
CREATE POLICY "Anyone can view active vouchers" ON public.vouchers FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage vouchers" ON public.vouchers FOR ALL USING (public.is_admin());

-- User vouchers policies
CREATE POLICY "Users can view their vouchers" ON public.user_vouchers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can claim vouchers" ON public.user_vouchers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their vouchers" ON public.user_vouchers FOR UPDATE USING (auth.uid() = user_id);

-- User addresses policies
CREATE POLICY "Users can manage their addresses" ON public.user_addresses FOR ALL USING (auth.uid() = user_id);

-- Contact settings policies (public read, admin write)
CREATE POLICY "Anyone can view contact settings" ON public.contact_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage contact settings" ON public.contact_settings FOR ALL USING (public.is_admin());

-- Insert default contact settings
INSERT INTO public.contact_settings (key, value) VALUES 
  ('address', '123 Nguyễn Huệ, Quận 1, TP.HCM'),
  ('phone', '0909 123 456'),
  ('email', 'contact@luxeshop.vn'),
  ('working_hours', 'Thứ 2 - Thứ 7: 9:00 - 21:00\nChủ nhật: 10:00 - 18:00'),
  ('map_embed', ''),
  ('facebook', ''),
  ('zalo', ''),
  ('intro_title', 'Liên hệ với chúng tôi'),
  ('intro_description', 'Hãy liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào');