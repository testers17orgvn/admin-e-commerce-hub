
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can create order" ON public.orders;
CREATE POLICY "Anyone can create order"
ON public.orders
FOR INSERT
TO public
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contacts;
CREATE POLICY "Anyone can submit contact"
ON public.contacts
FOR INSERT
TO public
WITH CHECK (
  name IS NOT NULL AND length(btrim(name)) > 0
  AND email IS NOT NULL AND length(btrim(email)) > 0
);

DROP POLICY IF EXISTS "Authenticated users can add participants" ON public.chat_participants;
CREATE POLICY "Users can add themselves as participants"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
