import { fetchExpenses, getActiveShopContext } from "@/lib/admin-actions";
import { fetchSettings } from "@/lib/menu-data";
import ExpenseManager from "@/components/admin/ExpenseManager";
import type { Expense } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function AdminExpensesPage() {
  const activeShop = await getActiveShopContext();

  const [{ data: expenses }, settings] = await Promise.all([
    fetchExpenses(),
    fetchSettings(activeShop.shopId),
  ]);

  return (
    <div>
      <ExpenseManager
        initialExpenses={(expenses as Expense[]) || []}
        currencySymbol={settings.currency_symbol || "Rs."}
        shopId={activeShop.shopId}
      />
    </div>
  );
}
