import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should render login form with all elements', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText('LumiLivre')).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Senha/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /ENTRAR/i })).toBeVisible();
    await expect(page.getByText('Esqueceu sua senha?')).toBeVisible();
  });

  test('should show error toast on invalid credentials', async ({ page }) => {
    await page.route('**/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ mensagem: 'Credenciais inválidas' }),
      }),
    );

    await page.goto('/login');
    await page.getByLabel(/Email/i).fill('wrong@test.com');
    await page.getByLabel(/Senha/i).fill('wrongpass');
    await page.getByRole('button', { name: /ENTRAR/i }).click();

    await expect(page.getByText('Falha no Login')).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to dashboard on successful login', async ({ page }) => {
    await page.route('**/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'admin@test.com',
          role: 'ADMIN',
          token: 'fake-jwt-token',
          isInitialPassword: false,
        }),
      }),
    );

    // Mock all dashboard API calls to prevent errors
    await page.route('**/alunos/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ totalElements: 0 }) }),
    );
    await page.route('**/livros/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ totalElements: 0 }) }),
    );
    await page.route('**/emprestimos/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(0) }),
    );
    await page.route('**/solicitacoes/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );

    await page.goto('/login');
    await page.getByLabel(/Email/i).fill('admin@test.com');
    await page.getByLabel(/Senha/i).fill('pass123');
    await page.getByRole('button', { name: /ENTRAR/i }).click();

    await page.waitForURL('**/dashboard', { timeout: 5000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('should disable button and show spinner while loading', async ({ page }) => {
    // Slow response to see loading state
    await page.route('**/auth/login', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/login');
    await page.getByLabel(/Email/i).fill('admin@test.com');
    await page.getByLabel(/Senha/i).fill('pass123');
    await page.getByRole('button', { name: /ENTRAR/i }).click();

    await expect(page.getByText('ENTRANDO...')).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Forgot Password Page', () => {
  test('should navigate from login to forgot password', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Esqueceu sua senha?').click();

    await expect(page.getByText('Esqueci a Senha')).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /ENVIAR LINK/i })).toBeVisible();
  });

  test('should show warning for invalid email', async ({ page }) => {
    await page.goto('/esqueci-a-senha');
    await page.getByLabel(/Email/i).fill('invalid-email');
    await page.getByRole('button', { name: /ENVIAR LINK/i }).click();

    await expect(page.getByText('E-mail inválido')).toBeVisible({ timeout: 3000 });
  });

  test('should show success toast on valid email submission', async ({ page }) => {
    await page.route('**/auth/esqueci-senha', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ mensagem: 'Link enviado com sucesso.' }),
      }),
    );

    await page.goto('/esqueci-a-senha');
    await page.getByLabel(/Email/i).fill('user@test.com');
    await page.getByRole('button', { name: /ENVIAR LINK/i }).click();

    await expect(page.getByText('Solicitação Enviada')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate back to login page', async ({ page }) => {
    await page.goto('/esqueci-a-senha');
    await page.getByText('Voltar para o Login').click();

    await expect(page.getByRole('button', { name: /ENTRAR/i })).toBeVisible();
  });
});
