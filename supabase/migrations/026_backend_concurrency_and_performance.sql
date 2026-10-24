-- ============================================================================
-- Migration 026: High-Concurrency, Live Kitchen Polling & Performance Optimization
-- Adds composite indexes to accelerate rush-hour checkouts and sub-second KDS polling
-- ============================================================================

-- 1. Accelerate Live Orders & Kitchen KDS polling (/api/orders/live)
CREATE INDEX IF NOT EXISTS idx_orders_shop_created_at 
  ON public.orders (shop_id, created_at DESC);

-- 2. Accelerate Active Shift Kitchen Order Filtering (pending, confirmed, preparing)
CREATE INDEX IF NOT EXISTS idx_orders_shop_status 
  ON public.orders (shop_id, status);

-- 3. Accelerate Sequential Order Number Lookups per Branch during checkout
CREATE INDEX IF NOT EXISTS idx_orders_shop_id_desc 
  ON public.orders (shop_id, id DESC);

-- 4. Accelerate Recipe Ingredient Deductions on Order Placement
CREATE INDEX IF NOT EXISTS idx_product_recipes_prod_shop 
  ON public.product_recipes (product_id, shop_id);

-- 5. Accelerate Raw Ingredient Stock Deductions per Branch
CREATE INDEX IF NOT EXISTS idx_raw_ingredients_shop 
  ON public.raw_ingredients (shop_id, id);

-- 6. Accelerate Active Shift Boundary & Automated Daily Closing Checks
CREATE INDEX IF NOT EXISTS idx_daily_closings_shop_date 
  ON public.daily_closings (shop_id, closing_date DESC);

-- 7. Accelerate Customer Menu & Catalog Queries
CREATE INDEX IF NOT EXISTS idx_products_shop_active 
  ON public.products (shop_id, is_active, is_available);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
