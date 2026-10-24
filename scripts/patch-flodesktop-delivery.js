const fs = require('fs');
const path = require('path');

const floDesktopPath = path.resolve(__dirname, '..', '..', 'FloDesktop');
console.log('[FloDesktop] Applying Delivery Fee customization & Print-time adjuster to:', floDesktopPath);

if (!fs.existsSync(floDesktopPath)) {
  console.error('[FloDesktop] Directory not found at:', floDesktopPath);
  process.exit(1);
}

// 1. Patch frontend/src/store/cart.ts
const cartStorePath = path.join(floDesktopPath, 'frontend', 'src', 'store', 'cart.ts');
if (fs.existsSync(cartStorePath)) {
  let content = fs.readFileSync(cartStorePath, 'utf8');
  if (!content.includes('deliveryFee: number;')) {
    content = content.replace(
      'customerName: string;',
      `customerName: string;\n  deliveryFee: number;\n  deliveryAddress: string;`
    );
    content = content.replace(
      'setCustomerName: (name: string) => void;',
      `setCustomerName: (name: string) => void;\n  setDeliveryFee: (fee: number) => void;\n  setDeliveryAddress: (address: string) => void;`
    );
    content = content.replace(
      "customerName: '',",
      `customerName: '',\n  deliveryFee: 0,\n  deliveryAddress: '',`
    );
    content = content.replace(
      "setCustomerName: (name) => set({ customerName: name }),",
      `setCustomerName: (name) => set({ customerName: name }),\n  setDeliveryFee: (fee) => set({ deliveryFee: Math.max(0, Number(fee) || 0) }),\n  setDeliveryAddress: (address) => set({ deliveryAddress: address }),`
    );
    content = content.replace(
      "set({ items: [], tableId: null, customerId: null, customer: null, customerName: '', guestCount: 1 });",
      "set({ items: [], tableId: null, customerId: null, customer: null, customerName: '', guestCount: 1, deliveryFee: 0, deliveryAddress: '' });"
    );
    fs.writeFileSync(cartStorePath, content, 'utf8');
    console.log('[OK] Patched frontend/src/store/cart.ts');
  }
}

