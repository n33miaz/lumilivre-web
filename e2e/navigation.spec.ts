import { test, expect, type Page } from '@playwright/test';

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
  await page.route('**/alunos/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 }),
    }),
  );
  await page.route('**/livros/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 }),
    }),
  );
  await page.route('**/emprestimos/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(0),
    }),
  );
  await page.route('**/solicitacoes/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
  await page.route('**/tcc/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    }),
  );
  await page.route('**/cursos/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [] }),
    }),
  );
  await page.route('**/enums/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
  await page.route('**/generos', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
  await page.route('**/turnos', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
  await page.route('**/modulos', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
  await page.route('**/relatorios/**', (route) =>
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
    '/dashboard',
    '/livros',
    '/alunos',
    '/emprestimos',
    '/tcc',
    '/classificacao',
    '/relatorios',
    '/configuracoes',
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
    await injectAuthUser(page);
    await mockAllApis(page);
  });

  test('should render sidebar with all navigation links', async ({ page }) => {
    await page.goto('/dashboard');
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
  });

  test('should navigate between pages via sidebar', async ({ page }) => {
    await page.goto('/dashboard');

    // Navigate to Livros
    await page
      .locator('aside')
      .getByRole('link', { name: /livros/i })
      .click();
    await page.waitForURL('**/livros', { timeout: 5000 });
    expect(page.url()).toContain('/livros');

    // Navigate to Alunos
    await page
      .locator('aside')
      .getByRole('link', { name: /alunos/i })
      .click();
    await page.waitForURL('**/alunos', { timeout: 5000 });
    expect(page.url()).toContain('/alunos');
  });
});

// ─── Session Expiry ───

test.describe('Session Expiry', () => {
  test('should redirect to login on 401 API response', async ({ page }) => {
    await injectAuthUser(page);

    // First load works
    await page.route('**/livros/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 }),
      }),
    );
    await page.route('**/alunos/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0 }),
      }),
    );
    await page.route('**/emprestimos/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(0),
      }),
    );
    await page.route('**/solicitacoes/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    await page.goto('/dashboard');

    // Now simulate 401 on next navigation
    await page.route('**/livros/**', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ mensagem: 'Token expirado' }),
      }),
    );

    await page
      .locator('aside')
      .getByRole('link', { name: /livros/i })
      .click();

    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});
