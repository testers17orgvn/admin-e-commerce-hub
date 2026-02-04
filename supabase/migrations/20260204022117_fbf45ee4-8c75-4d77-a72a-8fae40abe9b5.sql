-- Add business profile columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS business_type text,
ADD COLUMN IF NOT EXISTS business_model text,
ADD COLUMN IF NOT EXISTS business_license_url text,
ADD COLUMN IF NOT EXISTS business_description text,
ADD COLUMN IF NOT EXISTS tax_code text,
ADD COLUMN IF NOT EXISTS is_verified_seller boolean DEFAULT false;

-- Create seller_requests table for role change requests
CREATE TABLE IF NOT EXISTS public.seller_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_type text NOT NULL,
  business_model text NOT NULL,
  business_description text,
  product_categories text[] DEFAULT '{}',
  business_license_url text,
  tax_code text,
  phone text NOT NULL,
  address text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.seller_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seller_requests
CREATE POLICY "Users can view own requests" ON public.seller_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests" ON public.seller_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending requests" ON public.seller_requests
  FOR UPDATE USING (auth.uid() = user_id AND status IN ('pending', 'revision_requested'));

CREATE POLICY "Admins can view all requests" ON public.seller_requests
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all requests" ON public.seller_requests
  FOR UPDATE USING (is_admin());

CREATE POLICY "Testers can view pending requests" ON public.seller_requests
  FOR SELECT USING (is_tester(auth.uid()) AND status = 'pending');

CREATE POLICY "Testers can update pending requests" ON public.seller_requests
  FOR UPDATE USING (is_tester(auth.uid()) AND status = 'pending');

-- Trigger for updated_at
CREATE TRIGGER update_seller_requests_updated_at
  BEFORE UPDATE ON public.seller_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index
CREATE INDEX IF NOT EXISTS idx_seller_requests_status ON public.seller_requests(status);
CREATE INDEX IF NOT EXISTS idx_seller_requests_user_id ON public.seller_requests(user_id);