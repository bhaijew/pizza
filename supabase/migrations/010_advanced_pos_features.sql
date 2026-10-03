-- ============================================================
-- Pizza Shop SaaS — Migration 010: Advanced Features
-- Run in: Supabase Dashboard → SQL Editor → Run
-- Adds: Variations, Toppings, Inventory, Delivery & Rider fields
-- ============================================================

-- 1. Product Variations & Toppings (Feature 2)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'variations') THEN
    ALTER TABLE public.products ADD COLUMN variations JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'extra_toppings') THEN
    ALTER TABLE public.products ADD COLUMN extra_toppings JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 2. Inventory & Low Stock Tracking (Feature 7)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'track_inventory') THEN
    ALTER TABLE public.products ADD COLUMN track_inventory BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_quantity') THEN
    ALTER TABLE public.products ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'low_stock_threshold') THEN
    ALTER TABLE public.products ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 5;
  END IF;
END $$;

-- 3. Rider & Home Delivery Dispatch (Feature 8)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_address') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_rider_name') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_rider_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_rider_phone') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_rider_phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_fee') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_fee NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- Create index for quick order tracking lookup
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
