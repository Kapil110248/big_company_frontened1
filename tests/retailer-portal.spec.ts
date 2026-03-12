import { test, expect, Page } from '@playwright/test';

// Helper function to login as retailer
async function loginAsRetailer(page: Page) {
  await page.goto('/login');
  await page.click('button:has-text("Retailer")');
  await expect(page.locator('text=Retailer Dashboard')).toBeVisible({ timeout: 10000 });

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.clear();
  await emailInput.fill('retailer@bigcompany.rw');
  await passwordInput.clear();
  await passwordInput.fill('retailer123');

  const submitButton = page.locator('button:has-text("Sign in as Retailer")');
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/retailer/auth/login') && resp.status() === 200, { timeout: 15000 }).catch(() => null),
    submitButton.click()
  ]);

  await expect(page).toHaveURL(/\/retailer/, { timeout: 15000 });
}

test.describe('Retailer Portal Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRetailer(page);
  });

  test('sidebar shows correct menu items', async ({ page }) => {
    // Verify menu items exist
    await expect(page.locator('text=Dashboard').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=POS').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Add Stock').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Inventory').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Orders').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Wallet').first()).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/retailer-sidebar-menu.png', fullPage: true });
  });

  test('removed items are not in sidebar', async ({ page }) => {
    // Verify removed items NOT visible in the sidebar menu
    const sidebar = page.locator('.ant-layout-sider, .ant-menu');

    // NFC Cards, Employees, Vendors should not be in menu
    const nfcCardsInMenu = sidebar.locator('text=NFC Cards');
    const employeesInMenu = sidebar.locator('text=Employees');
    const vendorsInMenu = sidebar.locator('text=Vendors');

    await expect(nfcCardsInMenu).toHaveCount(0);
    await expect(employeesInMenu).toHaveCount(0);
    await expect(vendorsInMenu).toHaveCount(0);
  });
});

test.describe('Retailer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRetailer(page);
  });

  test('displays Capital Wallet with inventory value', async ({ page }) => {
    await page.goto('/retailer/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Capital Wallet').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/dashboard-capital-wallet.png' });
  });

  test('displays Profit Wallet with profit margin', async ({ page }) => {
    await page.goto('/retailer/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Profit Wallet').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/dashboard-profit-wallet.png' });
  });

  test('displays Today\'s Orders statistic', async ({ page }) => {
    await page.goto('/retailer/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Today').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/dashboard-todays-orders.png' });
  });

  test('full dashboard page screenshot', async ({ page }) => {
    await page.goto('/retailer/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/retailer-dashboard-full.png', fullPage: true });
  });
});

test.describe('Retailer POS', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRetailer(page);
  });

  test('displays transaction stats cards', async ({ page }) => {
    await page.goto('/retailer/pos');
    await page.waitForLoadState('networkidle');

    // Check for stats cards
    await expect(page.locator('text=Total Sales').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Mobile Payment').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Dashboard Wallet').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Credit Wallet').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Gas Rewards').first()).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: 'screenshots/pos-stats.png' });
  });

  test('shows product catalog', async ({ page }) => {
    await page.goto('/retailer/pos');
    await page.waitForLoadState('networkidle');

    // Products should be displayed
    await expect(page.locator('.ant-card').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/pos-products.png' });
  });

  test('can add product to cart and see tax calculation', async ({ page }) => {
    await page.goto('/retailer/pos');
    await page.waitForLoadState('networkidle');

    // Click on a product card to add to cart
    const productCard = page.locator('.ant-card-body').first();
    await productCard.click();

    // Wait for cart to update
    await page.waitForTimeout(500);

    // Check for tax display in cart
    await expect(page.locator('text=Tax').or(page.locator('text=VAT'))).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/pos-cart-with-tax.png' });
  });

  test('checkout shows Big Shop Card and Mobile Money payment options', async ({ page }) => {
    await page.goto('/retailer/pos');
    await page.waitForLoadState('networkidle');

    // Click product to add to cart
    const productCard = page.locator('.ant-card-body').first();
    await productCard.click();
    await page.waitForTimeout(500);

    // Click checkout button
    const checkoutBtn = page.locator('button:has-text("Checkout"), button:has-text("Pay")').first();
    if (await checkoutBtn.isVisible({ timeout: 3000 })) {
      await checkoutBtn.click();

      // Check for payment methods
      await expect(page.locator('text=Big Shop Card').or(page.locator('text=Card'))).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Mobile Money').or(page.locator('text=Mobile'))).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: 'screenshots/pos-payment-methods.png' });
    }
  });

  test('full POS page screenshot', async ({ page }) => {
    await page.goto('/retailer/pos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/retailer-pos-full.png', fullPage: true });
  });
});

