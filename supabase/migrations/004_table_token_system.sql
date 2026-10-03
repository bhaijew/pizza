-- ============================================================
-- Pizza Shop — Migration 004: Table QR & Token System
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Add order_type, table_number, and token_number to public.orders
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'dine_in'
    CHECK (order_type IN ('dine_in', 'takeaway', 'delivery')),
  ADD COLUMN IF NOT EXISTS table_number text,
  ADD COLUMN IF NOT EXISTS token_number text;

-- Index for filtering by order_type and table_number
CREATE INDEX IF NOT EXISTS idx_orders_type_table 
  ON public.orders (order_type, table_number, created_at DESC);

COMMENT ON COLUMN public.orders.order_type   IS 'Type of order: dine_in, takeaway, or delivery';
COMMENT ON COLUMN public.orders.table_number IS 'Table identifier for dine-in orders (e.g. "Table 4")';
COMMENT ON COLUMN public.orders.token_number IS 'Counter queue token for takeaway orders (e.g. "TK-08")';
