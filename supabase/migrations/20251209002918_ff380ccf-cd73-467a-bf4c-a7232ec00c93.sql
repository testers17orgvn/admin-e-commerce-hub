-- Add phone and address to profiles for auto-fill when ordering
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text;

-- Add user_id to orders to link orders to customers (optional - when logged in)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Create index for user_id on orders
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Update RLS for orders - allow users to see their own orders
CREATE POLICY "Users can view own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Update RLS for profiles - allow public to view profiles (for admin)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (is_admin());