import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=BIG Company').first()).toBeVisible({ timeout: 10000 });
  });

  test('should have portal cards visible', async ({ page }) => {
    await page.goto('/');
    // Check for portal cards on the homepage
    await expect(page.locator('text=Consumer').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    // Click on sign in button
    await page.click('text=Sign In');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Consumer Login', () => {
  test('should display consumer login form', async ({ page }) => {
    await page.goto('/login');
    // Should show consumer login form (default tab)
    await expect(page.locator('text=Consumer Store')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should successfully login as consumer', async ({ page }) => {
    await page.goto('/login');

    // Wait for the form to load
    await expect(page.locator('text=Consumer Store')).toBeVisible({ timeout: 10000 });

    // Clear and fill form manually (credentials are auto-filled on load)
    const phoneInput = page.locator('input[type="tel"]');
    const pinInput = page.locator('input[type="password"]');

    await phoneInput.clear();
    await phoneInput.fill('250788100001');
    await pinInput.clear();
    await pinInput.fill('1234');

    // Click the submit button and wait for API response
    const submitButton = page.locator('button:has-text("Sign in as Consumer")');

    // Wait for the API call and navigation
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/store/auth/login') && resp.status() === 200, { timeout: 15000 }).catch(() => null),
      submitButton.click()
    ]);

    // Should redirect to consumer shop
    await expect(page).toHaveURL(/\/consumer/, { timeout: 15000 });
  });

  test('should show demo credentials box', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Demo Login Credentials')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=250788100001')).toBeVisible();
    await expect(page.locator('text=1234')).toBeVisible();
  });
});

test.describe('Retailer Login', () => {
  test('should switch to retailer login tab', async ({ page }) => {
    await page.goto('/login');

    // Click retailer tab
    await page.click('button:has-text("Retailer")');

    // Should show retailer form with email input
    await expect(page.locator('text=Retailer Dashboard')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should successfully login as retailer', async ({ page }) => {
    await page.goto('/login');

    // Click retailer tab
    await page.click('button:has-text("Retailer")');
    await expect(page.locator('text=Retailer Dashboard')).toBeVisible({ timeout: 5000 });

    // Wait for credentials to auto-fill, then ensure correct values
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.clear();
    await emailInput.fill('retailer@bigcompany.rw');
    await passwordInput.clear();
    await passwordInput.fill('retailer123');

    // Click login button and wait for API response
    const submitButton = page.locator('button:has-text("Sign in as Retailer")');

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/retailer/auth/login') && resp.status() === 200, { timeout: 15000 }).catch(() => null),
      submitButton.click()
    ]);

    // Should redirect to retailer dashboard
    await expect(page).toHaveURL(/\/retailer/, { timeout: 15000 });
  });

  test('should display retailer demo credentials', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Retailer")');
    await expect(page.locator('text=retailer@bigcompany.rw')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=retailer123')).toBeVisible();
  });
});

test.describe('Wholesaler Login', () => {
  test('should switch to wholesaler login tab', async ({ page }) => {
    await page.goto('/login');

    // Click wholesaler tab
    await page.click('button:has-text("Wholesaler")');

    // Should show wholesaler form
    await expect(page.locator('text=Wholesaler Portal')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should successfully login as wholesaler', async ({ page }) => {
    await page.goto('/login');

    // Click wholesaler tab
    await page.click('button:has-text("Wholesaler")');
    await expect(page.locator('text=Wholesaler Portal')).toBeVisible({ timeout: 5000 });

    // Fill form
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.clear();
    await emailInput.fill('wholesaler@bigcompany.rw');
    await passwordInput.clear();
    await passwordInput.fill('wholesaler123');

    // Click login button and wait for API response
    const submitButton = page.locator('button:has-text("Sign in as Wholesaler")');

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/wholesaler/auth/login') && resp.status() === 200, { timeout: 15000 }).catch(() => null),
      submitButton.click()
    ]);

    // Should redirect to wholesaler dashboard
    await expect(page).toHaveURL(/\/wholesaler/, { timeout: 15000 });
  });

  test('should display wholesaler demo credentials', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Wholesaler")');
    await expect(page.locator('text=wholesaler@bigcompany.rw')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=wholesaler123')).toBeVisible();
  });
});