test.describe('Retailer Add Stock', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRetailer(page);
  });

  test('displays assigned wholesaler info', async ({ page }) => {
    await page.goto('/retailer/add-stock');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Assigned Wholesaler').or(page.locator('text=YOUR ASSIGNED WHOLESALER'))).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=BIG Company').first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/add-stock-wholesaler.png' });
  });

  test('shows Capital Wallet payment only alert', async ({ page }) => {
    await page.goto('/retailer/add-stock');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Capital Wallet').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/add-stock-capital-wallet-only.png' });
  });

  test('displays wholesaler inventory products', async ({ page }) => {
    await page.goto('/retailer/add-stock');
    await page.waitForLoadState('networkidle');

    // Should have a table with products
    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/add-stock-inventory.png' });
  });

  test('full Add Stock page screenshot', async ({ page }) => {
    await page.goto('/retailer/add-stock');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/retailer-add-stock-full.png', fullPage: true });
  });
});

test.describe('Retailer Inventory', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRetailer(page);
  });

  test('displays inventory management info alert', async ({ page }) => {
    await page.goto('/retailer/inventory');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Inventory Management').or(page.locator('text=automatically updated'))).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/inventory-info-alert.png' });
  });

  test('Add Product modal shows invoice number input', async ({ page }) => {
    await page.goto('/retailer/inventory');
    await page.waitForLoadState('networkidle');

    // Click Add Product button
    const addBtn = page.locator('button:has-text("Add Product"), button:has-text("Add")').first();
    if (await addBtn.isVisible({ timeout: 5000 })) {
      await addBtn.click();

      // Modal should show invoice number input
      await expect(page.locator('text=Invoice Number').or(page.locator('text=Invoice'))).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: 'screenshots/inventory-add-invoice.png' });
    }
  });

  test('Actions column is not visible in inventory table', async ({ page }) => {
    await page.goto('/retailer/inventory');
    await page.waitForLoadState('networkidle');

    // The Actions column header should not be visible
    const actionsHeader = page.locator('th:has-text("Actions")');
    await expect(actionsHeader).toHaveCount(0);
    await page.screenshot({ path: 'screenshots/inventory-no-actions.png' });
  });

  test('full Inventory page screenshot', async ({ page }) => {
    await page.goto('/retailer/inventory');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/retailer-inventory-full.png', fullPage: true });
  });
});

test.describe('Retailer Orders', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRetailer(page);
  });

  test('displays revenue stats cards', async ({ page }) => {
    await page.goto('/retailer/orders');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Total Online Revenue').or(page.locator('text=Online Revenue'))).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Dashboard Wallet').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Credit Wallet').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Mobile Money').first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/orders-revenue-cards.png' });
  });

  test('displays order status counts', async ({ page }) => {
    await page.goto('/retailer/orders');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Pending').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Processing').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Ready').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Completed').first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/orders-status-counts.png' });
  });

  test('has payment method filter', async ({ page }) => {
    await page.goto('/retailer/orders');
    await page.waitForLoadState('networkidle');

    // Look for filter/select elements
    const filterSelect = page.locator('.ant-select, select').first();
    await expect(filterSelect).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/orders-filters.png' });
  });

  test('full Orders page screenshot', async ({ page }) => {
    await page.goto('/retailer/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/retailer-orders-full.png', fullPage: true });
  });
});

test.describe('Retailer Wallet', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRetailer(page);
  });

  test('Capital Wallet tab has Add Capital button', async ({ page }) => {
    await page.goto('/retailer/wallet');
    await page.waitForLoadState('networkidle');

    // Should be on Capital Wallet tab by default or click it
    const capitalTab = page.locator('text=Capital Wallet').first();
    await capitalTab.click();

    await expect(page.locator('button:has-text("Add Capital")')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/wallet-add-capital.png' });
  });

  test('Profit Wallet tab shows admin managed notice', async ({ page }) => {
    await page.goto('/retailer/wallet');
    await page.waitForLoadState('networkidle');

    // Click Profit Wallet tab
    const profitTab = page.locator('text=Profit Wallet');
    await profitTab.click();

    // Should show info about admin-managed transfers
    await expect(page.locator('text=Admin Managed').or(page.locator('text=Net Profit Transferred Monthly'))).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/wallet-profit-readonly.png' });
  });

  test('Credit tab exists and shows credit info', async ({ page }) => {
    await page.goto('/retailer/wallet');
    await page.waitForLoadState('networkidle');

    // Click Credit tab
    const creditTab = page.locator('.ant-tabs-tab:has-text("Credit")').first();
    await creditTab.click();

    // Should show credit information
    await expect(page.locator('text=Credit Limit').or(page.locator('text=Available Credit'))).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/wallet-credit-tab.png' });
  });

  test('full Wallet page screenshot', async ({ page }) => {
    await page.goto('/retailer/wallet');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/retailer-wallet-full.png', fullPage: true });
  });
});

