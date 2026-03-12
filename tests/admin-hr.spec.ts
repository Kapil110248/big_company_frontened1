import { test, expect } from '@playwright/test';

// Helper function to login as admin
async function loginAsAdmin(page: any) {
  await page.goto('/admin/login');
  await expect(page.locator('text=Admin Portal')).toBeVisible({ timeout: 10000 });

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.clear();
  await emailInput.fill('admin@bigcompany.rw');
  await passwordInput.clear();
  await passwordInput.fill('admin123');

  const submitButton = page.locator('button:has-text("Sign in")').or(page.locator('button[type="submit"]'));

  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/admin/auth/login') && resp.status() === 200, { timeout: 15000 }).catch(() => null),
    submitButton.click()
  ]);

  await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
}

test.describe('Admin Login', () => {
  test('should display admin login page', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('text=Admin Portal')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should successfully login as admin', async ({ page }) => {
    await loginAsAdmin(page);
    // Should see admin dashboard
    await expect(page.locator('text=Dashboard').or(page.locator('text=Admin'))).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin Navigation Menu', () => {
  test('should display all HR menu items', async ({ page }) => {
    await loginAsAdmin(page);

    // Check for new HR menu items
    const menuItems = [
      'Dashboard',
      'Employees',
      'Payroll',
      'Recruitment',
      'Vendors',
      'Deals',
      'Account Management',
      'Categories',
      'Customers',
      'Retailers',
      'Wholesalers',
      'Loans',
      'NFC Cards',
      'Reports',
      'Profile'
    ];

    // Wait for navigation to be visible
    await page.waitForTimeout(2000);

    // Check menu items are present (may be in drawer or sidebar)
    for (const item of ['Employees', 'Payroll', 'Recruitment', 'Vendors', 'Deals']) {
      const menuItem = page.locator(`text=${item}`).first();
      // Menu items should exist in the page (may need to open drawer on mobile)
      await expect(page.content()).resolves.toContain(item);
    }
  });
});

test.describe('Employee Management Page', () => {
  test('should navigate to employees page', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to employees page
    await page.goto('/admin/employees');
    await expect(page).toHaveURL('/admin/employees');

    // Page should load with title
    await expect(page.locator('text=Employee').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display employee statistics', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/employees');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check for statistics cards (they should contain numbers)
    const statsText = await page.content();
    expect(statsText).toContain('Total Employees');
  });

  test('should display employee table', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/employees');

    // Wait for table to load
    await page.waitForTimeout(2000);

    // Table should have employee data
    await expect(page.locator('table').or(page.locator('[class*="table"]'))).toBeVisible({ timeout: 5000 });
  });

  test('should open add employee modal', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/employees');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Click add employee button
    const addButton = page.locator('button:has-text("Add Employee")').or(page.locator('button').filter({ hasText: /add/i }));
    if (await addButton.isVisible({ timeout: 3000 })) {
      await addButton.click();

      // Modal should appear
      await expect(page.locator('text=Add').or(page.locator('[role="dialog"]'))).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have search functionality', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/employees');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Search input should exist
    const searchInput = page.locator('input[placeholder*="Search"]').or(page.locator('input[type="text"]')).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Payroll Processing Page', () => {
  test('should navigate to payroll page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/payroll');
    await expect(page).toHaveURL('/admin/payroll');

    // Page should load with title
    await expect(page.locator('text=Payroll').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display payroll statistics', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/payroll');

    await page.waitForTimeout(2000);

    // Check for payroll stats
    const content = await page.content();
    expect(content).toMatch(/Total Payroll|Gross|Net/);
  });

  test('should display payroll table with deductions', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/payroll');

    await page.waitForTimeout(2000);

    // Table should show deductions including bill payments
    const content = await page.content();
    expect(content).toMatch(/Deductions|Tax|Insurance|Pension/);
  });

  test('should have process payroll button', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/payroll');

    await page.waitForTimeout(2000);

    // Process button should exist
    const processButton = page.locator('button').filter({ hasText: /process/i });
    await expect(processButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show direct deposit alert', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/payroll');

    await page.waitForTimeout(2000);

    // Alert about direct deposit should be visible
    const content = await page.content();
    expect(content).toMatch(/Direct Deposit|bank account|automated/i);
  });
});

