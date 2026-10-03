-- ============================================================
-- Pizza Shop SaaS — Migration 007: Multi-Shop Super Admin Platform
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shops (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_name TEXT NOT NULL,
  owner_email TEXT,
  owner_phone TEXT,
  branch_address TEXT,
  password TEXT NOT NULL DEFAULT 'shop123',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  currency_symbol TEXT NOT NULL DEFAULT 'Rs.',
  plan TEXT NOT NULL DEFAULT 'pro' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  total_orders_count INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast lookup by slug and status
CREATE INDEX IF NOT EXISTS idx_shops_slug ON public.shops (slug);
CREATE INDEX IF NOT EXISTS idx_shops_status ON public.shops (status);

-- Enable Row Level Security
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active shops (for customer menus and verification)
DROP POLICY IF EXISTS "Allow public read access to active shops" ON public.shops;
CREATE POLICY "Allow public read access to active shops"
  ON public.shops
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow full access to service_role (Super Admin operations)
DROP POLICY IF EXISTS "Allow full access to service_role on shops" ON public.shops;
CREATE POLICY "Allow full access to service_role on shops"
  ON public.shops
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Link existing products, categories, orders to shop_id if needed in the future
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'shop_id'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN shop_id BIGINT REFERENCES public.shops(id) ON DELETE SET NULL;
  END IF;
END $$;
