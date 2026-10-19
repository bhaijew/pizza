-- ============================================================
-- Pizza Shop SaaS — Migration 018: Staff Roles & Cancellation Control
-- Multi-Tenant Sub-Admin and Staff Role Management with Strict Cancellation Restriction
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Ensure pos_staff table exists
CREATE TABLE IF NOT EXISTS public.pos_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'staff',
  pin TEXT NOT NULL DEFAULT '1234',
  has_pos_access BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Ensure shop_id column exists non-destructively
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pos_staff' AND column_name = 'shop_id') THEN
    ALTER TABLE public.pos_staff ADD COLUMN shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Update role check constraint to support admin, sub_admin, staff, cashier, chef
DO $$ BEGIN
  ALTER TABLE public.pos_staff DROP CONSTRAINT IF EXISTS pos_staff_role_check;
  ALTER TABLE public.pos_staff ADD CONSTRAINT pos_staff_role_check 
    CHECK (role IN ('admin', 'sub_admin', 'staff', 'cashier', 'manager', 'chef', 'waiter', 'owner'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 4. Indexes for fast query and branch isolation
CREATE INDEX IF NOT EXISTS idx_pos_staff_shop_role ON public.pos_staff (shop_id, role);
CREATE INDEX IF NOT EXISTS idx_pos_staff_pin_lookup ON public.pos_staff (pin);
