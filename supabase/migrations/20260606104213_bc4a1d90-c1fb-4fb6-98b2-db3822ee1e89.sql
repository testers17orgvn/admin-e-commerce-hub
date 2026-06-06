CREATE OR REPLACE FUNCTION public.claim_voucher(_voucher_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v RECORD;
BEGIN
  SELECT * INTO v FROM public.vouchers
   WHERE id = _voucher_id AND is_active = true
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_voucher');
  END IF;

  IF v.end_date IS NOT NULL AND v.end_date < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;

  IF v.usage_limit IS NOT NULL AND COALESCE(v.used_count, 0) >= v.usage_limit THEN
    RETURN jsonb_build_object('success', false, 'error', 'limit_reached');
  END IF;

  UPDATE public.vouchers
     SET used_count = COALESCE(used_count, 0) + 1,
         updated_at = now()
   WHERE id = v.id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_voucher(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_voucher(uuid) TO authenticated, service_role;