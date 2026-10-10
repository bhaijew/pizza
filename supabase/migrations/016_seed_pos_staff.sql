-- ============================================================
-- Pizza Shop SaaS — Migration 016: POS Staff & Realtime Publication Seed
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Ensure pos_staff table exists with complete enterprise schema
CREATE TABLE IF NOT EXISTS public.pos_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('manager', 'cashier', 'waiter', 'chef', 'owner')),
  pin TEXT NOT NULL DEFAULT '1234',
  has_pos_access BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  shop_id BIGINT REFERENCES public.shops(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure shop_id column exists non-destructively
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pos_staff' AND column_name = 'shop_id') THEN
    ALTER TABLE public.pos_staff ADD COLUMN shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for lightning-fast POS PIN authentication & branch filtering
CREATE INDEX IF NOT EXISTS idx_pos_staff_pin ON public.pos_staff (pin);
CREATE INDEX IF NOT EXISTS idx_pos_staff_shop ON public.pos_staff (shop_id);
CREATE INDEX IF NOT EXISTS idx_pos_staff_active ON public.pos_staff (is_active, has_pos_access);

-- Enable Row Level Security
ALTER TABLE public.pos_staff ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active staff profiles (for terminal login PIN matching)
DROP POLICY IF EXISTS "Public read pos_staff" ON public.pos_staff;
CREATE POLICY "Public read pos_staff" 
  ON public.pos_staff 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Allow full access to service_role (Super Admin operations)
DROP POLICY IF EXISTS "Service full pos_staff" ON public.pos_staff;
CREATE POLICY "Service full pos_staff" 
  ON public.pos_staff 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- 2. Insert Realistic Test/Fake Staff Members for POS Counter & Kitchen
-- Only inserts if not already populated to remain idempotent & safe
DO $$ 
DECLARE
  first_shop_id BIGINT;
BEGIN
  -- Grab the first active branch shop ID if one exists
  SELECT id INTO first_shop_id FROM public.shops WHERE status = 'active' LIMIT 1;

  -- 1. Shift Manager
  IF NOT EXISTS (SELECT 1 FROM public.pos_staff WHERE email = 'manager@pizzapos.local') THEN
    INSERT INTO public.pos_staff (name, email, role, pin, has_pos_access, is_active, shop_id)
    VALUES ('Ali Raza (Shift Manager)', 'manager@pizzapos.local', 'manager', '9900', true, true, first_shop_id);
  END IF;

  -- 2. Counter 1 Cashier
  IF NOT EXISTS (SELECT 1 FROM public.pos_staff WHERE email = 'cashier1@pizzapos.local') THEN
    INSERT INTO public.pos_staff (name, email, role, pin, has_pos_access, is_active, shop_id)
    VALUES ('Bilal Ahmed (Cashier 1)', 'cashier1@pizzapos.local', 'cashier', '1122', true, true, first_shop_id);
  END IF;

  -- 3. Counter 2 Cashier
  IF NOT EXISTS (SELECT 1 FROM public.pos_staff WHERE email = 'cashier2@pizzapos.local') THEN
    INSERT INTO public.pos_staff (name, email, role, pin, has_pos_access, is_active, shop_id)
    VALUES ('Usman Tariq (Cashier 2)', 'cashier2@pizzapos.local', 'cashier', '3344', true, true, first_shop_id);
  END IF;

  -- 4. Kitchen Lead / Master Chef
  IF NOT EXISTS (SELECT 1 FROM public.pos_staff WHERE email = 'chef@pizzapos.local') THEN
    INSERT INTO public.pos_staff (name, email, role, pin, has_pos_access, is_active, shop_id)
    VALUES ('Chef Hamza (Oven Master)', 'chef@pizzapos.local', 'chef', '5566', true, true, first_shop_id);
  END IF;

  -- 5. Order Taker / Waiter
  IF NOT EXISTS (SELECT 1 FROM public.pos_staff WHERE email = 'waiter@pizzapos.local') THEN
    INSERT INTO public.pos_staff (name, email, role, pin, has_pos_access, is_active, shop_id)
    VALUES ('Zainab Bibi (Dine-In Waiter)', 'waiter@pizzapos.local', 'waiter', '7788', true, true, first_shop_id);
  END IF;
END $$;

-- 3. Ensure Supabase Realtime Publication includes orders & pos_staff
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'pos_staff'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pos_staff;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore if already added or publication managed by Supabase dashboard
    NULL;
END $$;