test.describe('Retailer Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRetailer(page);
  });

  test('shows Customer Balance Check tab', async ({ page }) => {
    await page.goto('/retailer/management');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Balance Check').or(page.locator('text=Customer Balance'))).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/management-balance-check.png' });
  });

  test('Balance Check has card PIN and wallet PIN inputs', async ({ page }) => {
    await page.goto('/retailer/management');
    await page.waitForLoadState('networkidle');

    // Click on Balance Check tab if needed
    const balanceTab = page.locator('text=Balance Check').first();
    await balanceTab.click();

    // Should have card PIN and wallet PIN inputs
    await expect(page.locator('text=Card PIN').or(page.locator('input[placeholder*="card"]'))).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Wallet PIN').or(page.locator('input[placeholder*="wallet"]'))).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'screenshots/management-balance-form.png' });
  });

  test('shows Card Transactions tab', async ({ page }) => {
    await page.goto('/retailer/management');
    await page.waitForLoadState('networkidle');

    const cardTransTab = page.locator('text=Card Transactions').first();
    await cardTransTab.click();

    // Should show card transactions table
    await expect(page.locator('.ant-table').or(page.locator('text=Dashboard Wallet').or(page.locator('text=Credit Wallet')))).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/management-card-transactions.png' });
  });

  test('shows Gas Rewards tab with meter ID info', async ({ page }) => {
    await page.goto('/retailer/management');
    await page.waitForLoadState('networkidle');

    const gasRewardsTab = page.locator('text=Gas Rewards').first();
    await gasRewardsTab.click();

    // Should show gas rewards info
    await expect(page.locator('text=Meter ID').or(page.locator('text=Gas Reward'))).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/management-gas-rewards.png' });
  });

  test('shows Profit Invoices tab', async ({ page }) => {
    await page.goto('/retailer/management');
    await page.waitForLoadState('networkidle');

    const invoicesTab = page.locator('text=Profit Invoices').or(page.locator('text=Invoices')).first();
    await invoicesTab.click();

    // Should show profit invoices
    await expect(page.locator('text=Invoice').or(page.locator('text=Net Profit'))).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/management-profit-invoices.png' });
  });

  test('full Management page screenshot', async ({ page }) => {
    await page.goto('/retailer/management');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'screenshots/retailer-management-full.png', fullPage: true });
  });
});

test.describe('Full Page Screenshots - All Retailer Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRetailer(page);
  });

  const pages = [
    { path: '/retailer/dashboard', name: 'dashboard' },
    { path: '/retailer/pos', name: 'pos' },
    { path: '/retailer/add-stock', name: 'add-stock' },
    { path: '/retailer/inventory', name: 'inventory' },
    { path: '/retailer/orders', name: 'orders' },
    { path: '/retailer/wallet', name: 'wallet' },
    { path: '/retailer/management', name: 'management' },
  ];

  for (const p of pages) {
    test(`capture ${p.name} page full screenshot`, async ({ page }) => {
      await page.goto(p.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for animations
      await page.screenshot({
        path: `screenshots/retailer-${p.name}-fullpage.png`,
        fullPage: true
      });
    });
  }
});

test.describe('Mobile Responsive - Retailer Portal', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await loginAsRetailer(page);
  });

  test('dashboard is mobile responsive', async ({ page }) => {
    await page.goto('/retailer/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should load on mobile
    await expect(page.locator('text=Dashboard').or(page.locator('text=Capital Wallet'))).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/mobile-retailer-dashboard.png', fullPage: true });
  });

  test('POS is mobile responsive', async ({ page }) => {
    await page.goto('/retailer/pos');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=POS').or(page.locator('text=Total Sales'))).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/mobile-retailer-pos.png', fullPage: true });
  });

  test('wallet is mobile responsive', async ({ page }) => {
    await page.goto('/retailer/wallet');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Wallet').or(page.locator('text=Capital Wallet'))).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/mobile-retailer-wallet.png', fullPage: true });
  });
});
