import { test, expect, Page } from '@playwright/test';

const BASE = 'https://sl-academy.vercel.app';
const MANAGER_EMAIL = 'gestor@teste.com';
const MANAGER_PASS = 'teste123';
const DOCTOR_EMAIL = 'medico@teste.com';
const DOCTOR_PASS = 'teste123';

async function loginAs(page: Page, email: string, password: string, role: 'manager' | 'doctor') {
  await page.goto(`${BASE}/login?role=${role}`);
  await page.waitForLoadState('networkidle');
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.locator('#loginTerms').check();
  await page.locator('form button[type="submit"]').click();
  // Wait for redirect after login
  await page.waitForURL(/\/(dashboard|manager)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

// ─── GESTOR ──────────────────────────────────────────────────────────────────

test.describe('GESTOR - Inspeção completa', () => {
  test('Login como gestor', async ({ page }) => {
    await page.goto(`${BASE}/login?role=manager`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/g01-login-manager.png', fullPage: true });

    await page.fill('#login-email', MANAGER_EMAIL);
    await page.fill('#login-password', MANAGER_PASS);
    await page.locator('#loginTerms').check();
    await page.screenshot({ path: 'screenshots/g02-login-filled.png', fullPage: true });

    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/(dashboard|manager)/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/g03-after-login.png', fullPage: true });
  });

  test('Dashboard Gerencial', async ({ page }) => {
    await loginAs(page, MANAGER_EMAIL, MANAGER_PASS, 'manager');
    await page.goto(`${BASE}/manager/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // let charts render
    await page.screenshot({ path: 'screenshots/g04-manager-dashboard.png', fullPage: true });
  });

  test('Sidebar do gestor', async ({ page }) => {
    await loginAs(page, MANAGER_EMAIL, MANAGER_PASS, 'manager');
    await page.goto(`${BASE}/manager/dashboard`);
    await page.waitForLoadState('networkidle');
    // Capture just the sidebar area
    const sidebar = page.locator('aside');
    await sidebar.screenshot({ path: 'screenshots/g05-sidebar.png' });
  });

  test('Gerenciar Trilhas', async ({ page }) => {
    await loginAs(page, MANAGER_EMAIL, MANAGER_PASS, 'manager');
    await page.goto(`${BASE}/manager/tracks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/g06-manager-tracks.png', fullPage: true });
  });

  test('Gerenciar Trilhas - abrir form de nova trilha', async ({ page }) => {
    await loginAs(page, MANAGER_EMAIL, MANAGER_PASS, 'manager');
    await page.goto(`${BASE}/manager/tracks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Nova Trilha/ }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/g07-track-form.png', fullPage: true });
  });

  test('Gerenciar Dúvidas (Kanban)', async ({ page }) => {
    await loginAs(page, MANAGER_EMAIL, MANAGER_PASS, 'manager');
    await page.goto(`${BASE}/manager/doubts`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/g08-manager-doubts.png', fullPage: true });
  });

  test('Indicadores', async ({ page }) => {
    await loginAs(page, MANAGER_EMAIL, MANAGER_PASS, 'manager');
    await page.goto(`${BASE}/manager/indicators`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/g09-indicators.png', fullPage: true });
  });
});

// ─── MÉDICO ──────────────────────────────────────────────────────────────────

test.describe('MÉDICO - Inspeção completa', () => {
  test('Login como médico', async ({ page }) => {
    await page.goto(`${BASE}/login?role=doctor`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/d01-login-doctor.png', fullPage: true });

    await page.fill('#login-email', DOCTOR_EMAIL);
    await page.fill('#login-password', DOCTOR_PASS);
    await page.locator('#loginTerms').check();
    await page.screenshot({ path: 'screenshots/d02-login-filled.png', fullPage: true });

    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/d03-after-login.png', fullPage: true });
  });

  test('Dashboard do médico', async ({ page }) => {
    await loginAs(page, DOCTOR_EMAIL, DOCTOR_PASS, 'doctor');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/d04-doctor-dashboard.png', fullPage: true });
  });

  test('Trilhas de aprendizado', async ({ page }) => {
    await loginAs(page, DOCTOR_EMAIL, DOCTOR_PASS, 'doctor');
    await page.goto(`${BASE}/tracks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/d05-tracks.png', fullPage: true });
  });

  test('Minhas Dúvidas', async ({ page }) => {
    await loginAs(page, DOCTOR_EMAIL, DOCTOR_PASS, 'doctor');
    await page.goto(`${BASE}/doubts`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/d06-doubts.png', fullPage: true });
  });

  test('Mobile - Dashboard médico (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAs(page, DOCTOR_EMAIL, DOCTOR_PASS, 'doctor');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/d07-mobile-dashboard.png', fullPage: true });
  });
});
