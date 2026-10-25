-- ============================================================
-- Multi-Business SaaS — Migration 027: Universal Business Setup & Modifiers
-- Supports: Fast Food, Pizzeria, Dine-In Restaurant, Cafe/Chai, Bakery, Retail
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Add business_type and feature_flags columns to public.shops
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'business_type') THEN
    ALTER TABLE public.shops ADD COLUMN business_type TEXT DEFAULT 'fast_food';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'feature_flags') THEN
    ALTER TABLE public.shops ADD COLUMN feature_flags JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 2. Add business_type and feature_flags to public.shop_settings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'business_type') THEN
    ALTER TABLE public.shop_settings ADD COLUMN business_type TEXT DEFAULT 'fast_food';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'feature_flags') THEN
    ALTER TABLE public.shop_settings ADD COLUMN feature_flags JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 3. Universal Modifier Groups Table
CREATE TABLE IF NOT EXISTS public.modifier_groups (
  id BIGSERIAL PRIMARY KEY,
  shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  selection_type TEXT DEFAULT 'single', -- 'single' (radio) or 'multiple' (checkbox)
  is_required BOOLEAN DEFAULT false,
  min_selection INT DEFAULT 0,
  max_selection INT DEFAULT 1,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Universal Modifiers / Addons Table
CREATE TABLE IF NOT EXISTS public.modifier_options (
  id BIGSERIAL PRIMARY KEY,
  modifier_group_id BIGINT REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) DEFAULT 0.00,
  is_default BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Linking Products with Modifier Groups
CREATE TABLE IF NOT EXISTS public.product_modifier_groups (
  product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
  modifier_group_id BIGINT REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, modifier_group_id)
);

-- Create indexes for super-fast lookups
CREATE INDEX IF NOT EXISTS idx_modifier_groups_shop ON public.modifier_groups(shop_id);
CREATE INDEX IF NOT EXISTS idx_modifier_options_group ON public.modifier_options(modifier_group_id);
