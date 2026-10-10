-- ============================================================
-- Pizza Shop — Migration 017: Special Deals & Combos Management
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.deals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  deal_price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  image_url TEXT,
  items_included JSONB DEFAULT '[]'::jsonb,
  badge TEXT DEFAULT 'Hot Deal',
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS & Policies
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active deals" ON public.deals;
CREATE POLICY "Public can view active deals" 
  ON public.deals FOR SELECT TO anon, authenticated
  USING (is_active = true AND is_available = true);

DROP POLICY IF EXISTS "Full access to service_role on deals" ON public.deals;
CREATE POLICY "Full access to service_role on deals"
  ON public.deals FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT SELECT ON public.deals TO anon, authenticated;
