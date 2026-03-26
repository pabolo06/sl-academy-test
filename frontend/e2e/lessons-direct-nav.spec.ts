import { test, expect } from '@playwright/test';

const BASE = 'https://sl-academy.vercel.app';

test('Direct navigation to lesson management page', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  // Login first
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('#login-email', 'gestor@teste.com');
  await page.fill('#login-password', 'teste123');
  await page.locator('#loginTerms').check();
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|manager)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');

  // Now do a DIRECT hard navigation to lessons URL
  await page.goto(`${BASE}/manager/tracks/c5188e01-7eee-4a17-964e-2e66cc528fef/lessons`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(4000);

  const bodyText = await page.locator('body').textContent();
  const hasFailed = bodyText?.includes('Failed to fetch');
  const hasLessons = bodyText?.includes('Nova Aula');
  
  console.log('Direct nav - Has "Failed to fetch":', hasFailed);
  console.log('Direct nav - Has "Nova Aula" button:', hasLessons);
  console.log('Console errors:', errors);
  
  await page.screenshot({ path: 'screenshots/direct-nav-lessons.png', fullPage: true });
  
  expect(hasFailed).toBe(false);
});

test('Lesson management via client-side navigation', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('#login-email', 'gestor@teste.com');
  await page.fill('#login-password', 'teste123');
  await page.locator('#loginTerms').check();
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|manager)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  
  // Navigate client-side
  await page.goto(`${BASE}/manager/tracks`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const aulasLink = page.locator('a', { hasText: 'Aulas' }).first();
  await aulasLink.click();
  await page.waitForURL(/\/lessons/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  const bodyText = await page.locator('body').textContent();
  const hasFailed = bodyText?.includes('Failed to fetch');
  console.log('Client-side nav - Has "Failed to fetch":', hasFailed);
  
  await page.screenshot({ path: 'screenshots/clientside-nav-lessons.png', fullPage: true });
  
  expect(hasFailed).toBe(false);
});
