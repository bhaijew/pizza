const fs = require('fs');
const path = require('path');

const floDesktopPath = path.resolve(__dirname, '..', '..', 'FloDesktop');
const dbTsPath = path.join(floDesktopPath, 'main', 'db.ts');

if (fs.existsSync(dbTsPath)) {
  let content = fs.readFileSync(dbTsPath, 'utf8');

  // Fix extra closing bracket
  content = content.replace(
    /console\.log\('\[DB\] Cleaned up legacy dummy accounts\. Staff synced exclusively from Pizza System Super Admin\.'\);\s*\}\s*\}/g,
    `console.log('[DB] Cleaned up legacy dummy accounts. Staff synced exclusively from Pizza System Super Admin.');\n  }`
  );

  fs.writeFileSync(dbTsPath, content, 'utf8');
  console.log('[OK] Fixed extra bracket in db.ts.');
}
