const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://unified-frontend-production.up.railway.app';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'prod_shots');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  const shot = async (name) => {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, name + '.png') });
    console.log(`  ✓ ${name}`);
  };

  console.log('\n=== RETAILER PORTAL ===\n');

  // Retailer Dashboard
  await page.goto(BASE_URL + '/retailer/dashboard');
  await page.waitForTimeout(3000);
  await shot('18_retailer_dashboard');

  // POS
  await page.goto(BASE_URL + '/retailer/pos');
  await page.waitForTimeout(2500);
  await shot('19_retailer_pos');

  // Add Stock (NEW)
  await page.goto(BASE_URL + '/retailer/add-stock');
  await page.waitForTimeout(2500);
  await shot('20_retailer_add_stock');

  // Inventory
  await page.goto(BASE_URL + '/retailer/inventory');
  await page.waitForTimeout(2500);
  await shot('21_retailer_inventory');

  // Orders
  await page.goto(BASE_URL + '/retailer/orders');
  await page.waitForTimeout(2500);
  await shot('22_retailer_orders');

  // Wallet
  await page.goto(BASE_URL + '/retailer/wallet');
  await page.waitForTimeout(2500);
  await shot('23_retailer_wallet');

  // My Management (NEW)
  await page.goto(BASE_URL + '/retailer/management');
  await page.waitForTimeout(2500);
  await shot('24_retailer_management');

  await browser.close();

  console.log('\n=== DONE ===');
  const files = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).sort();
  console.log(`Total: ${files.length} screenshots in ${SCREENSHOT_DIR}`);
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
