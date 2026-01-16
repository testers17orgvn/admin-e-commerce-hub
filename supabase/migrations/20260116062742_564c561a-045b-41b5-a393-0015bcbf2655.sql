-- Enable realtime for orders table
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Create function to notify admins when new order is placed
CREATE OR REPLACE FUNCTION public.notify_admins_new_order()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
BEGIN
  -- Insert notification for each admin
  FOR admin_record IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      admin_record.user_id,
      'Đơn hàng mới #' || LEFT(NEW.id::text, 8),
      'Khách hàng ' || NEW.customer_name || ' đã đặt đơn hàng trị giá ' || 
      TO_CHAR(NEW.total_amount, 'FM999,999,999') || 'đ',
      'order',
      '/admin/orders'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to call function on new order
DROP TRIGGER IF EXISTS trigger_notify_admins_new_order ON public.orders;
CREATE TRIGGER trigger_notify_admins_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_order();