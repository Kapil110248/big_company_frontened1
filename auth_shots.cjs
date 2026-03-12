const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://unified-frontend-production.up.railway.app';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'prod_shots');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  const shot = async (name) => {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, name + '.png'), fullPage: false });
    console.log(`  ✓ ${name}`);
  };

  // === CONSUMER PORTAL (Login required) ===
  console.log('\n=== CONSUMER PORTAL (with auth) ===\n');

  // Login as consumer
  await page.goto(BASE_URL + '/login');
  await page.waitForTimeout(2000);

  // Click consumer tab
  try {
    await page.click('div[role="tab"]:has-text("Consumer")', { timeout: 3000 });
    await page.waitForTimeout(500);
  } catch(e) {}

  // Fill credentials
  await page.fill('input[placeholder*="Phone" i], input[type="tel"]', '250788100001');
  await page.fill('input[type="password"]', '1234');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Shop page
  await page.goto(BASE_URL + '/consumer/shop');
  await page.waitForTimeout(3000);
  await shot('04_shop_page');

  // Orders
  await page.goto(BASE_URL + '/consumer/orders');
  await page.waitForTimeout(2500);
  await shot('05_orders_page');

  // Wallet
  await page.goto(BASE_URL + '/consumer/wallet');
  await page.waitForTimeout(2500);
  await shot('06_wallet_overview');

  // NFC Cards tab
  try {
    await page.click('button:has-text("My NFC Cards"), div[role="tab"]:has-text("NFC")', { timeout: 3000 });
    await page.waitForTimeout(1500);
    await shot('07_wallet_nfc_cards');
  } catch(e) { console.log('  - NFC tab not found'); }

  // Dashboard Ledger tab
  try {
    await page.click('button:has-text("Dashboard Ledger"), div[role="tab"]:has-text("Dashboard")', { timeout: 3000 });
    await page.waitForTimeout(1500);
    await shot('08_wallet_dashboard_ledger');
  } catch(e) { console.log('  - Dashboard Ledger tab not found'); }

  // Credit Ledger tab
  try {
    await page.click('button:has-text("Credit Ledger"), div[role="tab"]:has-text("Credit")', { timeout: 3000 });
    await page.waitForTimeout(1500);
    await shot('09_wallet_credit_ledger');
  } catch(e) { console.log('  - Credit Ledger tab not found'); }

  // Gas Top-up
  await page.goto(BASE_URL + '/consumer/gas');
  await page.waitForTimeout(2500);
  await shot('10_gas_topup');

  // Rewards
  await page.goto(BASE_URL + '/consumer/rewards');
  await page.waitForTimeout(2500);
  await shot('11_rewards_overview');

  // History tab
  try {
    await page.click('button:has-text("History"), div[role="tab"]:has-text("History")', { timeout: 3000 });
    await page.waitForTimeout(1500);
    await shot('12_rewards_history');
  } catch(e) { console.log('  - History tab not found'); }

  // Profile
  await page.goto(BASE_URL + '/consumer/profile');
  await page.waitForTimeout(2500);
  await shot('13_profile_page');

  // === RETAILER PORTAL ===
  console.log('\n=== RETAILER PORTAL (with auth) ===\n');

  // Login as retailer
  await page.goto(BASE_URL + '/login');
  await page.waitForTimeout(2000);

  // Click retailer tab
  try {
    await page.click('div[role="tab"]:has-text("Retailer")', { timeout: 3000 });
    await page.waitForTimeout(500);
  } catch(e) {}

  await shot('17_retailer_login');

  // Fill retailer credentials
  try {
    await page.fill('input[type="email"], input[placeholder*="email" i]', 'retailer@bigcompany.rw');
    await page.fill('input[type="password"]', 'retailer123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  } catch(e) { console.log('  - Retailer login failed'); }

  // Dashboard
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

  // Management tabs
  try {
    await page.click('button:has-text("Card Transactions"), div[role="tab"]:has-text("Card")', { timeout: 3000 });
    await page.waitForTimeout(1500);
    await shot('25_retailer_card_transactions');
  } catch(e) { console.log('  - Card Transactions tab not found'); }

  try {
    await page.click('button:has-text("Gas Rewards"), div[role="tab"]:has-text("Gas")', { timeout: 3000 });
    await page.waitForTimeout(1500);
    await shot('26_retailer_gas_rewards');
  } catch(e) { console.log('  - Gas Rewards tab not found'); }

  try {
    await page.click('button:has-text("Profit Invoices"), div[role="tab"]:has-text("Profit")', { timeout: 3000 });
    await page.waitForTimeout(1500);
    await shot('27_retailer_profit_invoices');
  } catch(e) { console.log('  - Profit Invoices tab not found'); }

  await browser.close();

  console.log('\n=== DONE ===');
  const files = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).sort();
  console.log(`Total: ${files.length} screenshots in ${SCREENSHOT_DIR}`);
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
