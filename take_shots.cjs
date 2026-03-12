const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://unified-frontend-production.up.railway.app';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'prod_shots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);

  const shot = async (name) => {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, name + '.png') });
    console.log(`  ✓ ${name}`);
  };

  console.log('\n=== CUSTOMER PORTAL ===\n');

  // 1. Login Page
  await page.goto(BASE_URL + '/login');
  await page.waitForTimeout(2000);
  await shot('01_login_page');

  // Try to select Consumer tab if exists
  try {
    await page.click('div[role="tab"]:has-text("Consumer")', { timeout: 3000 });
    await page.waitForTimeout(500);
  } catch(e) {}

  // Fill login - try different selectors
  try {
    await page.fill('input[placeholder*="phone" i]', '0788123456', { timeout: 3000 });
  } catch(e) {
    try {
      await page.fill('input:first-of-type', '0788123456', { timeout: 2000 });
    } catch(e2) {}
  }

  try {
    await page.fill('input[type="password"]', '1234', { timeout: 2000 });
  } catch(e) {}

  await shot('02_login_filled');

  // Click login
  try {
    await page.click('button[type="submit"]', { timeout: 3000 });
    await page.waitForTimeout(2000);
  } catch(e) {}

  // 2. Shop Page
  await page.goto(BASE_URL + '/consumer/shop');
  await page.waitForTimeout(3000);
  await shot('03_shop_location_modal');

  // Try to close/interact with location modal
  try {
    // Select district
    await page.click('.ant-select', { timeout: 2000 });
    await page.waitForTimeout(500);
    await page.click('.ant-select-item-option:first-child', { timeout: 2000 });
    await page.waitForTimeout(1000);
  } catch(e) {}

  await shot('04_shop_page');

  // 3. Orders
  await page.goto(BASE_URL + '/consumer/orders');
  await page.waitForTimeout(2000);
  await shot('05_orders_page');

  // 4. Wallet
  await page.goto(BASE_URL + '/consumer/wallet');
  await page.waitForTimeout(2000);
  await shot('06_wallet_overview');

  // Click NFC Cards tab
  try {
    await page.click('div[role="tab"]:has-text("NFC")', { timeout: 2000 });
    await page.waitForTimeout(1000);
    await shot('07_wallet_nfc_cards');
  } catch(e) {}

  // Click Dashboard Ledger
  try {
    await page.click('div[role="tab"]:has-text("Dashboard Ledger")', { timeout: 2000 });
    await page.waitForTimeout(1000);
    await shot('08_wallet_dashboard_ledger');
  } catch(e) {}

  // Click Credit Ledger
  try {
    await page.click('div[role="tab"]:has-text("Credit Ledger")', { timeout: 2000 });
    await page.waitForTimeout(1000);
    await shot('09_wallet_credit_ledger');
  } catch(e) {}

  // 5. Gas
  await page.goto(BASE_URL + '/consumer/gas');
  await page.waitForTimeout(2000);
  await shot('10_gas_topup');

  // 6. Rewards
  await page.goto(BASE_URL + '/consumer/rewards');
  await page.waitForTimeout(2000);
  await shot('11_rewards_overview');

  // History tab
  try {
    await page.click('div[role="tab"]:has-text("History")', { timeout: 2000 });
    await page.waitForTimeout(1000);
    await shot('12_rewards_history');
  } catch(e) {}

  // 7. Profile
  await page.goto(BASE_URL + '/consumer/profile');
  await page.waitForTimeout(2000);
  await shot('13_profile_page');

  // Mobile view
  console.log('\n=== MOBILE VIEW ===\n');
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto(BASE_URL + '/consumer/shop');
  await page.waitForTimeout(2000);
  await shot('14_mobile_shop');

  await page.goto(BASE_URL + '/consumer/orders');
  await page.waitForTimeout(1500);
  await shot('15_mobile_orders');

  await page.goto(BASE_URL + '/consumer/wallet');
  await page.waitForTimeout(1500);
  await shot('16_mobile_wallet');

  // === RETAILER PORTAL ===
  console.log('\n=== RETAILER PORTAL ===\n');
  await page.setViewportSize({ width: 1400, height: 900 });

  // Retailer login
  await page.goto(BASE_URL + '/login');
  await page.waitForTimeout(1500);

  // Select Retailer tab
  try {
    await page.click('div[role="tab"]:has-text("Retailer")', { timeout: 3000 });
    await page.waitForTimeout(500);
  } catch(e) {}

  await shot('17_retailer_login');

  // Try retailer login
  try {
    await page.fill('input[type="email"], input[placeholder*="email" i]', 'retailer@bigcompany.rw', { timeout: 2000 });
    await page.fill('input[type="password"]', 'retailer123', { timeout: 2000 });
    await page.click('button[type="submit"]', { timeout: 2000 });
    await page.waitForTimeout(2000);
  } catch(e) {}

  // Dashboard
  await page.goto(BASE_URL + '/retailer/dashboard');
  await page.waitForTimeout(2500);
  await shot('18_retailer_dashboard');

  // POS
  await page.goto(BASE_URL + '/retailer/pos');
  await page.waitForTimeout(2000);
  await shot('19_retailer_pos');

  // Add Stock (NEW)
  await page.goto(BASE_URL + '/retailer/add-stock');
  await page.waitForTimeout(2000);
  await shot('20_retailer_add_stock');

  // Inventory
  await page.goto(BASE_URL + '/retailer/inventory');
  await page.waitForTimeout(2000);
  await shot('21_retailer_inventory');

  // Orders
  await page.goto(BASE_URL + '/retailer/orders');
  await page.waitForTimeout(2000);
  await shot('22_retailer_orders');

  // Wallet
  await page.goto(BASE_URL + '/retailer/wallet');
  await page.waitForTimeout(2000);
  await shot('23_retailer_wallet');

  // My Management (NEW)
  await page.goto(BASE_URL + '/retailer/management');
  await page.waitForTimeout(2000);
  await shot('24_retailer_management');

  // Management tabs
  try {
    await page.click('div[role="tab"]:has-text("Card Transactions")', { timeout: 2000 });
    await page.waitForTimeout(1000);
    await shot('25_retailer_card_transactions');
  } catch(e) {}

  try {
    await page.click('div[role="tab"]:has-text("Gas Rewards")', { timeout: 2000 });
    await page.waitForTimeout(1000);
    await shot('26_retailer_gas_rewards');
  } catch(e) {}

  try {
    await page.click('div[role="tab"]:has-text("Profit Invoices")', { timeout: 2000 });
    await page.waitForTimeout(1000);
    await shot('27_retailer_profit_invoices');
  } catch(e) {}

  // Mobile retailer
  console.log('\n=== RETAILER MOBILE ===\n');
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto(BASE_URL + '/retailer/dashboard');
  await page.waitForTimeout(2000);
  await shot('28_mobile_retailer_dashboard');

  await browser.close();

  console.log('\n=== DONE ===');
  const files = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).sort();
  console.log(`Total: ${files.length} screenshots in ${SCREENSHOT_DIR}`);
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
