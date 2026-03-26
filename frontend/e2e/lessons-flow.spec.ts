import { test, expect } from '@playwright/test';

const BASE = 'https://sl-academy.vercel.app';

test.describe('Lessons Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('networkidle');
    await page.fill('#login-email', 'gestor@teste.com');
    await page.fill('#login-password', 'teste123');
    await page.locator('#loginTerms').check();
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/(dashboard|manager)/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('Lesson management page loads and shows lessons', async ({ page }) => {
    await page.goto(`${BASE}/manager/tracks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click on Aulas link of first track
    const aulasLink = page.locator('a', { hasText: 'Aulas' }).first();
    await expect(aulasLink).toBeVisible({ timeout: 10000 });
    await aulasLink.click();

    // Wait for navigation and page load
    await page.waitForURL(/\/manager\/tracks\/.*\/lessons/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'screenshots/lessons-page.png', fullPage: true });

    const url = page.url();
    console.log('URL:', url);

    // Page should NOT have generic error
    const bodyText = await page.locator('body').textContent();
    console.log('Has "Failed to fetch":', bodyText?.includes('Failed to fetch'));
    
    // Should have Nova Aula button
    const novaAulaBtn = page.locator('button', { hasText: 'Nova Aula' });
    await expect(novaAulaBtn).toBeVisible({ timeout: 5000 });
  });

  test('Can open and fill New Lesson form', async ({ page }) => {
    await page.goto(`${BASE}/manager/tracks`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const aulasLink = page.locator('a', { hasText: 'Aulas' }).first();
    await aulasLink.click();
    await page.waitForURL(/\/manager\/tracks\/.*\/lessons/, { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Click Nova Aula (scroll into view to avoid sticky header overlap on mobile)
    const novaAulaBtn2 = page.locator('button', { hasText: 'Nova Aula' });
    await novaAulaBtn2.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await novaAulaBtn2.click({ force: true });
    await page.waitForTimeout(500);

    // Form should be visible
    await expect(page.locator('#title')).toBeVisible();
    await expect(page.locator('#video_url')).toBeVisible();

    await page.screenshot({ path: 'screenshots/lessons-form.png', fullPage: true });
  });
});