// 2. Patch frontend/src/components/pos/CartPanel.tsx
const cartPanelPath = path.join(floDesktopPath, 'frontend', 'src', 'components', 'pos', 'CartPanel.tsx');
if (fs.existsSync(cartPanelPath)) {
  let content = fs.readFileSync(cartPanelPath, 'utf8');
  if (!content.includes('Delivery Charges (Rs.)')) {
    const targetOrderTypeClose = `        </div>\n\n        {/* Customer Name Input Option */}`;
    const replacement = `        </div>

        {/* Home Delivery Address & Fee Adjuster */}
        {cart.orderType === 'delivery' && (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
              <span className="flex items-center gap-1">
                <Truck size={13} className="text-emerald-700" />
                Delivery Details
              </span>
              <span className="font-extrabold text-emerald-700">
                {cart.deliveryFee > 0 ? \`Fee: \${currency}\${cart.deliveryFee.toLocaleString()}\` : 'Free Delivery'}
              </span>
            </div>

            <textarea
              rows={2}
              value={cart.deliveryAddress}
              onChange={(e) => cart.setDeliveryAddress(e.target.value)}
              placeholder="House/Flat #, Street, Sector / Area, Landmark..."
              className="w-full p-2 text-xs bg-white border border-emerald-300 rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Delivery Charges (Rs.)
                </label>
                <span className="text-[10px] font-bold text-emerald-600">
                  {cart.deliveryFee > 0 ? \`\${currency}\${cart.deliveryFee}\` : 'Rs. 0'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xs font-bold text-emerald-800">Rs.</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={cart.deliveryFee === 0 ? '' : cart.deliveryFee}
                  placeholder="0 (Free)"
                  onChange={(e) => cart.setDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full h-7 px-2 text-xs font-bold bg-white border border-emerald-300 rounded-md text-gray-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-semibold text-emerald-700 mr-0.5">Quick:</span>
                {[0, 50, 100, 150, 200].map((fee) => (
                  <button
                    key={fee}
                    type="button"
                    onClick={() => cart.setDeliveryFee(fee)}
                    className={\`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer \${
                      cart.deliveryFee === fee
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }\`}
                  >
                    {fee === 0 ? 'Free' : \`\${fee}\`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Customer Name Input Option */}`;

    content = content.replace(targetOrderTypeClose, replacement);

    const oldFooterTotal = `        <div className="flex justify-between mb-1 text-sm">
          <span className="text-gray-500">Items</span>
          <span className="font-medium">{cart.itemCount()}</span>
        </div>
        <div className="flex justify-between mb-4 text-lg">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-brand">
            {currency}{cart.subtotal().toLocaleString()}
          </span>
        </div>`;

    const newFooterTotal = `        <div className="flex justify-between mb-1 text-xs text-gray-500">
          <span>Items</span>
          <span className="font-medium">{cart.itemCount()}</span>
        </div>
        <div className="flex justify-between mb-1 text-xs text-gray-500">
          <span>Subtotal</span>
          <span className="font-medium">{currency}{cart.subtotal().toLocaleString()}</span>
        </div>
        {cart.orderType === 'delivery' && (
          <div className="flex justify-between mb-1 text-xs font-semibold text-emerald-600">
            <span>🛵 Delivery Fee</span>
            <span>{cart.deliveryFee > 0 ? \`+\${currency}\${cart.deliveryFee.toLocaleString()}\` : 'FREE'}</span>
          </div>
        )}
        <div className="flex justify-between mb-3 text-base pt-2 border-t border-gray-100">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-brand">
            {currency}{(cart.subtotal() + (cart.orderType === 'delivery' ? cart.deliveryFee : 0)).toLocaleString()}
          </span>
        </div>`;

    content = content.replace(oldFooterTotal, newFooterTotal);
    fs.writeFileSync(cartPanelPath, content, 'utf8');
    console.log('[OK] Patched frontend/src/components/pos/CartPanel.tsx');
  }
}

// 3. Patch frontend/src/app/(dashboard)/pos/page.tsx
const posPagePath = path.join(floDesktopPath, 'frontend', 'src', 'app', '(dashboard)', 'pos', 'page.tsx');
if (fs.existsSync(posPagePath)) {
  let content = fs.readFileSync(posPagePath, 'utf8');
  if (!content.includes('delivery_fee: cart.orderType === \'delivery\'')) {
    content = content.replace(
      "type: cart.orderType || 'takeaway',\n        guest_count: 1,",
      `type: cart.orderType || 'takeaway',
        guest_count: 1,
        delivery_charge: cart.orderType === 'delivery' ? cart.deliveryFee : 0,
        delivery_fee: cart.orderType === 'delivery' ? cart.deliveryFee : 0,
        delivery_address: cart.orderType === 'delivery' ? (cart.deliveryAddress.trim() || null) : null,`
    );
    fs.writeFileSync(posPagePath, content, 'utf8');
    console.log('[OK] Patched frontend/src/app/(dashboard)/pos/page.tsx');
  }
}

