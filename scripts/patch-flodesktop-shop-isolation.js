const fs = require('fs');
const path = require('path');

const floDesktopPath = path.resolve(__dirname, '..', '..', 'FloDesktop');
console.log('FloDesktop path:', floDesktopPath);

if (!fs.existsSync(floDesktopPath)) {
  console.log('FloDesktop directory not found at', floDesktopPath);
  process.exit(0);
}

// 1. Patch main/services/cloud-sync.ts
const cloudSyncPath = path.join(floDesktopPath, 'main', 'services', 'cloud-sync.ts');
if (fs.existsSync(cloudSyncPath)) {
  let content = fs.readFileSync(cloudSyncPath, 'utf8');

  // Replace hardcoded '4' in getCloudSyncStatus
  content = content.replace(
    /const currentShopId = getSetting\('cloud_shop_id',\s*'4'\);/g,
    `const currentShopId = getSetting('cloud_shop_id', '');`
  );
  content = content.replace(
    /const currentShopName = getSetting\('cloud_shop_name',\s*'papa pizza'\);/g,
    `const currentShopName = getSetting('cloud_shop_name', '');`
  );
  content = content.replace(
    /const currentShopSlug = getSetting\('cloud_shop_slug',\s*'papa-'\);/g,
    `const currentShopSlug = getSetting('cloud_shop_slug', '');`
  );

  // Replace hardcoded '4' in pushOrderToCloud
  content = content.replace(
    /const shopId = order\.shop_id \|\| getSetting\('cloud_shop_id',\s*'4'\);/g,
    `const shopId = order.shop_id || getSetting('cloud_shop_id', '');`
  );

  // Replace hardcoded '4' in tables sync
  content = content.replace(
    /getSetting\('cloud_shop_id',\s*'4'\)/g,
    `getSetting('cloud_shop_id', '')`
  );

  // In selectCloudShop, add purge of orders not belonging to the selected shop
  if (!content.includes('Multi-branch order isolation: clean up other shops')) {
    content = content.replace(
      /console\.log\(`\[CloudSync\] Switched POS terminal to branch: \${shopName} \(ID: \${shopId}\)`\);/,
      `console.log(\`[CloudSync] Switched POS terminal to branch: \${shopName} (ID: \${shopId})\`);

    // Multi-branch order isolation: clean up other shops' orders from local SQLite
    try {
      const db = getDatabase();
      db.prepare('DELETE FROM orders WHERE shop_id IS NOT NULL AND shop_id != ?').run(Number(shopId));
      db.prepare('DELETE FROM order_items WHERE order_id NOT IN (SELECT id FROM orders)').run();
    } catch (purgeErr) {
      console.warn('[CloudSync] Branch switch order purge notice:', purgeErr);
    }`
    );
  }

  // In pullOnlineOrdersFromCloud, ensure we do not pull if no branch is selected
  content = content.replace(
    /const currentShopId = getSetting\('cloud_shop_id', ''\);\s*try\s*\{\s*let query = client\s*\.from\('orders'\)/,
    `const currentShopId = getSetting('cloud_shop_id', '');
  if (!currentShopId) {
    return { success: true, message: 'No branch selected', importedCount: 0, totalCloudOrders: 0 };
  }
  try {
    let query = client
      .from('orders')`
  );

  fs.writeFileSync(cloudSyncPath, content, 'utf8');
  console.log('[OK] Patched cloud-sync.ts for multi-branch order isolation.');
}

// 2. Patch main/routes/auth.ts
const authRoutesPath = path.join(floDesktopPath, 'main', 'routes', 'auth.ts');
if (fs.existsSync(authRoutesPath)) {
  let content = fs.readFileSync(authRoutesPath, 'utf8');

  // In buildLocalTenant, add shop_id
  if (!content.includes('shop_id: s.cloud_shop_id ? Number(s.cloud_shop_id) : null')) {
    content = content.replace(
      /id:\s*1,\s*business_name:/,
      `id: 1,
    shop_id: s.cloud_shop_id ? Number(s.cloud_shop_id) : null,
    business_name:`
    );
  }

  // In login and pin-login, auto-switch branch if user has shop_id
  content = content.replace(
    /if \(user\.shop_id && currentShopId && Number\(user\.shop_id\) !== Number\(currentShopId\)\)/g,
    `if (user.shop_id && (!currentShopId || Number(user.shop_id) !== Number(currentShopId)))`
  );

  fs.writeFileSync(authRoutesPath, content, 'utf8');
  console.log('[OK] Patched auth.ts for tenant shop_id & auto branch lock.');
}

// 3. Patch main/routes/orders.ts
const ordersRoutesPath = path.join(floDesktopPath, 'main', 'routes', 'orders.ts');
if (fs.existsSync(ordersRoutesPath)) {
  let content = fs.readFileSync(ordersRoutesPath, 'utf8');

  // Remove blind update: db.prepare("UPDATE orders SET shop_id = ? WHERE shop_id IS NULL").run(parseInt(activeShop, 10));
  content = content.replace(
    /if \(activeShop\) \{\s*try \{\s*db\.prepare\("UPDATE orders SET shop_id = \? WHERE shop_id IS NULL"\)\.run\(parseInt\(activeShop, 10\)\);\s*\} catch \{\}\s*\}/g,
    `// Preserving original shop_id for multi-branch isolation`
  );

  fs.writeFileSync(ordersRoutesPath, content, 'utf8');
  console.log('[OK] Patched main/routes/orders.ts to prevent overwriting order shop_ids.');
}

// 4. Patch frontend/src/app/(dashboard)/orders/page.tsx
const frontendOrdersPath = path.join(floDesktopPath, 'frontend', 'src', 'app', '(dashboard)', 'orders', 'page.tsx');
if (fs.existsSync(frontendOrdersPath)) {
  let content = fs.readFileSync(frontendOrdersPath, 'utf8');

  // Pass activeBranchId to api.get('/orders')
  content = content.replace(
    /const res = await api\.get\('\/orders\?sync=1'\);/g,
    `const syncStatusRes = await api.get('/cloud-sync/status').catch(() => null);
      const activeBranchId = syncStatusRes?.data?.currentShopId || (currentTenant as any)?.shop_id || '';
      const res = await api.get('/orders?sync=1' + (activeBranchId ? \`&shop_id=\${activeBranchId}\` : ''));`
  );

  // In direct Supabase fallback, do not default activeBranchId to '4'
  content = content.replace(
    /const activeBranchId = syncStatusRes\?\.data\?\.currentShopId \|\| \(currentTenant as any\)\?\.shop_id \|\| '4';/g,
    `const activeBranchId = syncStatusRes?.data?.currentShopId || (currentTenant as any)?.shop_id || '';`
  );

  // Ensure setOrders receives strictly branch orders
  if (!content.includes('const branchOrders = activeBranchId')) {
    content = content.replace(
      /setOrders\(finalOrders\);/,
      `const branchOrders = activeBranchId
        ? finalOrders.filter((fo) => !fo.shop_id || String(fo.shop_id) === String(activeBranchId))
        : finalOrders;
      setOrders(branchOrders);`
    );
  }

  fs.writeFileSync(frontendOrdersPath, content, 'utf8');
  console.log('[OK] Patched frontend orders/page.tsx for strict shop isolation.');
}

console.log('FloDesktop multi-branch isolation patch completed successfully.');
