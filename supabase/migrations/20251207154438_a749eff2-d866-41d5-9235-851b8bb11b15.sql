-- Add new columns to products table for enhanced product management
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS colors text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_hot boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.products.colors IS 'Available colors for this product';
COMMENT ON COLUMN public.products.sizes IS 'Available sizes for this product';
COMMENT ON COLUMN public.products.tags IS 'Product tags/labels';
COMMENT ON COLUMN public.products.is_hot IS 'Mark product as hot/trending';