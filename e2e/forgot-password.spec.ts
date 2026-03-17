import { test, expect } from '@playwright/test';

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/esqueci-a-senha');
  });

  test('should render forgot password form', async ({ page }) => {
    await expect(page.getByText('Esqueci a Senha')).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /ENVIAR LINK/i })).toBeVisible();
    await expect(page.getByText('Voltar para o Login')).toBeVisible();
  });

  test('should navigate back to login', async ({ page }) => {
    await page.getByText('Voltar para o Login').click();
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('should show success toast on valid email submission', async ({ page }) => {
    await page.route('**/auth/esqueci-senha', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ mensagem: 'Link enviado com sucesso.' }),
      }),
    );

    await page.getByLabel(/Email/i).fill('user@email.com');
    await page.getByRole('button', { name: /ENVIAR LINK/i }).click();

    await expect(page.getByText('Solicitação Enviada')).toBeVisible();
  });

  test('should show warning for invalid email format', async ({ page }) => {
    await page.getByLabel(/Email/i).fill('invalidemail');
    await page.getByRole('button', { name: /ENVIAR LINK/i }).click();

    await expect(page.getByText('E-mail inválido')).toBeVisible();
  });

  test('should navigate from login to forgot password', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Esqueceu sua senha?').click();
    await page.waitForURL('**/esqueci-a-senha');
    await expect(page.getByText('Esqueci a Senha')).toBeVisible();
  });
});
