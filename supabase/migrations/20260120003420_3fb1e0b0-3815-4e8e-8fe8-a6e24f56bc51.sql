-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for variant stock management
CREATE TABLE public.product_variant_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color TEXT,
  size TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, color, size)
);

-- Enable Row Level Security
ALTER TABLE public.product_variant_stock ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view variant stock"
ON public.product_variant_stock
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage variant stock"
ON public.product_variant_stock
FOR ALL
USING (public.is_admin());

-- Create trigger for updating timestamps
CREATE TRIGGER update_product_variant_stock_updated_at
BEFORE UPDATE ON public.product_variant_stock
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();