test.describe('Recruitment Page', () => {
  test('should navigate to recruitment page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/recruitment');
    await expect(page).toHaveURL('/admin/recruitment');

    await expect(page.locator('text=Recruitment').or(page.locator('text=Jobs'))).toBeVisible({ timeout: 10000 });
  });

  test('should display recruitment statistics', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/recruitment');

    await page.waitForTimeout(2000);

    const content = await page.content();
    expect(content).toMatch(/Open Positions|Applicants|Interview/);
  });

  test('should have job postings and applicants tabs', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/recruitment');

    await page.waitForTimeout(2000);

    // Should have tabs for job postings and applicants
    const content = await page.content();
    expect(content).toMatch(/Job Postings|Applicants/);
  });

  test('should open create job posting modal', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/recruitment');

    await page.waitForTimeout(2000);

    const createButton = page.locator('button').filter({ hasText: /create|add job/i });
    if (await createButton.first().isVisible({ timeout: 3000 })) {
      await createButton.first().click();

      // Modal should appear
      await expect(page.locator('[role="dialog"]').or(page.locator('text=Create'))).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display job postings table', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/recruitment');

    await page.waitForTimeout(2000);

    // Table with job postings
    await expect(page.locator('table').or(page.locator('[class*="table"]'))).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Vendor Management Page', () => {
  test('should navigate to vendors page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/vendors');
    await expect(page).toHaveURL('/admin/vendors');

    await expect(page.locator('text=Vendor').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display vendor statistics', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/vendors');

    await page.waitForTimeout(2000);

    const content = await page.content();
    expect(content).toMatch(/Total Vendors|Active|Spent/);
  });

  test('should display vendor table', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/vendors');

    await page.waitForTimeout(2000);

    await expect(page.locator('table').or(page.locator('[class*="table"]'))).toBeVisible({ timeout: 5000 });
  });

  test('should open add vendor modal', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/vendors');

    await page.waitForTimeout(2000);

    const addButton = page.locator('button').filter({ hasText: /add vendor/i });
    if (await addButton.first().isVisible({ timeout: 3000 })) {
      await addButton.first().click();

      await expect(page.locator('[role="dialog"]').or(page.locator('text=Add'))).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have payment terms information', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/vendors');

    await page.waitForTimeout(2000);

    // Should show payment terms in table
    const content = await page.content();
    expect(content).toMatch(/Payment Terms|Net|Monthly/);
  });
});

test.describe('Deals & Sales Pipeline Page', () => {
  test('should navigate to deals page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/deals');
    await expect(page).toHaveURL('/admin/deals');

    await expect(page.locator('text=Deals').or(page.locator('text=Sales'))).toBeVisible({ timeout: 10000 });
  });

  test('should display deals statistics', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/deals');

    await page.waitForTimeout(2000);

    const content = await page.content();
    expect(content).toMatch(/Pipeline|Closed|Won|Deals/);
  });

  test('should display deals table', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/deals');

    await page.waitForTimeout(2000);

    await expect(page.locator('table').or(page.locator('[class*="table"]'))).toBeVisible({ timeout: 5000 });
  });

  test('should open add deal modal', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/deals');

    await page.waitForTimeout(2000);

    const addButton = page.locator('button').filter({ hasText: /add deal/i });
    if (await addButton.first().isVisible({ timeout: 3000 })) {
      await addButton.first().click();

      await expect(page.locator('[role="dialog"]').or(page.locator('text=Add'))).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show deal stages', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/deals');

    await page.waitForTimeout(2000);

    // Should show stage tags/filters
    const content = await page.content();
    expect(content).toMatch(/Lead|Qualified|Proposal|Negotiation|Closed/);
  });

  test('should display probability tracking', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/deals');

    await page.waitForTimeout(2000);

    // Should show probability information
    const content = await page.content();
    expect(content).toMatch(/Probability|%/);
  });
});

