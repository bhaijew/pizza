-- ============================================================
-- Pizza Shop SaaS — Migration 022: Fix Missing Tables
-- Safely creates promo_codes, customer_loyalty, deals tables
-- and adds missing columns to orders
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

-- ── 3. DEALS TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  deal_price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  image_url TEXT,
  items_included TEXT[],
  badge TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_deals_slug_shop ON public.deals (slug, COALESCE(shop_id, -1));
CREATE INDEX IF NOT EXISTS idx_deals_shop ON public.deals (shop_id);

-- ── 4. ADD MISSING COLUMNS TO ORDERS ─────────────────────────
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS points_redeemed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- ── 5. RLS & PERMISSIONS ─────────────────────────────────────

-- promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active promo codes" ON public.promo_codes;
CREATE POLICY "Public can view active promo codes"
  ON public.promo_codes FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Full access to service_role on promo_codes" ON public.promo_codes;
CREATE POLICY "Full access to service_role on promo_codes"
  ON public.promo_codes FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- customer_loyalty
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Full access to service_role on customer_loyalty" ON public.customer_loyalty;
CREATE POLICY "Full access to service_role on customer_loyalty"
  ON public.customer_loyalty FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active deals" ON public.deals;
CREATE POLICY "Public can view active deals"
  ON public.deals FOR SELECT TO anon, authenticated
  USING (is_active = true AND is_available = true);

DROP POLICY IF EXISTS "Full access to service_role on deals" ON public.deals;
CREATE POLICY "Full access to service_role on deals"
  ON public.deals FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── 6. GRANTS ─────────────────────────────────────────────────
GRANT SELECT ON public.promo_codes TO anon, authenticated;
GRANT SELECT ON public.customer_loyalty TO anon, authenticated;
GRANT SELECT ON public.deals TO anon, authenticated;

-- ── 7. GOOGLE REVIEW URL ─────────────────────────────────────
-- Add google_review_url to shops (per-branch)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'google_review_url') THEN
    ALTER TABLE public.shops ADD COLUMN google_review_url TEXT DEFAULT '';
  END IF;
END $$;

-- Add google_review_url to shop_settings (master)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'google_review_url') THEN
    ALTER TABLE public.shop_settings ADD COLUMN google_review_url TEXT DEFAULT '';
  END IF;
END $$;

-- ── 8. NOTIFY SCHEMA CACHE ─────────────────────────────────────
NOTIFY pgrst, 'reload schema';
