-- Function to generate slug from Vietnamese text
CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  result text;
BEGIN
  result := input_text;
  
  -- Convert Vietnamese characters to ASCII
  result := TRANSLATE(result, 
    'àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ',
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD'
  );
  
  -- Convert to lowercase
  result := LOWER(result);
  
  -- Replace spaces and special characters with hyphens
  result := REGEXP_REPLACE(result, '[^a-z0-9]+', '-', 'g');
  
  -- Remove leading/trailing hyphens
  result := TRIM(BOTH '-' FROM result);
  
  -- Ensure non-empty
  IF result = '' OR result IS NULL THEN
    result := 'san-pham-' || SUBSTRING(gen_random_uuid()::text, 1, 8);
  END IF;
  
  RETURN result;
END;
$$;

-- Trigger function to auto-generate slug
CREATE OR REPLACE FUNCTION public.auto_generate_product_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only generate slug if it's empty or null
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_slug(NEW.name);
    
    -- Add unique suffix if slug already exists
    IF EXISTS (SELECT 1 FROM public.products WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
      NEW.slug := NEW.slug || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for products table
DROP TRIGGER IF EXISTS trigger_auto_generate_product_slug ON public.products;
CREATE TRIGGER trigger_auto_generate_product_slug
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_product_slug();

-- Also create similar trigger for categories
CREATE OR REPLACE FUNCTION public.auto_generate_category_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_slug(NEW.name);
    
    IF EXISTS (SELECT 1 FROM public.categories WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
      NEW.slug := NEW.slug || '-' || SUBSTRING(gen_random_uuid()::text, 1, 8);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_generate_category_slug ON public.categories;
CREATE TRIGGER trigger_auto_generate_category_slug
  BEFORE INSERT OR UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_category_slug();