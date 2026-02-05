-- Create shipper_locations table for realtime tracking
CREATE TABLE public.shipper_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  heading double precision,
  speed double precision,
  is_online boolean DEFAULT true,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create order_tracking table for delivery status timeline
CREATE TABLE public.order_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  location_lat double precision,
  location_lng double precision,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Add shipper related columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipper_id uuid,
ADD COLUMN IF NOT EXISTS delivery_address_lat double precision,
ADD COLUMN IF NOT EXISTS delivery_address_lng double precision,
ADD COLUMN IF NOT EXISTS estimated_delivery timestamp with time zone,
ADD COLUMN IF NOT EXISTS actual_delivery timestamp with time zone,
ADD COLUMN IF NOT EXISTS shipper_status text DEFAULT 'unassigned';

-- Enable RLS
ALTER TABLE public.shipper_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shipper_locations_shipper ON public.shipper_locations(shipper_id);
CREATE INDEX IF NOT EXISTS idx_shipper_locations_order ON public.shipper_locations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order ON public.order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipper ON public.orders(shipper_id);

-- RLS policies for shipper_locations
CREATE POLICY "Shippers can insert their own locations"
ON public.shipper_locations FOR INSERT
WITH CHECK (auth.uid() = shipper_id);

CREATE POLICY "Shippers can update their own locations"
ON public.shipper_locations FOR UPDATE
USING (auth.uid() = shipper_id);

CREATE POLICY "Shippers can view their own locations"
ON public.shipper_locations FOR SELECT
USING (auth.uid() = shipper_id);

CREATE POLICY "Order owners can view shipper locations"
ON public.shipper_locations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = shipper_locations.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all shipper locations"
ON public.shipper_locations FOR ALL
USING (is_admin());

-- RLS policies for order_tracking
CREATE POLICY "Users can view tracking for their orders"
ON public.order_tracking FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_tracking.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Shippers can insert tracking for assigned orders"
ON public.order_tracking FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_tracking.order_id 
    AND orders.shipper_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all order tracking"
ON public.order_tracking FOR ALL
USING (is_admin());

-- Function to check if user is a shipper
CREATE OR REPLACE FUNCTION public.is_shipper(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'shipper'
  )
$$;

-- Enable realtime for shipper_locations and order_tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipper_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_tracking;

-- Create trigger function for seller product status notifications
CREATE OR REPLACE FUNCTION public.notify_seller_product_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.seller_id,
        '✅ Sản phẩm được duyệt',
        'Sản phẩm "' || NEW.name || '" đã được phê duyệt và sẽ được đăng bán.',
        'product',
        '/seller/products'
      );
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.seller_id,
        '❌ Sản phẩm bị từ chối',
        'Sản phẩm "' || NEW.name || '" đã bị từ chối. Lý do: ' || COALESCE(NEW.rejection_reason, 'Không đạt yêu cầu'),
        'product',
        '/seller/products'
      );
    ELSIF NEW.status = 'revision_requested' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.seller_id,
        '📝 Yêu cầu chỉnh sửa sản phẩm',
        'Sản phẩm "' || NEW.name || '" cần chỉnh sửa. ' || COALESCE(NEW.rejection_reason, ''),
        'product',
        '/seller/products'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_seller_product_status
AFTER UPDATE ON public.seller_products
FOR EACH ROW
EXECUTE FUNCTION public.notify_seller_product_status();

-- Create trigger function for seller request status notifications
CREATE OR REPLACE FUNCTION public.notify_seller_request_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.user_id,
        '🎉 Đăng ký bán hàng được duyệt',
        'Chúc mừng! Yêu cầu đăng ký bán hàng của bạn đã được phê duyệt.',
        'seller',
        '/seller/dashboard'
      );
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.user_id,
        '❌ Đăng ký bán hàng bị từ chối',
        'Yêu cầu đăng ký bán hàng đã bị từ chối. Lý do: ' || COALESCE(NEW.rejection_reason, 'Không đạt yêu cầu'),
        'seller',
        '/profile'
      );
    ELSIF NEW.status = 'revision_requested' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.user_id,
        '📝 Yêu cầu bổ sung hồ sơ',
        'Yêu cầu đăng ký bán hàng cần bổ sung. ' || COALESCE(NEW.rejection_reason, ''),
        'seller',
        '/profile'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_seller_request_status
AFTER UPDATE ON public.seller_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_seller_request_status();

-- Create trigger function for order shipper notifications
CREATE OR REPLACE FUNCTION public.notify_order_shipper_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.shipper_id IS NULL AND NEW.shipper_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.shipper_id,
      '📦 Đơn hàng mới được giao',
      'Bạn được giao đơn hàng #' || LEFT(NEW.id::text, 8) || ' - ' || NEW.customer_name,
      'order',
      '/shipper/orders'
    );
    
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.user_id,
        '🚚 Đơn hàng đã có người giao',
        'Đơn hàng #' || LEFT(NEW.id::text, 8) || ' đã được giao cho shipper.',
        'order',
        '/orders'
      );
    END IF;
  END IF;
  
  IF OLD.shipper_status IS DISTINCT FROM NEW.shipper_status AND NEW.user_id IS NOT NULL THEN
    IF NEW.shipper_status = 'picking_up' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (NEW.user_id, '📍 Đang lấy hàng', 'Shipper đang đến lấy đơn hàng #' || LEFT(NEW.id::text, 8), 'order', '/orders/' || NEW.id);
    ELSIF NEW.shipper_status = 'delivering' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (NEW.user_id, '🚗 Đang giao hàng', 'Đơn hàng #' || LEFT(NEW.id::text, 8) || ' đang được giao đến bạn.', 'order', '/orders/' || NEW.id);
    ELSIF NEW.shipper_status = 'delivered' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (NEW.user_id, '✅ Đã giao thành công', 'Đơn hàng #' || LEFT(NEW.id::text, 8) || ' đã được giao thành công!', 'order', '/orders/' || NEW.id);
    ELSIF NEW.shipper_status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (NEW.user_id, '❌ Giao hàng thất bại', 'Đơn hàng #' || LEFT(NEW.id::text, 8) || ' không thể giao.', 'order', '/orders/' || NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_order_shipper
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_shipper_assignment();