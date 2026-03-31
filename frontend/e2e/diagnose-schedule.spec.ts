/**
 * Diagnostic test — https://sl-academy.vercel.app/manager/schedule
 * Runs against production, captures screenshots + all network/console errors.
 * Run with:
 *   PLAYWRIGHT_TEST_BASE_URL=https://sl-academy.vercel.app npx playwright test e2e/diagnose-schedule.spec.ts --project=chromium --headed
 */
import { test, expect, Page, Request, Response } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const BASE = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://sl-academy.vercel.app'
const MANAGER_EMAIL = process.env.TEST_MANAGER_EMAIL || 'gestor@teste.com'
const MANAGER_PASS  = process.env.TEST_MANAGER_PASS  || 'teste123'
const SS_DIR = path.join(__dirname, '..', 'screenshots', 'diagnose')

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

interface NetworkEntry {
  url: string
  method: string
  status: number | null
  ok: boolean
  body?: string
}

async function collectPageErrors(page: Page): Promise<{
  consoleErrors: string[]
  networkErrors: NetworkEntry[]
}> {
  const consoleErrors: string[] = []
  const networkMap = new Map<string, { method: string; status: number | null; body?: string }>()

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
    if (msg.type() === 'warning' && msg.text().includes('Warning:')) consoleErrors.push(`WARN: ${msg.text()}`)
  })

  page.on('request', (req: Request) => {
    networkMap.set(req.url(), { method: req.method(), status: null })
  })

  page.on('response', async (res: Response) => {
    const entry = networkMap.get(res.url())
    if (entry) {
      entry.status = res.status()
      if (!res.ok() && res.status() !== 304) {
        try { entry.body = await res.text() } catch { entry.body = '(unreadable)' }
      }
    }
  })

  return { consoleErrors, networkErrors: [] }
}

