-- ============================================================
-- Pizza Shop SaaS — Migration 008: Multi-Shop Branch Data Isolation
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Add shop_id to categories
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'shop_id') THEN
    ALTER TABLE public.categories ADD COLUMN shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_categories_shop ON public.categories (shop_id);
  END IF;
END $$;

-- 2. Add shop_id to products
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'shop_id') THEN
    ALTER TABLE public.products ADD COLUMN shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_products_shop ON public.products (shop_id);
  END IF;
END $$;

-- 3. Add shop_id to orders
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shop_id') THEN
    ALTER TABLE public.orders ADD COLUMN shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_orders_shop ON public.orders (shop_id);
  END IF;
END $$;

-- 4. Add shop_id to restaurant_tables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_tables' AND column_name = 'shop_id') THEN
    ALTER TABLE public.restaurant_tables ADD COLUMN shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_tables_shop ON public.restaurant_tables (shop_id);
  END IF;
END $$;

-- 5. Add shop_id to expenses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'shop_id') THEN
    ALTER TABLE public.expenses ADD COLUMN shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_expenses_shop ON public.expenses (shop_id);
  END IF;
END $$;

-- 6. Add shop_id to daily_closings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_closings' AND column_name = 'shop_id') THEN
    ALTER TABLE public.daily_closings ADD COLUMN shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_closings_shop ON public.daily_closings (shop_id);
  END IF;
END $$;
