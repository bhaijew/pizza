-- ============================================================
-- Pizza Shop SaaS — Migration 023: Delivery Riders Directory
-- Saves Rider Name, WhatsApp Phone, Vehicle & Active Status
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.delivery_riders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle TEXT DEFAULT 'Bike',
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_delivery_riders_shop ON public.delivery_riders (shop_id);
CREATE INDEX IF NOT EXISTS idx_delivery_riders_active ON public.delivery_riders (shop_id, is_active);

-- Enable RLS
ALTER TABLE public.delivery_riders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to delivery_riders" ON public.delivery_riders;
CREATE POLICY "Public access to delivery_riders"
  ON public.delivery_riders FOR ALL TO public
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role access to delivery_riders" ON public.delivery_riders;
CREATE POLICY "Service role access to delivery_riders"
  ON public.delivery_riders FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT ALL ON public.delivery_riders TO anon, authenticated, service_role;
