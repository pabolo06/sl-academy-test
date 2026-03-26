import { test, expect } from '@playwright/test';

const BASE = 'https://sl-academy.vercel.app';

test('Debug: capturar erro exato na página de aulas', async ({ page }) => {
  const errors: string[] = [];
  const networkFails: string[] = [];

  // Capturar erros de console
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // Capturar falhas de rede
  page.on('requestfailed', (req) => {
    networkFails.push(`${req.method()} ${req.url()} → ${req.failure()?.errorText}`);
  });

  // Login como gestor
  await page.goto(`${BASE}/login?role=manager`);
  await page.waitForLoadState('networkidle');
  await page.fill('#login-email', 'gestor@teste.com');
  await page.fill('#login-password', 'teste123');
  await page.locator('#loginTerms').check();
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(/\/(dashboard|manager)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');

  // Ir para gerenciar trilhas para pegar o trackId
  await page.goto(`${BASE}/manager/tracks`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Clicar no botão "Aulas" da primeira trilha
  const aulasBtn = page.locator('a', { hasText: 'Aulas' }).first();
  const lessonsHref = await aulasBtn.getAttribute('href');
  console.log('Lessons URL:', lessonsHref);
  await aulasBtn.click();

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const url = page.url();
  console.log('Current URL:', url);

  await page.screenshot({ path: 'screenshots/debug-lessons.png', fullPage: true });

  // Log erros capturados
  console.log('=== Console Errors ===');
  errors.forEach(e => console.log('  ERROR:', e));

  console.log('=== Network Failures ===');
  networkFails.forEach(f => console.log('  FAIL:', f));

  // Verificar se há mensagem de erro na tela
  const errorText = await page.locator('.alert-error, [class*="red"], [class*="error"]').first().textContent().catch(() => 'none');
  console.log('=== Error on screen ===', errorText);

  // Verificar estado da página
  const pageContent = await page.locator('main, .space-y-6').first().textContent().catch(() => 'none');
  console.log('=== Page Content ===', pageContent?.slice(0, 300));
});
