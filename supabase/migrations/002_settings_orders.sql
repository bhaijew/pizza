-- ============================================================
-- Pizza Shop — Migration 002: Settings & Orders
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. SHOP SETTINGS (single-row config) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.shop_settings (
  id               text        PRIMARY KEY DEFAULT 'main',
  shop_name        text        NOT NULL DEFAULT 'Pizza Shop',
  menu_title       text        NOT NULL DEFAULT 'Our Menu',
  meta_title       text        NOT NULL DEFAULT 'Pizza Shop — Order Online',
  meta_description text        NOT NULL DEFAULT 'Fresh, made-to-order pizzas.',
  currency_symbol  text        NOT NULL DEFAULT '$',
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Seed the default row
INSERT INTO public.shop_settings (id) VALUES ('main') ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.shop_settings IS 'Single-row shop configuration. Always query WHERE id = ''main''.';

-- ── 2. ORDERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id             bigint        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_number   text          UNIQUE NOT NULL,
  status         text          NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
  customer_name  text,
  customer_phone text,
  items          jsonb         NOT NULL DEFAULT '[]',
  total          numeric(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  notes          text,
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.orders              IS 'Customer orders for the pizza shop.';
COMMENT ON COLUMN public.orders.order_number IS 'Human-readable order ID shown to the customer (e.g. #00042).';
COMMENT ON COLUMN public.orders.status       IS 'Workflow state: pending → confirmed → preparing → ready → delivered / cancelled.';
COMMENT ON COLUMN public.orders.items        IS 'Snapshot of ordered products as JSON array [{id, name, price, qty}].';

-- ── 3. ORDERS updated_at trigger ─────────────────────────────────
-- (set_updated_at function already created in migration 001)
CREATE OR REPLACE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. INDEXES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_status
  ON public.orders (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_created
  ON public.orders (created_at DESC);

-- ── 5. ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders        ENABLE ROW LEVEL SECURITY;

-- Settings: everyone can read, only service_role can write (bypasses RLS)
CREATE POLICY "Public can read settings"
  ON public.shop_settings FOR SELECT TO anon, authenticated
  USING (true);

-- Orders: customers can place, service_role (admin) manages all
CREATE POLICY "Customers can place orders"
  ON public.orders FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');

-- ── 6. GRANT API ACCESS ──────────────────────────────────────────
GRANT SELECT        ON public.shop_settings TO anon, authenticated;
GRANT SELECT, INSERT ON public.orders       TO anon, authenticated;

-- ── 7. ENABLE REALTIME ON ORDERS ─────────────────────────────────
-- Also enable in: Dashboard → Database → Replication → orders (toggle ON)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
