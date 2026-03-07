
CREATE TABLE public.shipper_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  shipper_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, user_id)
);

ALTER TABLE public.shipper_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reviews" ON public.shipper_reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reviews" ON public.shipper_reviews
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Shippers can view their reviews" ON public.shipper_reviews
  FOR SELECT TO authenticated
  USING (auth.uid() = shipper_id);

CREATE POLICY "Admins can manage all reviews" ON public.shipper_reviews
  FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can update own reviews" ON public.shipper_reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
