-- ============================================================================
-- Migration 031: Add order verification system for online menu orders
-- Ensures online/customer menu orders require admin verification before 
-- moving to live orders, kitchen prep, and automatic thermal receipt printing.
-- ============================================================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'pos',
ADD COLUMN IF NOT EXISTS verified_at timestamptz,
ADD COLUMN IF NOT EXISTS verified_by text;

-- Existing orders are marked verified by default
UPDATE public.orders 
SET is_verified = true 
WHERE is_verified IS NULL;

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_is_verified ON public.orders(is_verified);
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(source);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';

