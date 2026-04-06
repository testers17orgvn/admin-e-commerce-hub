
-- User online status table
CREATE TABLE public.user_online_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_online boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  show_activity boolean NOT NULL DEFAULT true
);

ALTER TABLE public.user_online_status ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view online status
CREATE POLICY "Anyone can view online status"
ON public.user_online_status FOR SELECT
TO authenticated
USING (true);

-- Users can manage their own status
CREATE POLICY "Users can manage own status"
ON public.user_online_status FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_online_status;
