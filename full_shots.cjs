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
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    storageState: undefined
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  const shot = async (name) => {
    const filePath = path.join(SCREENSHOT_DIR, name + '.png');
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`  ✓ ${name}`);
  };

  // Helper to close location modal if present
  const closeLocationModal = async () => {
    try {
      // Try to close by clicking outside or pressing Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } catch(e) {}

    try {
      // Or select a location if modal is present
      const modal = await page.$('.ant-modal-content');
      if (modal) {
        // Select district
        await page.click('.ant-select:first-child');
        await page.waitForTimeout(300);
        await page.click('.ant-select-item-option:first-child');
        await page.waitForTimeout(300);

        // Select sector
        await page.click('.ant-select:nth-child(2)');
        await page.waitForTimeout(300);
        await page.click('.ant-select-item-option:first-child');
        await page.waitForTimeout(300);

        // Select cell
        await page.click('.ant-select:nth-child(3)');
        await page.waitForTimeout(300);
        await page.click('.ant-select-item-option:first-child');
        await page.waitForTimeout(300);

        // Click find stores
        await page.click('button:has-text("Find")');
        await page.waitForTimeout(1000);
      }
    } catch(e) {}
  };

  console.log('\n=== CONSUMER PORTAL ===\n');

  // 1. Login Page
  await page.goto(BASE_URL + '/login');
  await page.waitForTimeout(2000);
  await shot('01_consumer_login');

  // Login as consumer
  try {
    await page.click('button:has-text("Auto-fill")');
    await page.waitForTimeout(500);
  } catch(e) {
    await page.fill('input[placeholder*="Phone" i], input[type="tel"]', '250788100001');
    await page.fill('input[type="password"]', '1234');
  }
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // 2. Shop Page with Location Modal
  await page.goto(BASE_URL + '/consumer/shop');
  await page.waitForTimeout(2000);
  await shot('02_shop_location_modal');

  // Close/handle location modal
  await closeLocationModal();
  await page.waitForTimeout(2000);
  await shot('03_shop_products');

  // 3. My Orders
  await page.goto(BASE_URL + '/consumer/orders');
  await page.waitForTimeout(2500);
  await shot('04_my_orders');

  // 4. Wallet & Cards - Overview (Transactions tab)
  await page.goto(BASE_URL + '/consumer/wallet');
  await page.waitForTimeout(2500);
  await shot('05_wallet_overview');

  // 5. Wallet - NFC Cards tab
  try {
    await page.click('button:has-text("My NFC Cards"), [role="tab"]:has-text("NFC")');
    await page.waitForTimeout(1500);
    await shot('06_wallet_nfc_cards');
  } catch(e) { console.log('  - NFC tab click failed, trying alternative'); }

  // 6. Wallet - Dashboard Ledger tab
  try {
    await page.click('button:has-text("Dashboard Ledger"), [role="tab"]:has-text("Dashboard")');
    await page.waitForTimeout(1500);
    await shot('07_wallet_dashboard_ledger');
  } catch(e) { console.log('  - Dashboard Ledger tab failed'); }

  // 7. Wallet - Credit Ledger tab
  try {
    await page.click('button:has-text("Credit Ledger"), [role="tab"]:has-text("Credit")');
    await page.waitForTimeout(1500);
    await shot('08_wallet_credit_ledger');
  } catch(e) { console.log('  - Credit Ledger tab failed'); }

  // 8. Gas Top-up
  await page.goto(BASE_URL + '/consumer/gas');
  await page.waitForTimeout(2500);
  await shot('09_gas_topup');

  // 9. Rewards - Overview
  await page.goto(BASE_URL + '/consumer/rewards');
  await page.waitForTimeout(2500);
  await shot('10_rewards_overview');

  // 10. Rewards - History tab
  try {
    await page.click('button:has-text("History"), [role="tab"]:has-text("History")');
    await page.waitForTimeout(1500);
    await shot('11_rewards_history');
  } catch(e) { console.log('  - History tab failed'); }

  // 11. Profile
  await page.goto(BASE_URL + '/consumer/profile');
  await page.waitForTimeout(2500);
  await shot('12_profile');

  // === RETAILER PORTAL ===
  console.log('\n=== RETAILER PORTAL ===\n');

  // Clear cookies and login as retailer
  await context.clearCookies();

  await page.goto(BASE_URL + '/login');
  await page.waitForTimeout(2000);

  // Click Retailer tab
  try {
    await page.click('[role="tab"]:has-text("Retailer")');
    await page.waitForTimeout(500);
  } catch(e) {}

  await shot('13_retailer_login');

  // Login as retailer
  try {
    await page.fill('input[type="email"], input[placeholder*="email" i]', 'retailer@bigcompany.rw');
    await page.fill('input[type="password"]', 'retailer123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  } catch(e) {
    console.log('  - Retailer login error:', e.message);
  }

  // 14. Retailer Dashboard
  await page.goto(BASE_URL + '/retailer/dashboard');
  await page.waitForTimeout(3000);
  await shot('14_retailer_dashboard');

  // 15. POS
  await page.goto(BASE_URL + '/retailer/pos');
  await page.waitForTimeout(2500);
  await shot('15_retailer_pos');

  // 16. Add Stock (NEW PAGE)
  await page.goto(BASE_URL + '/retailer/add-stock');
  await page.waitForTimeout(2500);
  await shot('16_retailer_add_stock');

  // 17. Inventory
  await page.goto(BASE_URL + '/retailer/inventory');
  await page.waitForTimeout(2500);
  await shot('17_retailer_inventory');

  // 18. Orders
  await page.goto(BASE_URL + '/retailer/orders');
  await page.waitForTimeout(2500);
  await shot('18_retailer_orders');

  // 19. Wallet
  await page.goto(BASE_URL + '/retailer/wallet');
  await page.waitForTimeout(2500);
  await shot('19_retailer_wallet');

  // 20. My Management (NEW PAGE)
  await page.goto(BASE_URL + '/retailer/management');
  await page.waitForTimeout(2500);
  await shot('20_retailer_management');

  await browser.close();

  console.log('\n=== DONE ===');
  const files = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png')).sort();
  console.log(`Total: ${files.length} screenshots in ${SCREENSHOT_DIR}`);
  files.forEach(f => console.log(`  - ${f}`));
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
