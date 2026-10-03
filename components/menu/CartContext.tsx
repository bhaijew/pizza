"use client";

/**
 * Cart context — holds customer-selected items.
 * Items are real products fetched from Supabase.
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import type { CartItem, Product, ProductOption, ProductVariation, ExtraTopping } from "@/types/menu";

// ─── Helper for item uniqueness ──────────────────────────────────
function getCartItemKey(item: {
  product: Product;
  selectedVariation?: ProductVariation | null;
  selectedToppings?: ExtraTopping[];
}): string {
  const varPart = item.selectedVariation?.name || "base";
  const topPart = (item.selectedToppings || [])
    .map((t) => t.name)
    .sort()
    .join(",");
  return `${item.product.id}_${varPart}_${topPart}`;
}

export function getItemUnitPrice(item: CartItem): number {
  const basePrice = item.selectedVariation ? item.selectedVariation.price : (item.product.price ?? 0);
  const toppingsPrice = (item.selectedToppings || []).reduce((sum, t) => sum + (t.price || 0), 0);
  return basePrice + toppingsPrice;
}

// ─── State ────────────────────────────────────────────────────────
interface CartState {
  items: CartItem[];
}

type CartAction =
  | {
      type: "ADD";
      product: Product;
      options?: ProductOption[];
      variation?: ProductVariation | null;
      toppings?: ExtraTopping[];
    }
  | { type: "REMOVE"; itemKey: string }
  | { type: "SET_QTY"; itemKey: string; qty: number }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const candidate: CartItem = {
        product: action.product,
        quantity: 1,
        selectedOptions: action.options ?? [],
        selectedVariation: action.variation || null,
        selectedToppings: action.toppings || [],
      };
      const key = getCartItemKey(candidate);
      const idx = state.items.findIndex((i) => getCartItemKey(i) === key);

      if (idx >= 0) {
        const updated = [...state.items];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return { items: updated };
      }
      return {
        items: [...state.items, candidate],
      };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => getCartItemKey(i) !== action.itemKey) };
    case "SET_QTY": {
      if (action.qty <= 0) {
        return { items: state.items.filter((i) => getCartItemKey(i) !== action.itemKey) };
      }
      return {
        items: state.items.map((i) =>
          getCartItemKey(i) === action.itemKey ? { ...i, quantity: action.qty } : i
        ),
      };
    }
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────
interface CartContextValue {
  items: CartItem[];
  currencySymbol: string;
  totalItems: number;
  totalPrice: number;
  formatPrice: (amount: number) => string;
  addItem: (
    product: Product,
    options?: ProductOption[],
    variation?: ProductVariation | null,
    toppings?: ExtraTopping[]
  ) => void;
  removeItem: (itemKey: string) => void;
  setQty: (itemKey: string, qty: number) => void;
  getItemKey: (item: CartItem) => string;
  getUnitPrice: (item: CartItem) => number;
  clear: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
  currencySymbol = "Rs.",
}: {
  children: React.ReactNode;
  currencySymbol?: string;
}) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const addItem = useCallback(
    (
      product: Product,
      options?: ProductOption[],
      variation?: ProductVariation | null,
      toppings?: ExtraTopping[]
    ) => dispatch({ type: "ADD", product, options, variation, toppings }),
    []
  );

  const removeItem = useCallback(
    (itemKey: string) => dispatch({ type: "REMOVE", itemKey }),
    []
  );

  const setQty = useCallback(
    (itemKey: string, qty: number) => dispatch({ type: "SET_QTY", itemKey, qty }),
    []
  );

  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const totalItems = state.items.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = state.items.reduce(
    (acc, i) => acc + getItemUnitPrice(i) * i.quantity,
    0
  );

  const formatPrice = useCallback(
    (amount: number) => `${currencySymbol} ${Number(amount).toLocaleString()}`,
    [currencySymbol]
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        currencySymbol,
        totalItems,
        totalPrice,
        formatPrice,
        addItem,
        removeItem,
        setQty,
        getItemKey: getCartItemKey,
        getUnitPrice: getItemUnitPrice,
        clear,
        clearCart: clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
