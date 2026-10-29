-- ============================================================================
-- Migration 030: Add transaction_id column to orders table for Card/Digital payments
-- ============================================================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS transaction_id text;

-- Index for transaction lookups
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON public.orders(transaction_id);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

