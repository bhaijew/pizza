-- ==============================================================================
-- Migration 028: Full Real-Time Price & Catalog Synchronization
-- Ensures any price change or stock update from any POS, Admin, or API
-- is immediately broadcast to all customer menus without requiring a page refresh.
-- ==============================================================================

-- 1. Set REPLICA IDENTITY FULL so all column values (price, name, variations)
--    are included in every real-time websocket payload.
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.deals REPLICA IDENTITY FULL;

-- 2. Ensure RLS SELECT policy allows reading active items (including sold out)
--    so real-time price & stock updates reach anon customer sessions.
DROP POLICY IF EXISTS "Public can read active products" ON public.products;
CREATE POLICY "Public can read active products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 3. Add tables to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'deals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
  END IF;
END $$;
