-- ============================================================
-- Pizza Shop — Migration 003: Currency Setting
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

ALTER TABLE public.shop_settings
  ADD COLUMN IF NOT EXISTS currency_symbol text NOT NULL DEFAULT '$';

COMMENT ON COLUMN public.shop_settings.currency_symbol IS 'Currency symbol used for displaying prices (e.g. $, Rs., €, £, AED).';
