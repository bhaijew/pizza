/**
 * Customer Counter Dual-Screen "Pole Display" Sync Service
 * Real-time synchronization between Cashier POS Terminal and Counter Customer Screen.
 *
 * Transmits live:
 * - Cart line items (name, qty, price, variation)
 * - Subtotal, discounts, tax, and grand total
 * - Idle promotional banners & restaurant branding
 * - Dynamic Pakistani payment QR codes (Raast, EasyPaisa, JazzCash)
 *
 * Uses hybrid zero-latency communication:
 * 1. BroadcastChannel API (sub-5ms on multi-monitor / same workstation)
 * 2. Window LocalStorage events (cross-tab secondary screen)
 * 3. Supabase Realtime WebSocket broadcast (wireless Android tablet / iPad counter stand)
 */

export interface PoleDisplayItem {
  id?: string | number;
  name: string;
  qty: number;
  price: number;
  detail?: string;
}

export type PoleDisplayStatus = "idle" | "active" | "payment" | "completed";

export interface PoleDisplayState {
  status: PoleDisplayStatus;
  shopId: number | null;
  shopName: string;
  shopSlug?: string;
  shopLogo?: string | null;
  currencySymbol: string;
  orderNumber?: string;
  customerName?: string;
  items: PoleDisplayItem[];
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;
  orderType: "dine_in" | "takeaway" | "delivery";
  tableNumber?: string | null;
  cashTendered?: number;
  changeDue?: number;
  paymentMethod?: string;
  raastId?: string;
  easyPaisaNumber?: string;
  jazzCashNumber?: string;
  updatedAt: number;
}

export const POLE_DISPLAY_CHANNEL_PREFIX = "solewhat-pole-display";
export const POLE_LOCAL_STORAGE_KEY = "solewhat_pole_display_state";
export const POLE_BROADCAST_CHANNEL_NAME = "solewhat_pole_display_channel";

/**
 * Broadcast current POS cart state to Customer Pole Display
 */
export function broadcastPoleDisplay(state: Partial<PoleDisplayState>, supabaseClient?: any): void {
  if (typeof window === "undefined") return;

  const fullState: PoleDisplayState = {
    status: state.status || "active",
    shopId: state.shopId ?? null,
    shopName: state.shopName || "SoleWhat Store",
    shopSlug: state.shopSlug || "",
    shopLogo: state.shopLogo || null,
    currencySymbol: state.currencySymbol || "Rs.",
    orderNumber: state.orderNumber || "",
    customerName: state.customerName || "",
    items: state.items || [],
    subtotal: state.subtotal ?? 0,
    discount: state.discount ?? 0,
    tax: state.tax ?? 0,
    deliveryFee: state.deliveryFee ?? 0,
    total: state.total ?? 0,
    orderType: state.orderType || "takeaway",
    tableNumber: state.tableNumber || null,
    cashTendered: state.cashTendered,
    changeDue: state.changeDue,
    paymentMethod: state.paymentMethod,
    raastId: state.raastId,
    easyPaisaNumber: state.easyPaisaNumber,
    jazzCashNumber: state.jazzCashNumber,
    updatedAt: Date.now(),
  };

  // 1. BroadcastChannel API for same-browser multi-monitor setups
  try {
    if ("BroadcastChannel" in window) {
      const bc = new BroadcastChannel(POLE_BROADCAST_CHANNEL_NAME);
      bc.postMessage(fullState);
      bc.close();
    }
  } catch (err) {
    console.debug("[Pole Display] BroadcastChannel error:", err);
  }

  // 2. LocalStorage for cross-tab listening
  try {
    localStorage.setItem(POLE_LOCAL_STORAGE_KEY, JSON.stringify(fullState));
  } catch (err) {
    console.debug("[Pole Display] LocalStorage write error:", err);
  }

  // 3. Supabase Realtime Broadcast for wireless tablet / iPad stands
  if (supabaseClient && fullState.shopId) {
    try {
      const channel = supabaseClient.channel(`${POLE_DISPLAY_CHANNEL_PREFIX}-${fullState.shopId}`);
      channel.send({
        type: "broadcast",
        event: "cart_sync",
        payload: fullState,
      });
    } catch (err) {
      console.debug("[Pole Display] Supabase Realtime broadcast error:", err);
    }
  }
}

/**
 * Reset Pole Display to Idle Digital Signage Mode
 */
export function resetPoleDisplayToIdle(shopId: number | null, shopName: string, supabaseClient?: any): void {
  broadcastPoleDisplay(
    {
      status: "idle",
      shopId,
      shopName,
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      deliveryFee: 0,
      total: 0,
    },
    supabaseClient
  );
}

