-- ============================================================================
-- Migration 025: Add payment_status and payment_method columns to orders table
-- ============================================================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash';

-- Index for payment queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- Reload PostgREST schema cache to immediately reflect column additions
NOTIFY pgrst, 'reload schema';
