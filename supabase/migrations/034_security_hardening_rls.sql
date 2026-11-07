-- ============================================================
-- Pizza Shop Platform — Migration 034: Security & RLS Hardening
-- Resolves Cloudflare Security Audit Findings
-- ============================================================

-- 1. Restrict delivery_riders table mutation to service_role only
DROP POLICY IF EXISTS "Public access to delivery_riders" ON public.delivery_riders;
DROP POLICY IF EXISTS "Allow public read access to delivery_riders" ON public.delivery_riders;
DROP POLICY IF EXISTS "Allow service_role full access to delivery_riders" ON public.delivery_riders;
DROP POLICY IF EXISTS "Public read delivery_riders" ON public.delivery_riders;
DROP POLICY IF EXISTS "Service full access to delivery_riders" ON public.delivery_riders;

CREATE POLICY "Public read delivery_riders"
  ON public.delivery_riders
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service full access to delivery_riders"
  ON public.delivery_riders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Restrict pos_staff table so plaintext PINs cannot be dumped by anonymous visitors
DROP POLICY IF EXISTS "Public read pos_staff" ON public.pos_staff;
DROP POLICY IF EXISTS "Service full pos_staff" ON public.pos_staff;

-- Only service_role can access pos_staff directly
CREATE POLICY "Service full pos_staff"
  ON public.pos_staff
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Secure RPC for POS PIN verification (verifies PIN without returning it to client)
CREATE OR REPLACE FUNCTION public.verify_pos_staff_pin(
  p_shop_id BIGINT,
  p_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_staff RECORD;
BEGIN
  SELECT id, name, role, has_pos_access, is_active, shop_id
  INTO v_staff
  FROM public.pos_staff
  WHERE (shop_id = p_shop_id OR (shop_id IS NULL AND p_shop_id IS NULL))
    AND pin = trim(p_pin)
    AND is_active = true
    AND has_pos_access = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid PIN code');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'staff_id', v_staff.id,
    'name', v_staff.name,
    'role', v_staff.role,
    'shop_id', v_staff.shop_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_pos_staff_pin(BIGINT, TEXT) TO anon, authenticated;

-- 4. Secure RPC for branch login (doesn't expose plaintext password or pos_pin to public anon queries)
CREATE OR REPLACE FUNCTION public.verify_branch_credentials(
  p_shop_id BIGINT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shop RECORD;
  v_trimmed TEXT := trim(COALESCE(p_password, ''));
BEGIN
  -- Master Admin check
  IF v_trimmed = 'hal123' THEN
    RETURN jsonb_build_object(
      'success', true,
      'is_master', true,
      'shop_id', NULL,
      'shop_name', 'Master Admin',
      'shop_slug', NULL
    );
  END IF;

  SELECT id, name, slug, password, pos_pin, status
  INTO v_shop
  FROM public.shops
  WHERE id = p_shop_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Branch not found');
  END IF;

  IF v_shop.status = 'suspended' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Branch is suspended');
  END IF;

  IF v_trimmed = trim(v_shop.password) OR (v_shop.pos_pin IS NOT NULL AND v_trimmed = trim(v_shop.pos_pin)) THEN
    RETURN jsonb_build_object(
      'success', true,
      'is_master', false,
      'shop_id', v_shop.id,
      'shop_name', v_shop.name,
      'shop_slug', v_shop.slug
    );
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Incorrect branch password or PIN');
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_branch_credentials(BIGINT, TEXT) TO anon, authenticated;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

