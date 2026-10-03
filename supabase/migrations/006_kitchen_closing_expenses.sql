-- ============================================================
-- Pizza Shop — Migration 006: Kitchen, Daily Closing & Expenses
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Restaurant Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL DEFAULT 'ingredients' 
    CHECK (category IN ('ingredients', 'utilities', 'wages', 'packaging', 'rent', 'maintenance', 'misc', 'other')),
  notes TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for date queries
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses (category);

-- 2. Daily Register Closing Table
CREATE TABLE IF NOT EXISTS public.daily_closings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  closing_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_sales NUMERIC(10, 2) NOT NULL DEFAULT 0,
  dine_in_sales NUMERIC(10, 2) NOT NULL DEFAULT 0,
  takeaway_sales NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_expenses NUMERIC(10, 2) NOT NULL DEFAULT 0,
  net_profit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  closed_by TEXT DEFAULT 'Admin',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_closings_date ON public.daily_closings (closing_date DESC);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_closings ENABLE ROW LEVEL SECURITY;

-- Expenses Policies
DROP POLICY IF EXISTS "Allow full access to service_role on expenses" ON public.expenses;
CREATE POLICY "Allow full access to service_role on expenses"
  ON public.expenses FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access to authenticated on expenses" ON public.expenses;
CREATE POLICY "Allow read access to authenticated on expenses"
  ON public.expenses FOR SELECT TO anon, authenticated USING (true);

-- Daily Closings Policies
DROP POLICY IF EXISTS "Allow full access to service_role on daily_closings" ON public.daily_closings;
CREATE POLICY "Allow full access to service_role on daily_closings"
  ON public.daily_closings FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access to authenticated on daily_closings" ON public.daily_closings;
CREATE POLICY "Allow read access to authenticated on daily_closings"
  ON public.daily_closings FOR SELECT TO anon, authenticated USING (true);

