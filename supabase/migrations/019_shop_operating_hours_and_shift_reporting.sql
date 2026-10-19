-- ============================================================
-- Pizza Shop SaaS — Migration 019: Shop Operating Hours & Shift-Based 24h Reporting
-- Enables shop owners to set opening (e.g. 11:00 AM) and closing (e.g. 01:00 AM next day).
-- Daily closing reports and sales analytics calculate across the operational business shift!
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Add opening_time and closing_time to public.shops
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'opening_time') THEN
    ALTER TABLE public.shops ADD COLUMN opening_time TEXT NOT NULL DEFAULT '11:00';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'closing_time') THEN
    ALTER TABLE public.shops ADD COLUMN closing_time TEXT NOT NULL DEFAULT '01:00';
  END IF;
END $$;

-- 2. Add opening_time and closing_time to public.shop_settings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'opening_time') THEN
    ALTER TABLE public.shop_settings ADD COLUMN opening_time TEXT NOT NULL DEFAULT '11:00';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'closing_time') THEN
    ALTER TABLE public.shop_settings ADD COLUMN closing_time TEXT NOT NULL DEFAULT '01:00';
  END IF;
END $$;

-- 3. Update orders order_number unique constraint to be per-shop scoped
DO $$ BEGIN
  -- Drop the legacy global unique constraint if present
  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_number_key;
  -- Create per-shop unique index so each shop can start from order #1
  CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_shop_order_seq ON public.orders (COALESCE(shop_id, 0), order_number);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
