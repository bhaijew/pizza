/**
 * Types derived from the actual Supabase database schema.
 * Column names reflect whatever is found in the DB.
 * Update these types if/when the database schema changes.
 */

export interface Category {
  id: string | number;
  name: string;
  slug?: string | null;
  description?: string | null;
  image_url?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
  shop_id?: number | null;
}

export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";

export interface ProductVariation {
  id?: string;
  name: string;
  price: number;
  is_default?: boolean;
}

export interface ExtraTopping {
  id?: string;
  name: string;
  price: number;
}

export interface Product {
  id: string | number;
  name: string;
  slug?: string | null;
  description?: string | null;
  price?: number | null;
  image_url?: string | null;
  category_id?: string | number | null;
  is_available?: boolean | null;
  is_active?: boolean | null;
  sort_order?: number | null;
  options?: ProductOption[] | null;
  variations?: ProductVariation[] | null;
  extra_toppings?: ExtraTopping[] | null;
  track_inventory?: boolean;
  stock_quantity?: number;
  low_stock_threshold?: number;
  created_at?: string | null;
  shop_id?: number | null;
  /** joined category object when fetched with select */
  category?: Category | null;
}

export interface ProductOption {
  id: string | number;
  name: string;
  price_modifier?: number | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions?: ProductOption[];
  selectedVariation?: ProductVariation | null;
  selectedToppings?: ExtraTopping[];
}

export interface OrderItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  qty?: number;
  selectedVariation?: string | null;
  selected_variation?: string | null;
  selectedToppings?: string[] | null;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  customer_name?: string | null;
  customer_phone?: string | null;
  items: OrderItem[];
  total: number;
  order_type?: "dine_in" | "takeaway" | "delivery" | null;
  table_number?: string | null;
  token_number?: string | null;
  delivery_address?: string | null;
  delivery_rider_name?: string | null;
  delivery_rider_phone?: string | null;
  delivery_fee?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  shop_id?: number | null;
}

export interface RestaurantTable {
  id: string | number;
  table_number: string;
  table_name?: string | null;
  capacity?: number;
  status: "active" | "inactive" | "reserved";
  token_code?: string | null;
  created_at?: string | null;
  shop_id?: number | null;
}

export type ExpenseCategory =
  | "ingredients"
  | "utilities"
  | "wages"
  | "packaging"
  | "rent"
  | "maintenance"
  | "misc"
  | "other";

export interface Expense {
  id: number | string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  notes?: string | null;
  expense_date: string;
  created_at?: string;
  shop_id?: number | null;
}

export interface DailyClosing {
  id: number | string;
  closing_date: string;
  total_orders: number;
  total_sales: number;
  dine_in_sales: number;
  takeaway_sales: number;
  total_expenses: number;
  net_profit: number;
  closed_by?: string;
  notes?: string | null;
  created_at?: string;
  shop_id?: number | null;
}

export interface Shop {
  id: number | string;
  name: string;
  slug: string;
  owner_name: string;
  owner_email?: string | null;
  owner_phone?: string | null;
  branch_address?: string | null;
  password?: string;
  status: "active" | "suspended" | "pending";
  currency_symbol: string;
  plan: "starter" | "pro" | "enterprise";
  total_orders_count?: number;
  total_revenue?: number;
  notes?: string | null;
  whatsapp_session_id?: string | null;
  whatsapp_api_key?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PosStaff {
  id: string;
  name: string;
  email?: string | null;
  role: "manager" | "cashier" | "waiter" | "chef" | "owner";
  pin: string;
  has_pos_access: boolean;
  is_active: boolean;
  shop_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

// ─── RECIPE & RAW MATERIAL INVENTORY (PHASE 1) ───────────────────────

export type RawIngredientCategory =
  | "meat"
  | "dairy"
  | "vegetables"
  | "sauces"
  | "bakery"
  | "packaging"
  | "spices"
  | "other";

export interface RawIngredient {
  id: number;
  shop_id?: number | null;
  name: string;
  category: RawIngredientCategory | string;
  unit: "kg" | "g" | "l" | "ml" | "pcs" | string;
  current_stock: number;
  low_stock_threshold: number;
  cost_per_unit: number; // e.g. Rs. 850 per kg or Rs. 25 per box
  created_at?: string;
  updated_at?: string;
}

export interface ProductRecipeItem {
  id?: number;
  shop_id?: number | null;
  product_id: number;
  variation_name?: string | null; // e.g. 'Small', 'Medium', 'Large' or null for all
  ingredient_id: number;
  quantity_required: number; // e.g. 0.500 kg meat for small pizza
  notes?: string | null;
  ingredient?: RawIngredient;
}

export interface StockAuditItem {
  ingredient_id: number;
  name: string;
  unit: string;
  cost_per_unit: number;
  opening_stock: number;
  restocked_stock: number;
  ideal_consumed: number; // calculated from order sales count × recipe
  expected_stock: number; // opening + restocked - ideal_consumed
  actual_counted: number; // measured physically on kitchen scale
  variance: number;       // actual_counted - expected_stock (negative = missing/wasted)
  loss_amount: number;    // negative variance * cost_per_unit
}

export interface StockAudit {
  id: number;
  shop_id?: number | null;
  audit_title: string;
  period_start: string;
  period_end: string;
  status: "draft" | "completed";
  audited_by: string;
  items_data: StockAuditItem[];
  total_loss_amount: number;
  notes?: string | null;
  created_at: string;
}

export interface IngredientWastageLog {
  id: number;
  shop_id?: number | null;
  ingredient_id: number;
  quantity_wasted: number;
  reason: string;
  reported_by: string;
  cost_loss: number;
  created_at: string;
  ingredient?: RawIngredient;
}

export interface IngredientStockLog {
  id: number;
  shop_id?: number | null;
  ingredient_id: number;
  change_type: "restock" | "order_deduction" | "wastage" | "audit_adjustment";
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  reference_id?: string | null;
  notes?: string | null;
  created_at: string;
  ingredient?: RawIngredient;
}
