-- ============================================================
-- Pizza Shop Database Schema
-- Project: pizza-system
-- Created: 2026-09-28
--
-- Run this entire script in:
--   Supabase Dashboard → SQL Editor → New Query → Paste → Run
--
-- Tables created:
--   1. categories   — menu categories (e.g. Pizzas, Drinks, Sides)
--   2. products     — menu items belonging to a category
--   3. product_options — size/variant options per product (optional)
-- ============================================================


-- ── 1. CATEGORIES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          bigint                    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        text                      NOT NULL,
  slug        text                      UNIQUE NOT NULL,
  description text,
  image_url   text,
  sort_order  integer                   NOT NULL DEFAULT 0,
  is_active   boolean                   NOT NULL DEFAULT true,
  created_at  timestamptz               NOT NULL DEFAULT now(),
  updated_at  timestamptz               NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.categories              IS 'Menu categories for the pizza shop (e.g. Pizzas, Drinks, Sides).';
COMMENT ON COLUMN public.categories.slug         IS 'URL-friendly unique identifier for the category (e.g. "classic-pizzas").';
COMMENT ON COLUMN public.categories.sort_order   IS 'Display order in the menu — lower numbers appear first.';
COMMENT ON COLUMN public.categories.is_active    IS 'Set to false to hide the category from the menu without deleting it.';


-- ── 2. PRODUCTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id            bigint        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id   bigint        NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  name          text          NOT NULL,
  slug          text          UNIQUE NOT NULL,
  description   text,
  price         numeric(10,2) NOT NULL CHECK (price >= 0),
  image_url     text,
  is_available  boolean       NOT NULL DEFAULT true,
  is_active     boolean       NOT NULL DEFAULT true,
  sort_order    integer       NOT NULL DEFAULT 0,
  created_at    timestamptz   NOT NULL DEFAULT now(),
  updated_at    timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.products               IS 'Individual menu items for the pizza shop.';
COMMENT ON COLUMN public.products.category_id   IS 'Foreign key to categories.id — every product belongs to one category.';
COMMENT ON COLUMN public.products.slug          IS 'URL-friendly unique identifier for the product.';
COMMENT ON COLUMN public.products.price         IS 'Base price in PKR (or whichever currency the shop uses). Must be ≥ 0.';
COMMENT ON COLUMN public.products.image_url     IS 'Public URL of the product photo (Supabase Storage or external CDN).';
COMMENT ON COLUMN public.products.is_available  IS 'Set to false to mark a product as temporarily out-of-stock.';
COMMENT ON COLUMN public.products.is_active     IS 'Set to false to hide the product entirely without deleting it.';
COMMENT ON COLUMN public.products.sort_order    IS 'Display order within its category — lower numbers appear first.';


-- ── 3. PRODUCT OPTIONS (sizes / variants) ────────────────────────
--   Optional table. Add size options like Small / Medium / Large.
--   Each option has a price_modifier (positive, negative, or zero).
CREATE TABLE IF NOT EXISTS public.product_options (
  id             bigint        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id     bigint        NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  name           text          NOT NULL,             -- e.g. "Small", "Medium", "Large"
  price_modifier numeric(10,2) NOT NULL DEFAULT 0,  -- e.g. 0 / +200 / +400 (PKR)
  is_available   boolean       NOT NULL DEFAULT true,
  sort_order     integer       NOT NULL DEFAULT 0,
  created_at     timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.product_options                IS 'Size or variant options for a product (e.g. Small / Medium / Large pizza).';
COMMENT ON COLUMN public.product_options.price_modifier IS 'Amount added to the base product price for this option. Can be 0 or positive.';


-- ── 4. INDEXES ───────────────────────────────────────────────────
-- Speed up the most common queries:
--   • Category listing (ordered, active only)
--   • Products by category (ordered, active + available)
--   • Slug lookups

CREATE INDEX IF NOT EXISTS idx_categories_sort_active
  ON public.categories (sort_order, is_active);

CREATE INDEX IF NOT EXISTS idx_categories_slug
  ON public.categories (slug);

CREATE INDEX IF NOT EXISTS idx_products_category_sort
  ON public.products (category_id, sort_order, is_active, is_available);

CREATE INDEX IF NOT EXISTS idx_products_slug
  ON public.products (slug);

CREATE INDEX IF NOT EXISTS idx_product_options_product
  ON public.product_options (product_id, sort_order);


-- ── 5. updated_at TRIGGER ────────────────────────────────────────
-- Auto-update updated_at on every row change.

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── 6. ROW LEVEL SECURITY ────────────────────────────────────────
-- Enable RLS on every public table (Supabase requirement).
-- Public read access for active/available items.
-- Write access (INSERT / UPDATE / DELETE) is intentionally NOT granted here —
-- it must be done through a future admin system with authenticated roles.

ALTER TABLE public.categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including unauthenticated visitors) to read active categories
CREATE POLICY "Public can read active categories"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Allow anyone to read active + available products
CREATE POLICY "Public can read active products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND is_available = true);

-- Allow anyone to read product options whose parent product is visible
CREATE POLICY "Public can read product options"
  ON public.product_options
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_options.product_id
        AND p.is_active     = true
        AND p.is_available  = true
    )
  );


-- ── 7. GRANT TABLE ACCESS TO API ROLES ───────────────────────────
-- Required so the Supabase Data API (PostgREST) can see these tables.
-- Without this, the anon/authenticated roles cannot query them even with RLS policies.

GRANT SELECT ON public.categories      TO anon, authenticated;
GRANT SELECT ON public.products        TO anon, authenticated;
GRANT SELECT ON public.product_options TO anon, authenticated;


-- ── DONE ─────────────────────────────────────────────────────────
-- Tables ready. No product data has been inserted.
-- Add products via the Supabase Table Editor or a future admin panel.
--
-- Schema summary:
--
--   categories
--     id, name, slug, description, image_url,
--     sort_order, is_active, created_at, updated_at
--
--   products
--     id, category_id (→ categories), name, slug, description,
--     price, image_url, is_available, is_active,
--     sort_order, created_at, updated_at
--
--   product_options
--     id, product_id (→ products), name, price_modifier,
--     is_available, sort_order, created_at
