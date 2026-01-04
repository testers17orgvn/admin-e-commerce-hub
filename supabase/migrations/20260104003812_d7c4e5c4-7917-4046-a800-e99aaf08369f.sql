-- Allow users to update their own orders (for cancellation)
CREATE POLICY "Users can update own pending orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'cancelled'));