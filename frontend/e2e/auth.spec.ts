import { test, expect, Page } from '@playwright/test'

/**
 * Helper: fill a React-controlled input reliably.
 * Uses triple-click to select all existing text, then types the new value.
 * `fill()` dispatches the `input` event properly for React controlled inputs.
 */
async function reactFill(page: Page, selector: string, value: string) {
  const loc = page.locator(selector)
  await loc.click({ clickCount: 3, force: true })
  await loc.fill(value)
}

test.describe('Authentication — Login Tab', () => {
  test('renders login page with correct heading', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('Acesso do Médico')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('renders manager heading when role=manager', async ({ page }) => {
    await page.goto('/login?role=manager')
    await expect(page.locator('h1')).toContainText('Acesso do Gestor')
  })

  test('shows password validation error for short password', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#login-email')).toBeVisible()

    await reactFill(page, '#login-email', 'test@test.com')
    await reactFill(page, '#login-password', 'short')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('text=Senha deve ter no mínimo 8 caracteres')).toBeVisible()
  })

  test('submits without terms checkbox — no terms error shown', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#login-email')).toBeVisible()

    await reactFill(page, '#login-email', 'user@hospital.com')
    await reactFill(page, '#login-password', 'validpassword123')
    await page.locator('button[type="submit"]').click()

    // Bug fix: terms checkbox no longer required on login
    await expect(page.locator('text=Você deve aceitar os termos de uso')).not.toBeVisible()
  })

  test('shows API error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#login-email')).toBeVisible()

    await reactFill(page, '#login-email', 'invalid@hospital.com')
    await reactFill(page, '#login-password', 'wrongpassword123')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('text=Email ou senha incorretos')).toBeVisible({ timeout: 10000 })
  })

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#login-password')).toBeVisible()

    const passwordInput = page.locator('#login-password')
    await expect(passwordInput).toHaveAttribute('type', 'password')

    await page.locator('button[aria-label="Mostrar senha"]').click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    await page.locator('button[aria-label="Ocultar senha"]').click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('password visibility resets when switching tabs', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#login-password')).toBeVisible()

    // Toggle password visible in login tab
    await page.locator('button[aria-label="Mostrar senha"]').click()
    await expect(page.locator('#login-password')).toHaveAttribute('type', 'text')

    // Switch to register tab — password fields should be hidden again
    await page.getByRole('button', { name: 'Cadastrar' }).click()
    await expect(page.locator('#reg-password')).toBeVisible()
    await expect(page.locator('#reg-password')).toHaveAttribute('type', 'password')

    // Switch back — login password should be hidden again
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.locator('#login-password')).toHaveAttribute('type', 'password')
  })
})

test.describe('Authentication — Role Switch', () => {
  test('role switch navigates without full page reload', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1')).toContainText('Acesso do Médico')

    // Click the role switch button (router.push, not <a href>)
    await page.getByRole('button', { name: /Acessar como Gestor/ }).click()
    await expect(page).toHaveURL(/role=manager/, { timeout: 5000 })
    await expect(page.locator('h1')).toContainText('Acesso do Gestor')

    // Switch back
    await page.getByRole('button', { name: /Acessar como Médico/ }).click()
    await expect(page.locator('h1')).toContainText('Acesso do Médico')
  })
})

test.describe('Authentication — Register Tab', () => {
  test('register tab shows all fields', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Cadastrar' }).click()

    await expect(page.locator('#reg-name')).toBeVisible()
    await expect(page.locator('#reg-email')).toBeVisible()
    await expect(page.locator('#reg-password')).toBeVisible()
    await expect(page.locator('#reg-confirm')).toBeVisible()
    await expect(page.locator('#regTerms')).toBeVisible()
  })

  test('register shows validation errors for short name', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Cadastrar' }).click()
    await expect(page.locator('#reg-name')).toBeVisible()

    // Fill minimal values to bypass browser `required` — zod catches short name
    await reactFill(page, '#reg-name', 'A')
    await reactFill(page, '#reg-email', 'a@b.c')
    await reactFill(page, '#reg-password', 'short')
    await reactFill(page, '#reg-confirm', 'short')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('text=Nome deve ter no mínimo 2 caracteres')).toBeVisible()
  })

  test('register shows error when passwords do not match', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Cadastrar' }).click()
    await expect(page.locator('#reg-name')).toBeVisible()

    await reactFill(page, '#reg-name', 'Dr. João')
    await reactFill(page, '#reg-email', 'joao@hospital.com')
    await reactFill(page, '#reg-password', 'password123')
    await reactFill(page, '#reg-confirm', 'different456')
    await page.locator('#regTerms').check()
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('text=Senhas não coincidem')).toBeVisible()
  })
})

// Requires real credentials — set TEST_EMAIL and TEST_PASSWORD env vars to run
test.describe('Authentication — Real Credentials', () => {
  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    const email = process.env.TEST_EMAIL ?? ''
    const password = process.env.TEST_PASSWORD ?? ''
    test.skip(!email || !password, 'TEST_EMAIL / TEST_PASSWORD not set')

    await page.goto('/login')
    await expect(page.locator('#login-email')).toBeVisible()

    await reactFill(page, '#login-email', email)
    await reactFill(page, '#login-password', password)
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/(dashboard|manager\/dashboard)/, { timeout: 10000 })
  })
})
