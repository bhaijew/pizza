-- ============================================================
-- Pizza Shop SaaS — Migration 020: Menu Theme Color, Mobile Slider & POS Pin
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Add theme_color, mobile slider controls, and pos_pin to public.shops
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'pos_pin') THEN
    ALTER TABLE public.shops ADD COLUMN pos_pin TEXT DEFAULT '1234';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'theme_color') THEN
    ALTER TABLE public.shops ADD COLUMN theme_color TEXT DEFAULT '#ea580c';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'slider_enabled') THEN
    ALTER TABLE public.shops ADD COLUMN slider_enabled BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'slider_height_mobile') THEN
    ALTER TABLE public.shops ADD COLUMN slider_height_mobile INTEGER DEFAULT 180;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'slider_images') THEN
    ALTER TABLE public.shops ADD COLUMN slider_images JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 2. Add theme_color and mobile slider controls to public.shop_settings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'theme_color') THEN
    ALTER TABLE public.shop_settings ADD COLUMN theme_color TEXT DEFAULT '#ea580c';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'slider_enabled') THEN
    ALTER TABLE public.shop_settings ADD COLUMN slider_enabled BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'slider_height_mobile') THEN
    ALTER TABLE public.shop_settings ADD COLUMN slider_height_mobile INTEGER DEFAULT 180;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'slider_images') THEN
    ALTER TABLE public.shop_settings ADD COLUMN slider_images JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
