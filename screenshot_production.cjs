const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://unified-frontend-production.up.railway.app';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'production_screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('Starting production screenshot capture...\n');

  // =====================
  // CUSTOMER PORTAL
  // =====================
  console.log('=== CUSTOMER PORTAL ===\n');

  // 1. Login Page
  console.log('1. Customer Login Page');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_customer_login.png'), fullPage: true });

  // Login as customer
  await page.fill('input[type="text"], input[placeholder*="Phone"], input[placeholder*="phone"]', '0788123456');
  await page.fill('input[type="password"]', '1234');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_customer_login_filled.png'), fullPage: true });

  // Try to login
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // 2. Shop Page with Location Modal
  console.log('2. Shop Page - Location Modal');
  await page.goto(`${BASE_URL}/consumer/shop`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_shop_location_modal.png'), fullPage: true });

  // Fill location if modal is visible
  try {
    const districtSelector = await page.$('div.ant-select');
    if (districtSelector) {
      await page.click('.ant-select:first-child');
      await page.waitForTimeout(500);
      await page.click('.ant-select-item:first-child');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_shop_location_selected.png'), fullPage: true });
    }
  } catch (e) {
    console.log('  Location modal interaction skipped');
  }

  // 3. Shop Page - Store Selection
  console.log('3. Shop Page - Store Selection');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_shop_store_selection.png'), fullPage: true });

  // 4. Shop Page - Products
  console.log('4. Shop Page - Products');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_shop_products.png'), fullPage: true });

  // 5. Orders Page
  console.log('5. Orders Page');
  await page.goto(`${BASE_URL}/consumer/orders`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_orders_page.png'), fullPage: true });

  // 6. Wallet Page
  console.log('6. Wallet Page');
  await page.goto(`${BASE_URL}/consumer/wallet`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_wallet_overview.png'), fullPage: true });

  // Wallet - NFC Cards Tab
  try {
    await page.click('text=My NFC Cards');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_wallet_nfc_cards.png'), fullPage: true });
  } catch (e) {}

  // Wallet - Dashboard Ledger Tab
  try {
    await page.click('text=Dashboard Ledger');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_wallet_dashboard_ledger.png'), fullPage: true });
  } catch (e) {}

  // Wallet - Credit Ledger Tab
  try {
    await page.click('text=Credit Ledger');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_wallet_credit_ledger.png'), fullPage: true });
  } catch (e) {}

  // 7. Gas Top-up Page
  console.log('7. Gas Top-up Page');
  await page.goto(`${BASE_URL}/consumer/gas`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_gas_topup.png'), fullPage: true });

  // Gas - My Meters Tab
  try {
    await page.click('text=My Gas Meters');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_gas_my_meters.png'), fullPage: true });
  } catch (e) {}

  // Gas - Usage History Tab
  try {
    await page.click('text=Usage History');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_gas_usage_history.png'), fullPage: true });
  } catch (e) {}

  // 8. Rewards Page
  console.log('8. Rewards Page');
  await page.goto(`${BASE_URL}/consumer/rewards`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_rewards_overview.png'), fullPage: true });

  // Rewards - History Tab
  try {
    await page.click('text=History');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_rewards_history.png'), fullPage: true });
  } catch (e) {}

  // 9. Profile Page
  console.log('9. Profile Page');
  await page.goto(`${BASE_URL}/consumer/profile`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_profile_page.png'), fullPage: true });

  // =====================
  // MOBILE VIEW - CUSTOMER
  // =====================
  console.log('\n=== CUSTOMER MOBILE VIEW ===\n');

  await context.setViewportSize({ width: 390, height: 844 }); // iPhone 14 size

  console.log('10. Mobile - Shop');
  await page.goto(`${BASE_URL}/consumer/shop`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18_mobile_shop.png'), fullPage: true });

  console.log('11. Mobile - Orders');
  await page.goto(`${BASE_URL}/consumer/orders`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19_mobile_orders.png'), fullPage: true });

  console.log('12. Mobile - Wallet');
  await page.goto(`${BASE_URL}/consumer/wallet`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20_mobile_wallet.png'), fullPage: true });

  console.log('13. Mobile - Gas');
  await page.goto(`${BASE_URL}/consumer/gas`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '21_mobile_gas.png'), fullPage: true });

  console.log('14. Mobile - Bottom Navigation');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '22_mobile_bottom_nav.png'), fullPage: true });

  // Reset viewport for retailer
  await context.setViewportSize({ width: 1920, height: 1080 });

  // =====================
  // RETAILER PORTAL
  // =====================
  console.log('\n=== RETAILER PORTAL ===\n');

  // 15. Retailer Login
  console.log('15. Retailer Login');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForTimeout(2000);

  // Select Retailer role
  try {
    await page.click('text=Retailer');
    await page.waitForTimeout(1000);
  } catch (e) {}

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '23_retailer_login.png'), fullPage: true });

  // Login as retailer
  try {
    await page.fill('input[type="email"], input[placeholder*="email"]', 'retailer@bigcompany.rw');
    await page.fill('input[type="password"]', 'retailer123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  } catch (e) {
    console.log('  Retailer login interaction skipped');
  }

  // 16. Retailer Dashboard
  console.log('16. Retailer Dashboard');
  await page.goto(`${BASE_URL}/retailer/dashboard`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '24_retailer_dashboard.png'), fullPage: true });

  // 17. Retailer POS
  console.log('17. Retailer POS');
  await page.goto(`${BASE_URL}/retailer/pos`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '25_retailer_pos.png'), fullPage: true });

  // 18. Add Stock (NEW)
  console.log('18. Add Stock Page');
  await page.goto(`${BASE_URL}/retailer/add-stock`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '26_retailer_add_stock.png'), fullPage: true });

  // 19. Inventory
  console.log('19. Retailer Inventory');
  await page.goto(`${BASE_URL}/retailer/inventory`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '27_retailer_inventory.png'), fullPage: true });

  // 20. Orders
  console.log('20. Retailer Orders');
  await page.goto(`${BASE_URL}/retailer/orders`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '28_retailer_orders.png'), fullPage: true });

  // 21. Wallet & Credit
  console.log('21. Retailer Wallet & Credit');
  await page.goto(`${BASE_URL}/retailer/wallet`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '29_retailer_wallet.png'), fullPage: true });

  // Wallet Credit Tab
  try {
    await page.click('text=Credit');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '30_retailer_credit.png'), fullPage: true });
  } catch (e) {}

  // 22. My Management (NEW)
  console.log('22. My Management Page');
  await page.goto(`${BASE_URL}/retailer/management`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '31_retailer_management_balance_check.png'), fullPage: true });

  // Management - Card Transactions Tab
  try {
    await page.click('text=Card Transactions');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '32_retailer_management_card_transactions.png'), fullPage: true });
  } catch (e) {}

  // Management - Gas Rewards Tab
  try {
    await page.click('text=Gas Rewards');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '33_retailer_management_gas_rewards.png'), fullPage: true });
  } catch (e) {}

  // Management - Profit Invoices Tab
  try {
    await page.click('text=Profit Invoices');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '34_retailer_management_profit_invoices.png'), fullPage: true });
  } catch (e) {}

  // 23. Analytics
  console.log('23. Retailer Analytics');
  await page.goto(`${BASE_URL}/retailer/analytics`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '35_retailer_analytics.png'), fullPage: true });

  // =====================
  // RETAILER MOBILE VIEW
  // =====================
  console.log('\n=== RETAILER MOBILE VIEW ===\n');

  await context.setViewportSize({ width: 390, height: 844 });

  console.log('24. Mobile - Retailer Dashboard');
  await page.goto(`${BASE_URL}/retailer/dashboard`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '36_mobile_retailer_dashboard.png'), fullPage: true });

  console.log('25. Mobile - Retailer Navigation');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '37_mobile_retailer_nav.png'), fullPage: true });

  await browser.close();

  console.log('\n=== SCREENSHOTS COMPLETE ===');
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

  // List all screenshots
  const files = fs.readdirSync(SCREENSHOT_DIR).sort();
  console.log(`\nTotal screenshots: ${files.length}`);
  files.forEach(f => console.log(`  - ${f}`));
}

takeScreenshots().catch(console.error);