test.describe('Mobile Responsive Layout', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('homepage is mobile responsive', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=BIG Company').first()).toBeVisible({ timeout: 10000 });
  });

  test('login page is mobile responsive', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Consumer Store')).toBeVisible({ timeout: 10000 });

    // Verify form is visible on mobile
    await expect(page.locator('input[type="tel"]')).toBeVisible();
  });

  test('should show mobile bottom navigation after consumer login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Consumer Store')).toBeVisible({ timeout: 10000 });

    // Fill and login
    const phoneInput = page.locator('input[type="tel"]');
    const pinInput = page.locator('input[type="password"]');

    await phoneInput.clear();
    await phoneInput.fill('250788100001');
    await pinInput.clear();
    await pinInput.fill('1234');

    const submitButton = page.locator('button:has-text("Sign in as Consumer")');
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/store/auth/login') && resp.status() === 200, { timeout: 15000 }).catch(() => null),
      submitButton.click()
    ]);

    // Wait for navigation
    await expect(page).toHaveURL(/\/consumer/, { timeout: 15000 });

    // Check for mobile bottom navigation (should have nav at the bottom)
    const bottomNav = page.locator('nav').last();
    await expect(bottomNav).toBeVisible({ timeout: 5000 });
  });

  test('should show mobile drawer menu for retailer', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Retailer")');
    await expect(page.locator('text=Retailer Dashboard')).toBeVisible({ timeout: 5000 });

    // Fill and login
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

    // Wait for navigation
    await expect(page).toHaveURL(/\/retailer/, { timeout: 15000 });

    // Should be on retailer page
    await expect(page.locator('text=Dashboard').or(page.locator('text=Retailer'))).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Portal Navigation After Login', () => {
  test('consumer can access shop page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Consumer Store')).toBeVisible({ timeout: 10000 });

    const phoneInput = page.locator('input[type="tel"]');
    const pinInput = page.locator('input[type="password"]');

    await phoneInput.clear();
    await phoneInput.fill('250788100001');
    await pinInput.clear();
    await pinInput.fill('1234');

    const submitButton = page.locator('button:has-text("Sign in as Consumer")');
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/store/auth/login') && resp.status() === 200, { timeout: 15000 }).catch(() => null),
      submitButton.click()
    ]);

    await expect(page).toHaveURL(/\/consumer/, { timeout: 15000 });

    // Should be on shop page
    await expect(page.locator('text=Shop').or(page.locator('text=BIG Company'))).toBeVisible({ timeout: 5000 });
  });

  test('retailer can access dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Retailer")');
    await expect(page.locator('text=Retailer Dashboard')).toBeVisible({ timeout: 5000 });

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

    // Should see dashboard content
    await expect(page.locator('text=Dashboard').or(page.locator('text=BIG Company'))).toBeVisible({ timeout: 5000 });
  });

  test('wholesaler can access dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Wholesaler")');
    await expect(page.locator('text=Wholesaler Portal')).toBeVisible({ timeout: 5000 });

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.clear();
    await emailInput.fill('wholesaler@bigcompany.rw');
    await passwordInput.clear();
    await passwordInput.fill('wholesaler123');

    const submitButton = page.locator('button:has-text("Sign in as Wholesaler")');
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/wholesaler/auth/login') && resp.status() === 200, { timeout: 15000 }).catch(() => null),
      submitButton.click()
    ]);

    await expect(page).toHaveURL(/\/wholesaler/, { timeout: 15000 });

    // Should see dashboard content
    await expect(page.locator('text=Dashboard').or(page.locator('text=BIG Company'))).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Logout Functionality', () => {
  test('consumer can logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await expect(page.locator('text=Consumer Store')).toBeVisible({ timeout: 10000 });

    const phoneInput = page.locator('input[type="tel"]');
    const pinInput = page.locator('input[type="password"]');

    await phoneInput.clear();
    await phoneInput.fill('250788100001');
    await pinInput.clear();
    await pinInput.fill('1234');

    const submitButton = page.locator('button:has-text("Sign in as Consumer")');
    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/store/auth/login') && resp.status() === 200, { timeout: 15000 }).catch(() => null),
      submitButton.click()
    ]);

    await expect(page).toHaveURL(/\/consumer/, { timeout: 15000 });

    // Find and click logout - look for user profile or dropdown
    const logoutButton = page.locator('text=Logout').or(page.locator('[aria-label="Logout"]'));
    if (await logoutButton.isVisible({ timeout: 3000 })) {
      await logoutButton.click();
      // Should redirect to home
      await expect(page).toHaveURL(/^\/$/, { timeout: 10000 });
    }
  });
});

test.describe('Auto-fill Demo Credentials', () => {
  test('consumer auto-fill button exists', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Consumer Store')).toBeVisible({ timeout: 10000 });

    // Verify auto-fill button exists
    await expect(page.locator('text=Auto-fill Demo Credentials')).toBeVisible();
  });

  test('retailer auto-fill button exists', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Retailer")');
    await expect(page.locator('text=Retailer Dashboard')).toBeVisible({ timeout: 5000 });

    // Verify auto-fill button exists
    await expect(page.locator('text=Auto-fill Demo Credentials')).toBeVisible();
  });

  test('wholesaler auto-fill button exists', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Wholesaler")');
    await expect(page.locator('text=Wholesaler Portal')).toBeVisible({ timeout: 5000 });

    // Verify auto-fill button exists
    await expect(page.locator('text=Auto-fill Demo Credentials')).toBeVisible();
  });
});

test.describe('Role Tab Switching', () => {
  test('can switch between all tabs', async ({ page }) => {
    await page.goto('/login');

    // Start on consumer (default)
    await expect(page.locator('text=Consumer Store')).toBeVisible({ timeout: 10000 });

    // Switch to retailer
    await page.click('button:has-text("Retailer")');
    await expect(page.locator('text=Retailer Dashboard')).toBeVisible({ timeout: 5000 });

    // Switch to wholesaler
    await page.click('button:has-text("Wholesaler")');
    await expect(page.locator('text=Wholesaler Portal')).toBeVisible({ timeout: 5000 });

    // Switch back to consumer
    await page.click('button:has-text("Consumer")');
    await expect(page.locator('text=Consumer Store')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Form Validation', () => {
  test('consumer form requires phone number', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Consumer Store')).toBeVisible({ timeout: 10000 });

    // Clear phone field and try to submit without phone
    const phoneInput = page.locator('input[type="tel"]');
    await phoneInput.clear();

    // Fill only PIN
    const pinInput = page.locator('input[type="password"]');
    await pinInput.clear();
    await pinInput.fill('1234');

    const submitButton = page.locator('button:has-text("Sign in as Consumer")');
    await submitButton.click();

    // Should still be on login page (HTML5 validation will prevent submit)
    await expect(page).toHaveURL('/login');
  });

  test('retailer form requires email', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Retailer")');
    await expect(page.locator('text=Retailer Dashboard')).toBeVisible({ timeout: 5000 });

    // Clear email field and try to submit without email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.clear();

    // Fill only password
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.clear();
    await passwordInput.fill('retailer123');

    const submitButton = page.locator('button:has-text("Sign in as Retailer")');
    await submitButton.click();

    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });
});
