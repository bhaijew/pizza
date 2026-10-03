-- ============================================================
-- Pizza Shop SaaS — Migration 009: Multi-Shop Branch Unique Constraints
-- Run in: Supabase Dashboard → SQL Editor → Run
-- Makes categories, products, and tables unique per shop_id
-- ============================================================

-- 1. Categories: drop old global slug unique constraint, add per-shop slug uniqueness
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_slug_key'
  ) THEN
    ALTER TABLE public.categories DROP CONSTRAINT categories_slug_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_shop_slug ON public.categories (COALESCE(shop_id, 0), slug);

-- 2. Products: drop old global slug unique constraint, add per-shop slug uniqueness
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_slug_key'
  ) THEN
    ALTER TABLE public.products DROP CONSTRAINT products_slug_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_shop_slug ON public.products (COALESCE(shop_id, 0), slug);

-- 3. Restaurant Tables: drop old global table_number unique constraint, add per-shop table_number uniqueness
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'restaurant_tables_table_number_key'
  ) THEN
    ALTER TABLE public.restaurant_tables DROP CONSTRAINT restaurant_tables_table_number_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tables_shop_number ON public.restaurant_tables (COALESCE(shop_id, 0), table_number);

-- 4. Daily Closings: drop old global closing_date unique constraint, add per-shop closing uniqueness
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_closings_closing_date_key'
  ) THEN
    ALTER TABLE public.daily_closings DROP CONSTRAINT daily_closings_closing_date_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_closings_shop_date ON public.daily_closings (COALESCE(shop_id, 0), closing_date);
