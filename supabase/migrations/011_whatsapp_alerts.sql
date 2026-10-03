-- ============================================================
-- Pizza Shop — Migration 011: Multi-Tenant WhatsApp Order Alerts
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Add WhatsApp credentials to individual branch shops
ALTER TABLE public.shops 
  ADD COLUMN IF NOT EXISTS whatsapp_session_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_api_key TEXT;

-- Add WhatsApp credentials to master/single-store settings
ALTER TABLE public.shop_settings 
  ADD COLUMN IF NOT EXISTS whatsapp_session_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_api_key TEXT;

COMMENT ON COLUMN public.shops.whatsapp_session_id IS 'Unique Railway WhatsApp gateway session ID for this specific shop branch (e.g. rhs5o).';
COMMENT ON COLUMN public.shops.whatsapp_api_key IS 'Optional custom API key for the WhatsApp gateway for this specific shop.';
COMMENT ON COLUMN public.shop_settings.whatsapp_session_id IS 'Default/Master shop WhatsApp session ID (e.g. rhs5o).';
COMMENT ON COLUMN public.shop_settings.whatsapp_api_key IS 'Default/Master shop WhatsApp gateway API key.';
