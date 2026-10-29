-- ============================================================================
-- Migration 029: Customer Reviews & Reputation Guard System
-- Stores 1-5 star reviews, feedback tags, Google review redirect tracking,
-- and private complaint alerts for store management.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.order_reviews (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE,
  order_id BIGINT,
  order_number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[],
  feedback TEXT,
  is_google_posted BOOLEAN DEFAULT false,
  alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for speedy shop feedback lookup
CREATE INDEX IF NOT EXISTS idx_order_reviews_shop_id
  ON public.order_reviews(shop_id);

CREATE INDEX IF NOT EXISTS idx_order_reviews_order_number
  ON public.order_reviews(order_number);

-- Extend orders table with review cache columns for instant UI hydration
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS review_rating INTEGER,
  ADD COLUMN IF NOT EXISTS review_feedback TEXT,
  ADD COLUMN IF NOT EXISTS review_tags TEXT[],
  ADD COLUMN IF NOT EXISTS review_submitted_at TIMESTAMPTZ;

