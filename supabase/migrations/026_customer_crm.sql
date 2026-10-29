-- ============================================================================
-- Migration 026: Customer Info & CRM Enhancements
-- Ensures customer_loyalty stores delivery_address and notes alongside
-- customer_name and phone, automatically populated from orders & admin CRM.
-- ============================================================================

ALTER TABLE public.customer_loyalty
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_customer_loyalty_shop_id
  ON public.customer_loyalty(shop_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_phone
  ON public.orders(customer_phone);

