import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function injectAuthUser(page: Page) {
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

async function mockProtectedApis(page: Page) {
  await page.route('**/api/dashboard/stats', (route) =>
    route.fulfill({
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
  await page.route('**/api/dashboard/top-books', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
  await page.route('**/api/dashboard/loans-by-month', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
  await page.route('**/api/students**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 }),
    }),
  );
  await page.route('**/api/books**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 }),
    }),
  );
  await page.route('**/api/loans**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(0),
    }),
  );
  await page.route('**/api/loan-requests**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
  await page.route('**/api/courses**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [] }),
    }),
  );
  await page.route('**/api/study-shifts', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
  await page.route('**/api/academic-modules', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
  await page.route('**/api/metadata/enums/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
}

async function expectNoCriticalA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const criticalViolations = results.violations.filter(
    (violation) => violation.impact === 'critical',
  );

  expect(criticalViolations).toEqual([]);
}

test.describe('Acessibilidade critica', () => {
  test('Landing publica nao deve ter violacoes criticas', async ({ page }) => {
    await page.goto('/');

    await expectNoCriticalA11yViolations(page);
  });

  test('Login nao deve ter violacoes criticas', async ({ page }) => {
    await page.goto('/login');

    await expectNoCriticalA11yViolations(page);
  });

  const protectedPages = [
    '/admin/dashboard',
    '/admin/books',
    '/admin/students',
    '/admin/loans',
  ] as const;

  for (const path of protectedPages) {
    test(`${path} nao deve ter violacoes criticas`, async ({ page }) => {
      await injectAuthUser(page);
      await mockProtectedApis(page);

      await page.goto(path);
      await expect(page.locator('aside')).toBeVisible({ timeout: 5000 });

      await expectNoCriticalA11yViolations(page);
    });
  }
});
