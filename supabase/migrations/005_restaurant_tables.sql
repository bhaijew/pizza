-- ============================================================
-- Pizza Shop — Migration 005: Restaurant Tables Management
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_number TEXT NOT NULL UNIQUE,
  table_name TEXT,
  capacity INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'reserved')),
  token_code TEXT NOT NULL DEFAULT ('TB-' || upper(substr(md5(random()::text), 1, 6))),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for table lookup
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_num ON public.restaurant_tables (table_number);

-- Enable Row Level Security
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active tables (for QR menu loading)
DROP POLICY IF EXISTS "Allow public read access to active tables" ON public.restaurant_tables;
CREATE POLICY "Allow public read access to active tables"
  ON public.restaurant_tables
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow full access to service_role (for admin panel)
DROP POLICY IF EXISTS "Allow full access to service_role on restaurant_tables" ON public.restaurant_tables;
CREATE POLICY "Allow full access to service_role on restaurant_tables"
  ON public.restaurant_tables
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Note: Tables are created dynamically by the admin via /admin/tables
