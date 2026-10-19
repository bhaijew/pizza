-- ============================================================
-- Pizza Shop SaaS — Migration 021: Hero Section Customization
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

DO $$ BEGIN
  -- 1. Add hero customization columns to public.shops
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_badge_text') THEN
    ALTER TABLE public.shops ADD COLUMN hero_badge_text TEXT DEFAULT 'Artisan Kitchen • Stone Baked Daily';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_title') THEN
    ALTER TABLE public.shops ADD COLUMN hero_title TEXT DEFAULT 'Handcrafted Pizzas.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_title_highlight') THEN
    ALTER TABLE public.shops ADD COLUMN hero_title_highlight TEXT DEFAULT 'Fresh Every Order.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_subtitle') THEN
    ALTER TABLE public.shops ADD COLUMN hero_subtitle TEXT DEFAULT 'Fresh stone-baked pizzas, burgers & drinks prepared to order.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_btn_primary_text') THEN
    ALTER TABLE public.shops ADD COLUMN hero_btn_primary_text TEXT DEFAULT 'Explore Menu';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_btn_primary_link') THEN
    ALTER TABLE public.shops ADD COLUMN hero_btn_primary_link TEXT DEFAULT '#menu';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_btn_secondary_text') THEN
    ALTER TABLE public.shops ADD COLUMN hero_btn_secondary_text TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_btn_secondary_link') THEN
    ALTER TABLE public.shops ADD COLUMN hero_btn_secondary_link TEXT DEFAULT '#specials';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_chip1_text') THEN
    ALTER TABLE public.shops ADD COLUMN hero_chip1_text TEXT DEFAULT '10-15 Min Stone Bake';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_chip2_text') THEN
    ALTER TABLE public.shops ADD COLUMN hero_chip2_text TEXT DEFAULT '100% Real Whole Cheese';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_chip3_text') THEN
    ALTER TABLE public.shops ADD COLUMN hero_chip3_text TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_show_chips') THEN
    ALTER TABLE public.shops ADD COLUMN hero_show_chips BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_bg_type') THEN
    ALTER TABLE public.shops ADD COLUMN hero_bg_type TEXT DEFAULT 'gradient';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_bg_color') THEN
    ALTER TABLE public.shops ADD COLUMN hero_bg_color TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_bg_gradient') THEN
    ALTER TABLE public.shops ADD COLUMN hero_bg_gradient TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_bg_image') THEN
    ALTER TABLE public.shops ADD COLUMN hero_bg_image TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'hero_show_pattern') THEN
    ALTER TABLE public.shops ADD COLUMN hero_show_pattern BOOLEAN DEFAULT true;
  END IF;

  -- 2. Add hero customization columns to public.shop_settings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_badge_text') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_badge_text TEXT DEFAULT 'Artisan Kitchen • Stone Baked Daily';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_title') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_title TEXT DEFAULT 'Handcrafted Pizzas.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_title_highlight') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_title_highlight TEXT DEFAULT 'Fresh Every Order.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_subtitle') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_subtitle TEXT DEFAULT 'Fresh stone-baked pizzas, burgers & drinks prepared to order.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_btn_primary_text') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_btn_primary_text TEXT DEFAULT 'Explore Menu';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_btn_primary_link') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_btn_primary_link TEXT DEFAULT '#menu';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_btn_secondary_text') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_btn_secondary_text TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_btn_secondary_link') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_btn_secondary_link TEXT DEFAULT '#specials';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_chip1_text') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_chip1_text TEXT DEFAULT '10-15 Min Stone Bake';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_chip2_text') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_chip2_text TEXT DEFAULT '100% Real Whole Cheese';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_chip3_text') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_chip3_text TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_show_chips') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_show_chips BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_bg_type') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_bg_type TEXT DEFAULT 'gradient';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_bg_color') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_bg_color TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_bg_gradient') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_bg_gradient TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_bg_image') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_bg_image TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'hero_show_pattern') THEN
    ALTER TABLE public.shop_settings ADD COLUMN hero_show_pattern BOOLEAN DEFAULT true;
  END IF;
END $$;
