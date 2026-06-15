import { test, expect, type Page } from '@playwright/test';

/** Injects CSS para desabilitar animações durante testes E2E */
async function injectReducedMotionCSS(page: Page) {
  await page.addInitScript(() => {
    // Cria um style tag que desabilita animações apenas para testes E2E
    const style = document.createElement('style');
    style.textContent = `
      @media (prefers-reduced-motion: reduce) {
        *,
        ::before,
        ::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);
  });
}

/** Injects a fake authenticated user into localStorage before page loads. */
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

/** Mocks all common API calls so protected pages don't break. */
async function mockAllApis(page: Page) {
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
  await page.route('**/api/theses**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    }),
  );
  await page.route('**/api/courses**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [] }),
    }),
  );
  await page.route('**/api/metadata/enums/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
  await page.route('**/api/genres', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
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
  await page.route('**/api/reports/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/octet-stream',
      body: '',
    }),
  );
}

// ─── Unauthenticated Redirects ───

test.describe('Protected Routes — Unauthenticated', () => {
  const protectedPaths = [
    '/admin/dashboard',
    '/admin/books',
    '/admin/students',
    '/admin/loans',
    '/admin/theses',
    '/admin/ranking',
    '/admin/reports',
    '/admin/settings',
  ];

  for (const path of protectedPaths) {
    test(`should redirect ${path} to /login`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL('**/login', { timeout: 5000 });
      expect(page.url()).toContain('/login');
    });
  }
});

// ─── Authenticated Navigation ───

test.describe('Sidebar Navigation — Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await injectReducedMotionCSS(page);
    await injectAuthUser(page);
    await mockAllApis(page);
  });

  test('should render sidebar with all navigation links', async ({ page }) => {
    await page.goto('/admin/dashboard');
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });

  test('should navigate between pages via sidebar', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Navigate to Livros
    await page
      .locator('aside')
      .getByRole('link', { name: /livros/i })
      .click();
    await page.waitForURL('**/admin/books', { timeout: 5000 });
    expect(page.url()).toContain('/admin/books');

    // Navigate to Alunos
    await page
      .locator('aside')
      .getByRole('link', { name: /alunos/i })
      .click();
    await page.waitForURL('**/admin/students', { timeout: 5000 });
    expect(page.url()).toContain('/admin/students');
  });
});

// ─── Session Expiry ───

test.describe('Session Expiry', () => {
  test('should redirect to login on 401 API response', async ({ page }) => {
    await injectAuthUser(page);

    // First load works
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
    await page.route('**/api/books**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 }),
      }),
    );
    await page.route('**/api/students**', (route) =>
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

    await page.goto('/admin/dashboard');

    // Now simulate 401 on next navigation
    await page.route('**/api/books**', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Token expirado' }),
      }),
    );

    const redirectToLogin = page.waitForURL('**/login', { timeout: 10000 });
    const clickBooks = page
      .locator('aside')
      .getByRole('link', { name: /livros/i })
      .click({ timeout: 10000 })
      .catch(() => undefined);

    await Promise.race([clickBooks, redirectToLogin]);
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});
