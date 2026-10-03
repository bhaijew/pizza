-- ============================================================
-- Pizza Shop — Migration 012: Promo Codes & Customer Loyalty System
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. PROMO CODES TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_discount_amount NUMERIC(10,2),
  usage_limit INTEGER DEFAULT 500,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default popular coupons
INSERT INTO public.promo_codes (code, description, discount_type, discount_value, min_order_amount, max_discount_amount)
VALUES 
  ('WELCOME20', '20% off on your order (up to Rs. 400)', 'percentage', 20.00, 500.00, 400.00),
  ('FLAT100', 'Rs. 100 flat discount on orders over Rs. 800', 'fixed', 100.00, 800.00, 100.00),
  ('PIZZA500', 'Rs. 500 flat discount on mega party orders over Rs. 2500', 'fixed', 500.00, 2500.00, 500.00)
ON CONFLICT (code) DO NOTHING;

-- ── 2. CUSTOMER LOYALTY POINTS TABLE ─────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_loyalty (
  phone TEXT PRIMARY KEY,
  customer_name TEXT,
  points_balance INTEGER NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  shop_id BIGINT REFERENCES public.shops(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. EXTEND ORDERS TABLE WITH DISCOUNT & LOYALTY COLUMNS ────
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS points_redeemed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- ── 4. RLS & PERMISSIONS ─────────────────────────────────────
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;

-- Allow public read of active promo codes for checkout validation
DROP POLICY IF EXISTS "Public can view active promo codes" ON public.promo_codes;
CREATE POLICY "Public can view active promo codes" 
  ON public.promo_codes FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Allow service_role full management
DROP POLICY IF EXISTS "Full access to service_role on promo_codes" ON public.promo_codes;
CREATE POLICY "Full access to service_role on promo_codes"
  ON public.promo_codes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access to service_role on customer_loyalty" ON public.customer_loyalty;
CREATE POLICY "Full access to service_role on customer_loyalty"
  ON public.customer_loyalty FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT SELECT ON public.promo_codes TO anon, authenticated;
GRANT SELECT ON public.customer_loyalty TO anon, authenticated;
