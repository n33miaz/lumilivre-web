import { test, expect, type Page } from '@playwright/test';

async function injectAuthenticatedUser(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 1,
        email: 'admin@test.com',
        role: 'ADMIN',
        token: 'fake-jwt-token',
        isInitialPassword: false,
      }),
    );
  });
}

async function mockAllApiCalls(page: Page) {
  await page.route('**/api/dashboard/stats', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        activeLoans: 0,
        overdueLoans: 0,
        completedLoans: 0,
        avgReturnDays: 0,
        pendingRequests: 0,
        waitingReservations: 0,
      }),
    }),
  );
  await page.route('**/api/dashboard/top-books', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
  await page.route('**/api/dashboard/loans-by-month', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
  await page.route('**/api/students**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 }),
    }),
  );
  await page.route('**/api/books**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 }),
    }),
  );
  await page.route('**/api/loans**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(0),
    }),
  );
  await page.route('**/api/loan-requests**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
}

test.describe('Theme Toggle', () => {
  test('should toggle dark/light theme on login page', async ({ page }) => {
    await page.goto('/login');

    const html = page.locator('html');

    // Padrão: light
    await expect(html).toHaveClass(/light/);

    // Localiza o toggle de tema pelo aria-label
    const themeToggle = page.getByRole('button', { name: 'Alternar tema' });
    await expect(themeToggle).toBeVisible();

    await themeToggle.click();

    // Após click, deve mudar para dark
    await expect(html).toHaveClass(/dark/, { timeout: 3000 });

    // Volta para light
    await themeToggle.click();
    await expect(html).toHaveClass(/light/, { timeout: 3000 });
  });

  test('should persist theme choice in localStorage', async ({ page }) => {
    await page.goto('/login');

    const storedTheme = await page.evaluate(() =>
      localStorage.getItem('theme'),
    );
    expect(storedTheme).toBeTruthy();
  });
});

test.describe('Responsive Layout', () => {
  test('should hide sidebar on mobile viewport', async ({ page }) => {
    await injectAuthenticatedUser(page);
    await mockAllApiCalls(page);

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/dashboard');

    const sidebar = page.locator('aside');
    // Em mobile a sidebar deve estar translateX(-100%) — fora da tela
    await expect(sidebar).toHaveClass(/-translate-x-full/);
  });

  test('should show sidebar on desktop viewport', async ({ page }) => {
    await injectAuthenticatedUser(page);
    await mockAllApiCalls(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin/dashboard');

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });
});