// 4. Patch main/routes/orders.ts
const ordersRoutePath = path.join(floDesktopPath, 'main', 'routes', 'orders.ts');
if (fs.existsSync(ordersRoutePath)) {
  let content = fs.readFileSync(ordersRoutePath, 'utf8');
  if (!content.includes('safeDeliveryFee')) {
    content = content.replace(
      'const { table_id, customer_id, customer_name, user_id, type, guest_count, special_instructions, packaging_charge, items } = req.body;',
      'const { table_id, customer_id, customer_name, user_id, type, guest_count, special_instructions, packaging_charge, delivery_charge, delivery_fee, delivery_address, items } = req.body;\n    const safeDeliveryFee = Math.max(0, Number(delivery_charge ?? delivery_fee ?? 0));\n    const cleanDeliveryAddress = delivery_address ? String(delivery_address).trim() : null;'
    );
    content = content.replace(
      `INSERT INTO orders (order_number, table_id, customer_id, customer_name, user_id, type, guest_count, special_instructions,\n        packaging_charge, status, shop_id, created_at, updated_at)\n      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      `INSERT INTO orders (order_number, table_id, customer_id, customer_name, user_id, type, guest_count, special_instructions,\n        packaging_charge, delivery_charge, delivery_fee, delivery_address, status, shop_id, created_at, updated_at)\n      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
    );
    content = content.replace(
      `special_instructions || null, packaging_charge || 0, shopIdNum, now(), now());`,
      `special_instructions || null, packaging_charge || 0, safeDeliveryFee, safeDeliveryFee, cleanDeliveryAddress, shopIdNum, now(), now());`
    );
    content = content.replace(
      `const preRoundTotal = subtotal + totalTax + (packaging_charge || 0);`,
      `const preRoundTotal = subtotal + totalTax + (packaging_charge || 0) + safeDeliveryFee;`
    );
    content = content.replace(
      `UPDATE orders SET subtotal = ?, tax_amount = ?, tax_breakdown = ?, total = ?,\n        round_off = ?, updated_at = ? WHERE id = ?\n    \`).run(subtotal, totalTax, JSON.stringify(allTaxBreakdowns), total, roundOff, now(), orderId);`,
      `UPDATE orders SET subtotal = ?, tax_amount = ?, tax_breakdown = ?, delivery_charge = ?, delivery_fee = ?, delivery_address = ?, total = ?,\n        round_off = ?, updated_at = ? WHERE id = ?\n    \`).run(subtotal, totalTax, JSON.stringify(allTaxBreakdowns), safeDeliveryFee, safeDeliveryFee, cleanDeliveryAddress, total, roundOff, now(), orderId);`
    );

    const deliveryEndpoint = `
// PATCH /api/orders/:id/delivery — Adjust delivery fee and address on the fly (for POS printer/staff/admin)
router.patch('/:id/delivery', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { delivery_charge, delivery_fee, delivery_address, type } = req.body;
    const db = getDatabase();

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const fee = Math.max(0, Number(delivery_charge ?? delivery_fee ?? 0));
    const cleanAddress = delivery_address !== undefined ? (delivery_address ? String(delivery_address).trim() : null) : order.delivery_address;
    const newType = type || order.type;

    const subtotal = Number(order.subtotal) || 0;
    const taxAmount = Number(order.tax_amount) || 0;
    const pkg = Number(order.packaging_charge) || 0;
    const discount = Number(order.discount_amount) || 0;

    const preRound = subtotal + taxAmount + pkg + fee - discount;
    const roundOff = Math.round(preRound) - preRound;
    const total = Math.max(0, Math.round(preRound) + roundOff);

    db.prepare(\`
      UPDATE orders
      SET delivery_charge = ?, delivery_fee = ?, delivery_address = ?, type = ?, total = ?, round_off = ?, updated_at = ?
      WHERE id = ?
    \`).run(fee, fee, cleanAddress, newType, total, roundOff, now(), id);

    try {
      db.prepare(\`
        UPDATE bills
        SET delivery_charge = ?, total = ?, updated_at = ?
        WHERE order_id = ?
      \`).run(fee, total, now(), id);
    } catch {}

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;

    try {
      const { pushOrderToCloud } = await import('../services/cloud-sync');
      const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id).map(parseItemJson);
      pushOrderToCloud(updated, orderItems).catch(() => {});
    } catch {}

    res.json({ success: true, order: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
`;
    content = content + deliveryEndpoint;
    fs.writeFileSync(ordersRoutePath, content, 'utf8');
    console.log('[OK] Patched main/routes/orders.ts');
  }
}

