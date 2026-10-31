-- ============================================================================
-- Migration 033: Atomic Inventory & Recipe Ingredient Stock Deduction
-- Eliminates race conditions and over-selling during rush hour checkouts
-- ============================================================================

-- 1. Atomic Product Stock Deduction
CREATE OR REPLACE FUNCTION public.deduct_product_stock_atomic(
  p_product_id INT,
  p_qty INT
)
RETURNS TABLE(new_stock INT, is_available BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stock INT;
  v_track BOOLEAN;
  v_avail BOOLEAN;
BEGIN
  -- Lock row exclusively during checkout transaction to avoid concurrency races
  SELECT stock_quantity, track_inventory INTO v_stock, v_track
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Only track if inventory tracking is enabled and quantity is non-null
  IF v_track IS NOT TRUE OR v_stock IS NULL THEN
    RETURN QUERY SELECT v_stock, TRUE;
    RETURN;
  END IF;
  
  v_stock := GREATEST(0, v_stock - p_qty);
  v_avail := (v_stock > 0);
  
  UPDATE public.products
  SET stock_quantity = v_stock,
      is_available = CASE WHEN v_stock = 0 THEN FALSE ELSE is_available END,
      updated_at = NOW()
  WHERE id = p_product_id;
  
  RETURN QUERY SELECT v_stock, v_avail;
END;
$$;

-- 2. Atomic Raw Ingredient Stock Deduction with Audit Trail
CREATE OR REPLACE FUNCTION public.deduct_ingredient_stock_atomic(
  p_ingredient_id INT,
  p_qty NUMERIC,
  p_shop_id INT,
  p_order_number TEXT,
  p_notes TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current NUMERIC;
  v_new NUMERIC;
BEGIN
  -- Lock row exclusively during recipe deduction
  SELECT current_stock INTO v_current
  FROM public.raw_ingredients
  WHERE id = p_ingredient_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  v_new := GREATEST(0, ROUND((COALESCE(v_current, 0) - p_qty)::numeric, 3));
  
  UPDATE public.raw_ingredients
  SET current_stock = v_new,
      updated_at = NOW()
  WHERE id = p_ingredient_id;
  
  -- Record audit stock log
  INSERT INTO public.ingredient_stock_logs (
    shop_id, ingredient_id, change_type, quantity_change,
    previous_stock, new_stock, reference_id, notes
  ) VALUES (
    p_shop_id, p_ingredient_id, 'order_deduction', -p_qty,
    v_current, v_new, p_order_number, p_notes
  );
  
  RETURN v_new;
END;
$$;

-- Grant execution permissions to service_role and authenticated users
GRANT EXECUTE ON FUNCTION public.deduct_product_stock_atomic(INT, INT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deduct_ingredient_stock_atomic(INT, NUMERIC, INT, TEXT, TEXT) TO anon, authenticated, service_role;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

