-- Add new columns to banners table for page targeting and carousel
ALTER TABLE public.banners 
ADD COLUMN IF NOT EXISTS page_location TEXT DEFAULT 'home',
ADD COLUMN IF NOT EXISTS display_type TEXT DEFAULT 'hero',
ADD COLUMN IF NOT EXISTS autoplay_interval INTEGER DEFAULT 5000,
ADD COLUMN IF NOT EXISTS show_navigation BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_indicators BOOLEAN DEFAULT true;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_banners_page_location ON public.banners(page_location);
CREATE INDEX IF NOT EXISTS idx_banners_display_type ON public.banners(display_type);

-- Create seller_products table for seller product submissions
CREATE TABLE IF NOT EXISTS public.seller_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  category_id UUID REFERENCES public.categories(id),
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  video_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on seller_products
ALTER TABLE public.seller_products ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own products
CREATE POLICY "Sellers can view own products"
ON public.seller_products
FOR SELECT
USING (auth.uid() = seller_id);

-- Sellers can insert their own products
CREATE POLICY "Sellers can insert own products"
ON public.seller_products
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own pending/revision products
CREATE POLICY "Sellers can update own pending products"
ON public.seller_products
FOR UPDATE
USING (auth.uid() = seller_id AND status IN ('pending', 'revision_requested'));

-- Sellers can delete their own pending products
CREATE POLICY "Sellers can delete own pending products"
ON public.seller_products
FOR DELETE
USING (auth.uid() = seller_id AND status = 'pending');

-- Admins can manage all seller products
CREATE POLICY "Admins can manage seller products"
ON public.seller_products
FOR ALL
USING (is_admin());

-- Testers can view pending products for review
CREATE POLICY "Testers can view pending products"
ON public.seller_products
FOR SELECT
USING (is_tester(auth.uid()) AND status = 'pending');

-- Testers can update product status for review
CREATE POLICY "Testers can review products"
ON public.seller_products
FOR UPDATE
USING (is_tester(auth.uid()) AND status = 'pending');

-- Create trigger for updated_at
CREATE TRIGGER update_seller_products_updated_at
BEFORE UPDATE ON public.seller_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto generate slug for seller products
CREATE TRIGGER auto_generate_seller_product_slug
BEFORE INSERT OR UPDATE ON public.seller_products
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_product_slug();