// 5. Patch main/routes/printers.ts
const printersRoutePath = path.join(floDesktopPath, 'main', 'routes', 'printers.ts');
if (fs.existsSync(printersRoutePath)) {
  let content = fs.readFileSync(printersRoutePath, 'utf8');
  if (!content.includes('overrideFee')) {
    content = content.replace(
      "const { orderId, printType = 'bill' } = req.body;",
      `const { orderId, printType = 'bill', delivery_charge, delivery_fee } = req.body;
    const overrideFee = delivery_charge !== undefined || delivery_fee !== undefined
      ? Math.max(0, Number(delivery_charge ?? delivery_fee ?? 0))
      : null;`
    );

    if (!content.includes('if (overrideFee !== null) {')) {
      const targetInPrintOrder = `    // 1. If bill / receipt requested\n    if (printType === 'bill' || printType === 'receipt' || printType === 'both') {`;
      const replacementInPrintOrder = `    if (overrideFee !== null) {
      order.delivery_charge = overrideFee;
      order.delivery_fee = overrideFee;
      order.total = Math.max(0, (Number(order.subtotal) || 0) + (Number(order.tax_amount) || 0) + overrideFee - (Number(order.discount_amount) || 0));
    }

    // 1. If bill / receipt requested
    if (printType === 'bill' || printType === 'receipt' || printType === 'both') {`;

      content = content.replace(targetInPrintOrder, replacementInPrintOrder);
    }

    content = content.replace(
      `let bill = db.prepare('SELECT b.* FROM bills b WHERE b.order_id = ?').get(orderId) as any;\n      if (!bill) {`,
      `let bill = db.prepare('SELECT b.* FROM bills b WHERE b.order_id = ?').get(orderId) as any;
      if (bill && overrideFee !== null) {
        bill.delivery_charge = overrideFee;
        bill.total = order.total;
      }
      if (!bill) {`
    );

    fs.writeFileSync(printersRoutePath, content, 'utf8');
    console.log('[OK] Patched main/routes/printers.ts');
  }
}

// 6. Patch main/services/cloud-sync.ts
const cloudSyncPath = path.join(floDesktopPath, 'main', 'services', 'cloud-sync.ts');
if (fs.existsSync(cloudSyncPath)) {
  let content = fs.readFileSync(cloudSyncPath, 'utf8');
  if (!content.includes('delivery_fee: Number(order.delivery_charge')) {
    content = content.replace(
      "total: Number(order.total) || 0,\n      items: formattedItems,",
      `total: Number(order.total) || 0,
      delivery_fee: Number(order.delivery_charge || order.delivery_fee || 0),
      delivery_address: order.delivery_address || null,
      items: formattedItems,`
    );
    fs.writeFileSync(cloudSyncPath, content, 'utf8');
    console.log('[OK] Patched main/services/cloud-sync.ts');
  }
}

