const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://unified-frontend-production.up.railway.app';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'prod_shots');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  const shot = async (name) => {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, name + '.png') });
    console.log(`  ✓ ${name}`);
  };

  console.log('\n=== MOBILE VIEWS ===\n');

  // Consumer mobile
  await page.goto(BASE_URL + '/consumer/shop');
  await page.waitForTimeout(2500);
  await shot('14_mobile_shop');

  await page.goto(BASE_URL + '/consumer/orders');
  await page.waitForTimeout(2000);
  await shot('15_mobile_orders');

  await page.goto(BASE_URL + '/consumer/wallet');
  await page.waitForTimeout(2000);
  await shot('16_mobile_wallet');

  // Login page
  await page.goto(BASE_URL + '/login');
  await page.waitForTimeout(2000);
  await shot('17_retailer_login');

  // Retailer mobile
  await page.goto(BASE_URL + '/retailer/dashboard');
  await page.waitForTimeout(2500);
  await shot('28_mobile_retailer_dashboard');

  await page.goto(BASE_URL + '/retailer/add-stock');
  await page.waitForTimeout(2000);
  await shot('29_mobile_add_stock');

  await page.goto(BASE_URL + '/retailer/management');
  await page.waitForTimeout(2000);
  await shot('30_mobile_management');

  await browser.close();

  console.log('\n=== DONE ===');
  const files = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).sort();
  console.log(`Total: ${files.length} screenshots in ${SCREENSHOT_DIR}`);
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
