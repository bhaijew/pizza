-- ============================================================
-- Pizza Shop SaaS — Migration 024: Custom Shop Logo & Dynamic Menu Layouts
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Add logo_url and menu_layout to public.shops
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'logo_url') THEN
    ALTER TABLE public.shops ADD COLUMN logo_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'menu_layout') THEN
    ALTER TABLE public.shops ADD COLUMN menu_layout TEXT DEFAULT 'classic';
  END IF;
END $$;

-- 2. Add logo_url and menu_layout to public.shop_settings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'logo_url') THEN
    ALTER TABLE public.shop_settings ADD COLUMN logo_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'menu_layout') THEN
    ALTER TABLE public.shop_settings ADD COLUMN menu_layout TEXT DEFAULT 'classic';
  END IF;
END $$;
