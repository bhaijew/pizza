-- ============================================================
-- Pizza Shop SaaS — Migration 013: Ensure Category Branch Isolation
-- Run in: Supabase Dashboard → SQL Editor → Run
-- Guarantees categories are isolated per shop_id and allows
-- duplicate category names/slugs across different branches
-- ============================================================

-- 1. Ensure shop_id column exists on categories table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'shop_id'
  ) THEN
    ALTER TABLE public.categories ADD COLUMN shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Create index on shop_id for fast branch category queries
CREATE INDEX IF NOT EXISTS idx_categories_shop ON public.categories (shop_id);

-- 3. Drop legacy global uniqueness constraint on category slug if still present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_slug_key'
  ) THEN
    ALTER TABLE public.categories DROP CONSTRAINT categories_slug_key;
  END IF;
END $$;

-- 4. Unique index scoped per branch so different shops can each have 'pizzas', 'drinks', etc.
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_shop_slug 
  ON public.categories (COALESCE(shop_id, 0), slug);

-- 5. Helpful table comment
COMMENT ON COLUMN public.categories.shop_id IS 'ID of the branch shop this category belongs to. NULL for global/unassigned master store categories.';