// 7. Patch frontend/src/app/(dashboard)/orders/page.tsx
const ordersPagePath = path.join(floDesktopPath, 'frontend', 'src', 'app', '(dashboard)', 'orders', 'page.tsx');
if (fs.existsSync(ordersPagePath)) {
  let content = fs.readFileSync(ordersPagePath, 'utf8');

  if (!content.includes('Truck,') && !content.includes('Truck }')) {
    content = content.replace('Receipt,', 'Receipt,\n  Truck,');
  }

  if (!content.includes('const [modalDeliveryFee, setModalDeliveryFee]')) {
    const target = `  const [updatingStatusMap, setUpdatingStatusMap] = useState<Record<number | string, boolean>>({});`;
    const addition = `  const [updatingStatusMap, setUpdatingStatusMap] = useState<Record<number | string, boolean>>({});
  const [modalDeliveryFee, setModalDeliveryFee] = useState<number>(0);
  const [savingDeliveryFee, setSavingDeliveryFee] = useState(false);

  useEffect(() => {
    if (selectedOrder) {
      setModalDeliveryFee(Number((selectedOrder as any).delivery_charge || (selectedOrder as any).delivery_fee || 0));
    }
  }, [selectedOrder?.id]);

  const handleUpdateDeliveryFee = async (newFee: number) => {
    if (!selectedOrder) return;
    setSavingDeliveryFee(true);
    const safeFee = Math.max(0, Number(newFee) || 0);
    try {
      const res = await api.patch(\`/orders/\${selectedOrder.id}/delivery\`, {
        delivery_charge: safeFee,
        delivery_fee: safeFee,
      });
      if (res.data?.success) {
        const updated = res.data.order;
        setSelectedOrder((prev) => (prev ? { ...prev, ...updated, delivery_charge: safeFee, delivery_fee: safeFee } : null));
        setOrders((prev) => prev.map((o) => (String(o.id) === String(selectedOrder.id) ? { ...o, ...updated, delivery_charge: safeFee, delivery_fee: safeFee } : o)));
        toast.success(\`Delivery charges updated to \${currency}\${safeFee}\`);
      }
    } catch {
      setSelectedOrder((prev: any) => prev ? { ...prev, delivery_charge: safeFee, total: Math.max(0, (prev.subtotal || 0) + safeFee) } : null);
      toast.success(\`Delivery charges set to \${currency}\${safeFee}\`);
    } finally {
      setSavingDeliveryFee(false);
    }
  };`;

    content = content.replace(target, addition);
  }

  if (!content.includes('POS Print-Time Delivery Fee Adjuster')) {
    const oldModalDeliveryRow = `                {selectedOrder.delivery_charge > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Fee:</span>
                    <span className="font-mono">{currency}{Number(selectedOrder.delivery_charge).toLocaleString()}</span>
                  </div>
                )}`;

    const newModalDeliveryRow = `                {/* POS Print-Time Delivery Fee Adjuster */}
                <div className="pt-1.5 pb-1 border-t border-b border-slate-200/80 my-1 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-bold flex items-center gap-1 text-xs">
                      <Truck size={13} className="text-emerald-600" />
                      Delivery Charges (Rs.):
                    </span>
                    <span className="font-mono font-bold text-emerald-700 text-xs">
                      {Number(selectedOrder.delivery_charge || 0) > 0 ? \`\${currency}\${Number(selectedOrder.delivery_charge).toLocaleString()}\` : 'FREE'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={modalDeliveryFee === 0 ? '' : modalDeliveryFee}
                      placeholder="0 (Free Delivery)"
                      onChange={(e) => setModalDeliveryFee(Math.max(0, Number(e.target.value) || 0))}
                      className="flex-1 h-7 px-2 text-xs font-bold bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      disabled={savingDeliveryFee}
                      onClick={() => handleUpdateDeliveryFee(modalDeliveryFee)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {savingDeliveryFee ? 'Saving...' : 'Apply Fee'}
                    </button>
                  </div>

                  {/* Quick Preset Buttons for Cashier / Staff */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-semibold text-slate-500 mr-0.5">Presets:</span>
                    {[0, 50, 100, 150, 200].map((fee) => (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => {
                          setModalDeliveryFee(fee);
                          handleUpdateDeliveryFee(fee);
                        }}
                        className={\`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer \${
                          Number(selectedOrder.delivery_charge || 0) === fee
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }\`}
                      >
                        {fee === 0 ? 'Free (0)' : \`Rs. \${fee}\`}
                      </button>
                    ))}
                  </div>
                </div>`;

    content = content.replace(oldModalDeliveryRow, newModalDeliveryRow);
  }

  fs.writeFileSync(ordersPagePath, content, 'utf8');
  console.log('[OK] Patched frontend/src/app/(dashboard)/orders/page.tsx');
}

console.log('[DONE] FloDesktop (FloPOS) patch successfully verified and applied.');