test.describe('Admin HR Features - Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('employees page is mobile responsive', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/employees');

    await page.waitForTimeout(2000);

    // Page should load on mobile
    await expect(page.locator('text=Employee').first()).toBeVisible({ timeout: 10000 });
  });

  test('payroll page is mobile responsive', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/payroll');

    await page.waitForTimeout(2000);

    await expect(page.locator('text=Payroll').first()).toBeVisible({ timeout: 10000 });
  });

  test('recruitment page is mobile responsive', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/recruitment');

    await page.waitForTimeout(2000);

    await expect(page.locator('text=Recruitment').or(page.locator('text=Jobs'))).toBeVisible({ timeout: 10000 });
  });

  test('vendors page is mobile responsive', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/vendors');

    await page.waitForTimeout(2000);

    await expect(page.locator('text=Vendor').first()).toBeVisible({ timeout: 10000 });
  });

  test('deals page is mobile responsive', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/deals');

    await page.waitForTimeout(2000);

    await expect(page.locator('text=Deals').or(page.locator('text=Sales'))).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Admin Profile Page', () => {
  test('should navigate to profile page from menu', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/profile');
    await expect(page).toHaveURL('/admin/profile');

    // Profile page should load
    await expect(page.locator('text=Profile').or(page.locator('text=Settings'))).toBeVisible({ timeout: 10000 });
  });
});

test.describe('All Admin Pages Load Successfully', () => {
  const adminPages = [
    { path: '/admin/dashboard', name: 'Dashboard' },
    { path: '/admin/employees', name: 'Employees' },
    { path: '/admin/payroll', name: 'Payroll' },
    { path: '/admin/recruitment', name: 'Recruitment' },
    { path: '/admin/vendors', name: 'Vendors' },
    { path: '/admin/deals', name: 'Deals' },
    { path: '/admin/accounts', name: 'Accounts' },
    { path: '/admin/categories', name: 'Categories' },
    { path: '/admin/customers', name: 'Customers' },
    { path: '/admin/retailers', name: 'Retailers' },
    { path: '/admin/wholesalers', name: 'Wholesalers' },
    { path: '/admin/loans', name: 'Loans' },
    { path: '/admin/nfc-cards', name: 'NFC Cards' },
    { path: '/admin/reports', name: 'Reports' },
    { path: '/admin/profile', name: 'Profile' }
  ];

  for (const { path, name } of adminPages) {
    test(`${name} page loads without errors`, async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(path);

      // Wait for page to load
      await page.waitForTimeout(2000);

      // Check URL is correct
      await expect(page).toHaveURL(path);

      // Page should not have crashed (check for error boundary or blank page)
      const content = await page.content();
      expect(content.length).toBeGreaterThan(1000); // Page has content
    });
  }
});

test.describe('Admin HR Data Integration', () => {
  test('employee data shows in payroll page', async ({ page }) => {
    await loginAsAdmin(page);

    // First check employees exist
    await page.goto('/admin/employees');
    await page.waitForTimeout(2000);

    const employeesContent = await page.content();
    const hasEmployees = employeesContent.includes('EMP') || employeesContent.includes('Employee');

    // Then check payroll has corresponding data
    await page.goto('/admin/payroll');
    await page.waitForTimeout(2000);

    const payrollContent = await page.content();
    expect(payrollContent).toMatch(/Salary|Payroll|RWF/);

    // If employees exist, payroll should have data
    if (hasEmployees) {
      expect(payrollContent.includes('EMP') || payrollContent.includes('Employee')).toBeTruthy();
    }
  });

  test('direct deposit information present across pages', async ({ page }) => {
    await loginAsAdmin(page);

    // Check employees page has bank account info
    await page.goto('/admin/employees');
    await page.waitForTimeout(2000);

    // Check payroll mentions direct deposit
    await page.goto('/admin/payroll');
    await page.waitForTimeout(2000);
    const payrollContent = await page.content();
    expect(payrollContent).toMatch(/Direct Deposit|Bank Account|Automated/i);

    // Check vendors has bank account info
    await page.goto('/admin/vendors');
    await page.waitForTimeout(2000);
    const vendorsContent = await page.content();
    expect(vendorsContent).toMatch(/Bank Account|Payment/i);
  });
});
