-- ============================================================
-- Pizza Shop SaaS — Migration 015: Multi-Tenant POS Staff Isolation
-- Adds shop_id foreign key to pos_staff table non-destructively
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pos_staff' AND column_name = 'shop_id') THEN
    ALTER TABLE public.pos_staff ADD COLUMN shop_id BIGINT REFERENCES public.shops(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_pos_staff_shop ON public.pos_staff (shop_id);
  END IF;
END $$;
