-- ============================================================
-- Migration 032: Allow Custom Categories in Expenses Table
-- Run in: Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- Drops the rigid category check constraint on expenses table
-- so restaurants can define unlimited custom cost categories
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;

