-- ============================================================
-- Migration 032: Allow Custom Expense Categories
-- Removes the hardcoded check constraint on expenses.category
-- so shop managers can add custom outgoings (e.g. Fuel, Delivery, Ice, Marketing).
-- ============================================================

ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
