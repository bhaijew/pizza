import { fetchExpenses } from "@/lib/admin-actions";
import { fetchSettings } from "@/lib/menu-data";
import ExpenseManager from "@/components/admin/ExpenseManager";
import type { Expense } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function AdminExpensesPage() {
  const [{ data: expenses }, settings] = await Promise.all([
    fetchExpenses(),
    fetchSettings(),
  ]);

  return (
    <div>
      <ExpenseManager
        initialExpenses={(expenses as Expense[]) || []}
        currencySymbol={settings.currency_symbol || "$"}
      />
    </div>
  );
}
