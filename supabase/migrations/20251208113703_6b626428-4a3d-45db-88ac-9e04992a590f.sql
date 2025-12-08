-- Create function to decrease stock when order is created
CREATE OR REPLACE FUNCTION public.decrease_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  product_id UUID;
  order_quantity INTEGER;
BEGIN
  -- Loop through each item in the order
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    product_id := (item->>'product_id')::UUID;
    order_quantity := (item->>'quantity')::INTEGER;
    
    -- Decrease stock for this product
    UPDATE public.products 
    SET stock = GREATEST(0, COALESCE(stock, 0) - order_quantity)
    WHERE id = product_id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to run after order insert
DROP TRIGGER IF EXISTS trigger_decrease_stock_on_order ON public.orders;
CREATE TRIGGER trigger_decrease_stock_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.decrease_stock_on_order();