test.describe('Diagnóstico Produção — /manager/schedule', () => {

  test('01 — Login page loads correctly', async ({ page }) => {
    ensureDir(SS_DIR)
    await page.goto(`${BASE}/login?role=manager`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SS_DIR}/01-login-page.png`, fullPage: true })

    await expect(page.locator('h1')).toContainText('Acesso do Gestor')
    console.log('✅ Login page renders correctly')
  })

  test('02 — Login with manager credentials', async ({ page }) => {
    ensureDir(SS_DIR)
    const consoleErrors: string[] = []
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })

    await page.goto(`${BASE}/login?role=manager`)
    await page.waitForLoadState('networkidle')

    await page.fill('#login-email', MANAGER_EMAIL)
    await page.fill('#login-password', MANAGER_PASS)
    await page.screenshot({ path: `${SS_DIR}/02-login-filled.png`, fullPage: true })

    await page.locator('button[type="submit"]').click()

    try {
      await page.waitForURL(/\/(manager|dashboard)/, { timeout: 15000 })
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: `${SS_DIR}/02-after-login.png`, fullPage: true })
      console.log('✅ Login successful — URL:', page.url())
    } catch {
      await page.screenshot({ path: `${SS_DIR}/02-login-FAILED.png`, fullPage: true })
      const errorEl = page.locator('.text-red-400, [class*="error"], [class*="alert"]')
      const errorText = await errorEl.textContent().catch(() => 'no error element')
      console.log('❌ Login failed — error on page:', errorText)
      console.log('Console errors:', consoleErrors)
    }
  })

  test('03 — /manager/schedule redirects unauthenticated to login', async ({ page }) => {
    ensureDir(SS_DIR)
    await page.goto(`${BASE}/manager/schedule`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SS_DIR}/03-schedule-unauth.png`, fullPage: true })
    console.log('URL after accessing schedule without auth:', page.url())
  })

  test('04 — Full flow: login → navigate to /manager/schedule', async ({ page }) => {
    ensureDir(SS_DIR)
    const consoleErrors: string[] = []
    const networkFailed: Array<{ url: string; status: number; body: string }> = []

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(`[${msg.type()}] ${msg.text()}`)
    })

    page.on('response', async res => {
      if (!res.ok() && res.status() !== 304 && res.status() !== 0) {
        try {
          const body = await res.text()
          networkFailed.push({ url: res.url(), status: res.status(), body: body.slice(0, 500) })
        } catch {
          networkFailed.push({ url: res.url(), status: res.status(), body: '(unreadable)' })
        }
      }
    })

    // Step 1: Login
    await page.goto(`${BASE}/login?role=manager`)
    await page.waitForLoadState('networkidle')
    await page.fill('#login-email', MANAGER_EMAIL)
    await page.fill('#login-password', MANAGER_PASS)
    await page.locator('button[type="submit"]').click()

    try {
      await page.waitForURL(/\/(manager|dashboard)/, { timeout: 15000 })
    } catch {
      await page.screenshot({ path: `${SS_DIR}/04-login-FAILED.png`, fullPage: true })
      throw new Error(`Login failed. Current URL: ${page.url()}`)
    }

    // Step 2: Navigate to schedule
    await page.goto(`${BASE}/manager/schedule`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000) // let async data fetches settle
    await page.screenshot({ path: `${SS_DIR}/04-schedule-loaded.png`, fullPage: true })

    // Step 3: Scroll and capture full page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${SS_DIR}/04-schedule-scrolled.png`, fullPage: true })

    // Step 4: Report
    console.log('\n=== /manager/schedule DIAGNOSTIC REPORT ===')
    console.log('URL:', page.url())
    console.log('Title:', await page.title())

    if (consoleErrors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS:')
      consoleErrors.forEach(e => console.log(' •', e))
    } else {
      console.log('\n✅ No console errors')
    }

    if (networkFailed.length > 0) {
      console.log('\n❌ FAILED NETWORK REQUESTS:')
      networkFailed.forEach(r => {
        console.log(` • [${r.status}] ${r.url}`)
        if (r.body) console.log(`   Body: ${r.body}`)
      })
    } else {
      console.log('✅ All network requests succeeded')
    }
  })

  test('05 — Schedule page UI elements inspection', async ({ page }) => {
    ensureDir(SS_DIR)

    // Login first
    await page.goto(`${BASE}/login?role=manager`)
    await page.waitForLoadState('networkidle')
    await page.fill('#login-email', MANAGER_EMAIL)
    await page.fill('#login-password', MANAGER_PASS)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/(manager|dashboard)/, { timeout: 15000 })

    await page.goto(`${BASE}/manager/schedule`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // Check what's visible
    const elements = {
      'Loading spinner': await page.locator('[class*="spin"], [class*="loading"], [class*="skeleton"]').count(),
      'Error messages': await page.locator('[class*="error"], [class*="Error"], .text-red-400, .text-red-500').count(),
      'Schedule table/grid': await page.locator('table, [class*="grid"], [class*="schedule"]').count(),
      'Week navigation': await page.locator('[aria-label*="week"], button:has-text("semana"), button:has-text("anterior"), button:has-text("próxim")').count(),
      'Add slot button': await page.locator('button:has-text("Adicionar"), button:has-text("slot"), button:has-text("turno")').count(),
      'Publish button': await page.locator('button:has-text("Publicar"), button:has-text("publish")').count(),
      'Empty state': await page.locator('[class*="empty"], :text("Nenhum"), :text("vazio"), :text("sem dados")').count(),
    }

    console.log('\n=== UI ELEMENTS FOUND ===')
    for (const [name, count] of Object.entries(elements)) {
      console.log(` ${count > 0 ? '✅' : '—'} ${name}: ${count}`)
    }

    // Capture error text if any
    const errorTexts = await page.locator('[class*="error"], .text-red-400, .text-red-500').allTextContents()
    if (errorTexts.length > 0) {
      console.log('\n❌ ERROR TEXTS ON PAGE:', errorTexts)
    }

    await page.screenshot({ path: `${SS_DIR}/05-ui-elements.png`, fullPage: true })
  })

  test('06 — API calls made by /manager/schedule', async ({ page }) => {
    ensureDir(SS_DIR)
    const apiCalls: Array<{ url: string; method: string; status: number; responseBody: string }> = []

    page.on('response', async res => {
      const url = res.url()
      if (url.includes('railway.app') || url.includes('supabase.co') || url.includes('api/')) {
        try {
          const body = await res.text()
          apiCalls.push({
            url,
            method: res.request().method(),
            status: res.status(),
            responseBody: body.slice(0, 300),
          })
        } catch {
          apiCalls.push({ url, method: res.request().method(), status: res.status(), responseBody: '(stream)' })
        }
      }
    })

    await page.goto(`${BASE}/login?role=manager`)
    await page.waitForLoadState('networkidle')
    await page.fill('#login-email', MANAGER_EMAIL)
    await page.fill('#login-password', MANAGER_PASS)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/(manager|dashboard)/, { timeout: 15000 })

    await page.goto(`${BASE}/manager/schedule`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    console.log('\n=== API CALLS FROM /manager/schedule ===')
    apiCalls.forEach(call => {
      const icon = call.status >= 400 ? '❌' : call.status >= 300 ? '↩' : '✅'
      console.log(`${icon} [${call.status}] ${call.method} ${call.url}`)
      if (call.status >= 400) console.log(`   Response: ${call.responseBody}`)
    })

    await page.screenshot({ path: `${SS_DIR}/06-api-calls.png`, fullPage: true })
  })

})
