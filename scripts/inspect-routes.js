const fs = require('fs');
const path = require('path');

const syncRoutesPath = path.resolve(__dirname, '..', '..', 'FloDesktop', 'main', 'routes', 'cloud-sync.ts');
if (fs.existsSync(syncRoutesPath)) {
  console.log(fs.readFileSync(syncRoutesPath, 'utf8'));
}
