
-- Allow shippers to view orders assigned to them
CREATE POLICY "Shippers can view assigned orders"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = shipper_id);

-- Allow shippers to update orders assigned to them (shipper_status, actual_delivery)
CREATE POLICY "Shippers can update assigned orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() = shipper_id)
WITH CHECK (auth.uid() = shipper_id);

-- Allow shippers to view tracking for their assigned orders
CREATE POLICY "Shippers can view tracking for assigned orders"
ON public.order_tracking
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_tracking.order_id
  AND orders.shipper_id = auth.uid()
));
