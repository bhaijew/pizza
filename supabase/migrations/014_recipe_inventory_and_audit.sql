-- ============================================================
-- Pizza Shop SaaS — Migration 014: Recipe & Raw Material Inventory (BOM & Kitchen Audit)
-- Run in: Supabase Dashboard → SQL Editor → Run
-- Adds: Raw Materials, Product Recipes (BOM), Kitchen Stock Audit & Wastage
-- ============================================================

-- 1. Raw Ingredients / Materials Table (Kacha Maal)
CREATE TABLE IF NOT EXISTS public.raw_ingredients (
  id BIGSERIAL PRIMARY KEY,
  shop_id INTEGER REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'meat', -- 'meat', 'dairy', 'vegetables', 'sauces', 'bakery', 'packaging', 'spices', 'other'
  unit TEXT NOT NULL DEFAULT 'kg',       -- 'kg', 'g', 'l', 'ml', 'pcs'
  current_stock NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
  low_stock_threshold NUMERIC(12, 3) NOT NULL DEFAULT 2.000,
  cost_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_ingredients_shop ON public.raw_ingredients (shop_id);
CREATE INDEX IF NOT EXISTS idx_raw_ingredients_name ON public.raw_ingredients (name);

-- 2. Product Recipes / Bill of Materials (BOM)
-- Links a Product (and optional variation e.g. "Small") with required Raw Ingredients
CREATE TABLE IF NOT EXISTS public.product_recipes (
  id BIGSERIAL PRIMARY KEY,
  shop_id INTEGER REFERENCES public.shops(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variation_name TEXT, -- e.g. 'Small', 'Medium', 'Large' or NULL for base/all variations
  ingredient_id BIGINT NOT NULL REFERENCES public.raw_ingredients(id) ON DELETE CASCADE,
  quantity_required NUMERIC(12, 3) NOT NULL DEFAULT 0.000, -- e.g. 0.500 kg for Small Pizza
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_recipes_shop ON public.product_recipes (shop_id);
CREATE INDEX IF NOT EXISTS idx_product_recipes_product ON public.product_recipes (product_id);
CREATE INDEX IF NOT EXISTS idx_product_recipes_ingredient ON public.product_recipes (ingredient_id);

-- 3. Monthly / Periodic Kitchen Stock Audit & Variance Reports (Chori & Wastage Analyzer)
CREATE TABLE IF NOT EXISTS public.stock_audits (
  id BIGSERIAL PRIMARY KEY,
  shop_id INTEGER REFERENCES public.shops(id) ON DELETE CASCADE,
  audit_title TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed', -- 'draft', 'completed'
  audited_by TEXT NOT NULL DEFAULT 'Admin',
  items_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_loss_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_audits_shop ON public.stock_audits (shop_id);
CREATE INDEX IF NOT EXISTS idx_stock_audits_created ON public.stock_audits (created_at DESC);

-- 4. Kitchen Wastage & Spoilage Log (Chef Burning / Dropping / Expiry)
CREATE TABLE IF NOT EXISTS public.ingredient_wastage_logs (
  id BIGSERIAL PRIMARY KEY,
  shop_id INTEGER REFERENCES public.shops(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL REFERENCES public.raw_ingredients(id) ON DELETE CASCADE,
  quantity_wasted NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
  reason TEXT NOT NULL,
  reported_by TEXT NOT NULL DEFAULT 'Chef',
  cost_loss NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wastage_logs_shop ON public.ingredient_wastage_logs (shop_id);
CREATE INDEX IF NOT EXISTS idx_wastage_logs_ingredient ON public.ingredient_wastage_logs (ingredient_id);

-- 5. Ingredient Stock Movement Ledger (Audit trail for restocks, sales deductions, wastage)
CREATE TABLE IF NOT EXISTS public.ingredient_stock_logs (
  id BIGSERIAL PRIMARY KEY,
  shop_id INTEGER REFERENCES public.shops(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL REFERENCES public.raw_ingredients(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL, -- 'restock', 'order_deduction', 'wastage', 'audit_adjustment'
  quantity_change NUMERIC(12, 3) NOT NULL,
  previous_stock NUMERIC(12, 3) NOT NULL,
  new_stock NUMERIC(12, 3) NOT NULL,
  reference_id TEXT, -- order_number or audit title
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_logs_shop ON public.ingredient_stock_logs (shop_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_ingredient ON public.ingredient_stock_logs (ingredient_id);

-- Enable Row Level Security (RLS) on all new tables
ALTER TABLE public.raw_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_wastage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_stock_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies for authenticated and anon roles
DO $$ BEGIN
  -- raw_ingredients
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'raw_ingredients' AND policyname = 'raw_ingredients_authenticated_policy') THEN
    CREATE POLICY "raw_ingredients_authenticated_policy" ON public.raw_ingredients FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'raw_ingredients' AND policyname = 'raw_ingredients_anon_policy') THEN
    CREATE POLICY "raw_ingredients_anon_policy" ON public.raw_ingredients FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;

  -- product_recipes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_recipes' AND policyname = 'product_recipes_authenticated_policy') THEN
    CREATE POLICY "product_recipes_authenticated_policy" ON public.product_recipes FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_recipes' AND policyname = 'product_recipes_anon_policy') THEN
    CREATE POLICY "product_recipes_anon_policy" ON public.product_recipes FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;

  -- stock_audits
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_audits' AND policyname = 'stock_audits_authenticated_policy') THEN
    CREATE POLICY "stock_audits_authenticated_policy" ON public.stock_audits FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_audits' AND policyname = 'stock_audits_anon_policy') THEN
    CREATE POLICY "stock_audits_anon_policy" ON public.stock_audits FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;

  -- ingredient_wastage_logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredient_wastage_logs' AND policyname = 'ingredient_wastage_logs_authenticated_policy') THEN
    CREATE POLICY "ingredient_wastage_logs_authenticated_policy" ON public.ingredient_wastage_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredient_wastage_logs' AND policyname = 'ingredient_wastage_logs_anon_policy') THEN
    CREATE POLICY "ingredient_wastage_logs_anon_policy" ON public.ingredient_wastage_logs FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;

  -- ingredient_stock_logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredient_stock_logs' AND policyname = 'ingredient_stock_logs_authenticated_policy') THEN
    CREATE POLICY "ingredient_stock_logs_authenticated_policy" ON public.ingredient_stock_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ingredient_stock_logs' AND policyname = 'ingredient_stock_logs_anon_policy') THEN
    CREATE POLICY "ingredient_stock_logs_anon_policy" ON public.ingredient_stock_logs FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;
