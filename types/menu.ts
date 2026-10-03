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
  created_at?: string;
  updated_at?: string;
}
