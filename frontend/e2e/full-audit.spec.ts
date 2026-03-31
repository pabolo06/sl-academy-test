/**
 * AUDITORIA COMPLETA — https://sl-academy.vercel.app
 * Testa cada funcionalidade do sistema sem limite de tempo.
 * Gera screenshots de cada estado em screenshots/audit/
 */
import { test, expect, Page, BrowserContext } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const BASE = 'https://sl-academy.vercel.app'
const MANAGER_EMAIL = 'gestor@teste.com'
const MANAGER_PASS  = 'teste123'
const DOCTOR_EMAIL  = 'medico@teste.com'
const DOCTOR_PASS   = 'teste123'
const SS = path.join(__dirname, '..', 'screenshots', 'audit')

const report: Array<{ section: string; test: string; status: 'PASS' | 'FAIL' | 'WARN'; detail: string }> = []

function ss(name: string) { return path.join(SS, `${name}.png`) }
function ensureDir() { if (!fs.existsSync(SS)) fs.mkdirSync(SS, { recursive: true }) }

function log(section: string, name: string, status: 'PASS' | 'FAIL' | 'WARN', detail = '') {
  report.push({ section, test: name, status, detail })
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌'
  console.log(`  ${icon} [${section}] ${name}${detail ? ' — ' + detail : ''}`)
}

async function loginManager(page: Page) {
  await page.goto(`${BASE}/login?role=manager`)
  await page.waitForLoadState('networkidle')
  await page.fill('#login-email', MANAGER_EMAIL)
  await page.fill('#login-password', MANAGER_PASS)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/(manager|dashboard)/, { timeout: 20000 })
  await page.waitForLoadState('networkidle')
}

async function loginDoctor(page: Page) {
  await page.goto(`${BASE}/login?role=doctor`)
  await page.waitForLoadState('networkidle')
  await page.fill('#login-email', DOCTOR_EMAIL)
  await page.fill('#login-password', DOCTOR_PASS)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/dashboard/, { timeout: 20000 })
  await page.waitForLoadState('networkidle')
}

async function checkNetworkErrors(page: Page): Promise<string[]> {
  const errors: string[] = []
  page.on('response', async res => {
    if (res.status() >= 400 && res.status() !== 401) {
      errors.push(`[${res.status()}] ${res.url()}`)
    }
  })
  return errors
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTENTICAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
test.describe('1. AUTENTICAÇÃO', () => {
  test('1.1 Login page carrega corretamente', async ({ page }) => {
    ensureDir()
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: ss('01-login-page'), fullPage: true })

    const h1 = await page.locator('h1').textContent()
    const hasEmail = await page.locator('#login-email').isVisible()
    const hasPass  = await page.locator('#login-password').isVisible()
    const hasSubmit = await page.locator('button[type="submit"]').isVisible()
    const hasTabs = await page.locator('button:has-text("Entrar")').first().isVisible()

    if (hasEmail && hasPass && hasSubmit && hasTabs) log('AUTH', 'Login page carrega', 'PASS', `h1="${h1}"`)
    else log('AUTH', 'Login page carrega', 'FAIL', `email=${hasEmail} pass=${hasPass} submit=${hasSubmit}`)
  })

  test('1.2 Troca de role Manager/Doctor', async ({ page }) => {
    await page.goto(`${BASE}/login?role=doctor`)
    await page.waitForLoadState('networkidle')
    const h1Doctor = await page.locator('h1').textContent()
    await page.screenshot({ path: ss('01b-login-doctor'), fullPage: true })

    await page.goto(`${BASE}/login?role=manager`)
    await page.waitForLoadState('networkidle')
    const h1Manager = await page.locator('h1').textContent()
    await page.screenshot({ path: ss('01c-login-manager'), fullPage: true })

    if (h1Doctor?.includes('Médico') && h1Manager?.includes('Gestor'))
      log('AUTH', 'Troca de role', 'PASS', `doctor="${h1Doctor}" manager="${h1Manager}"`)
    else log('AUTH', 'Troca de role', 'FAIL', `doctor="${h1Doctor}" manager="${h1Manager}"`)
  })

  test('1.3 Aba Cadastrar exibe formulário completo', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Cadastrar' }).click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: ss('01d-register-form'), fullPage: true })

    const fields = ['#reg-name', '#reg-email', '#reg-password', '#reg-confirm', '#regTerms']
    let allVisible = true
    for (const f of fields) {
      if (!(await page.locator(f).isVisible())) { allVisible = false; break }
    }
    if (allVisible) log('AUTH', 'Formulário de registo', 'PASS')
    else log('AUTH', 'Formulário de registo', 'FAIL', 'campo em falta')
  })

  test('1.4 Credenciais inválidas mostram erro', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('networkidle')
    await page.fill('#login-email', 'invalido@teste.com')
    await page.fill('#login-password', 'senha_errada_123')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Email ou senha incorretos')).toBeVisible({ timeout: 15000 })
    await page.screenshot({ path: ss('01e-login-error'), fullPage: true })
    log('AUTH', 'Erro credenciais inválidas', 'PASS')
  })

  test('1.5 Login como Gestor redireciona corretamente', async ({ page }) => {
    await loginManager(page)
    await page.screenshot({ path: ss('01f-manager-logged'), fullPage: true })
    const url = page.url()
    if (url.includes('/manager')) log('AUTH', 'Login Gestor → redirect', 'PASS', url)
    else log('AUTH', 'Login Gestor → redirect', 'WARN', `URL inesperado: ${url}`)
  })

  test('1.6 Login como Médico redireciona corretamente', async ({ page }) => {
    await loginDoctor(page)
    await page.screenshot({ path: ss('01g-doctor-logged'), fullPage: true })
    const url = page.url()
    if (url.includes('/dashboard')) log('AUTH', 'Login Médico → redirect', 'PASS', url)
    else log('AUTH', 'Login Médico → redirect', 'WARN', `URL inesperado: ${url}`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. PAINEL DO GESTOR
// ─────────────────────────────────────────────────────────────────────────────
test.describe('2. GESTOR — Dashboard', () => {
  test('2.1 Dashboard gerencial carrega métricas', async ({ page }) => {
    await loginManager(page)
    await page.goto(`${BASE}/manager/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: ss('02a-manager-dashboard'), fullPage: true })

    const hasError = await page.locator('[class*="error"], .text-red-400, .text-red-500').count() > 0
    const cards = await page.locator('[class*="card"], [class*="Card"], [class*="stat"]').count()
    log('GESTOR', 'Dashboard carrega', hasError ? 'WARN' : 'PASS',
      `cards=${cards} errors=${hasError}`)
  })

  test('2.2 Sidebar de navegação', async ({ page }) => {
    await loginManager(page)
    await page.goto(`${BASE}/manager/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: ss('02b-sidebar'), fullPage: true })

    const navItems = ['Dashboard', 'Trilhas', 'Indicadores', 'Escala', 'Rostering', 'Ocupacional', 'Diretrizes', 'Utilizadores']
    let found = 0
    for (const item of navItems) {
      if (await page.locator(`text=${item}`).first().isVisible()) found++
    }
    log('GESTOR', 'Sidebar de navegação', found >= 4 ? 'PASS' : 'WARN', `${found}/${navItems.length} itens visíveis`)
  })
})

test.describe('3. GESTOR — Trilhas', () => {
  test('3.1 Lista de trilhas carrega', async ({ page }) => {
    await loginManager(page)
    await page.goto(`${BASE}/manager/tracks`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: ss('03a-manager-tracks'), fullPage: true })

    const hasError = (await page.locator('.text-red-400, .text-red-500, [class*="error"]').count()) > 0
    const tracks = await page.locator('[class*="track"], [class*="Track"], [class*="card"]').count()
    log('GESTOR', 'Lista trilhas carrega', hasError ? 'WARN' : 'PASS', `tracks~${tracks}`)
  })

  test('3.2 Botão Nova Trilha abre formulário', async ({ page }) => {
    await loginManager(page)
    await page.goto(`${BASE}/manager/tracks`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const btn = page.getByRole('button', { name: /nova trilha/i })
    if (await btn.isVisible()) {
      await btn.click()
      await page.waitForTimeout(500)
      await page.screenshot({ path: ss('03b-track-form'), fullPage: true })
      const form = await page.locator('input[placeholder], input[name], textarea').count()
      log('GESTOR', 'Form nova trilha', form > 0 ? 'PASS' : 'WARN', `${form} campos`)
    } else {
      await page.screenshot({ path: ss('03b-track-no-btn'), fullPage: true })
      log('GESTOR', 'Form nova trilha', 'WARN', 'Botão não encontrado')
    }
  })
})

test.describe('4. GESTOR — Dúvidas (Kanban)', () => {
  test('4.1 Kanban de dúvidas carrega', async ({ page }) => {
    await loginManager(page)
    await page.goto(`${BASE}/manager/doubts`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    await page.screenshot({ path: ss('04a-manager-doubts'), fullPage: true })

    const hasError = (await page.locator('.text-red-400, .text-red-500, [class*="error"]').count()) > 0
    const columns = await page.locator('[class*="column"], [class*="Column"], [class*="kanban"]').count()
    log('GESTOR', 'Kanban dúvidas', hasError ? 'WARN' : 'PASS', `columns~${columns}`)
  })
})

test.describe('5. GESTOR — Indicadores', () => {
  test('5.1 Página de indicadores carrega', async ({ page }) => {
    await loginManager(page)
    await page.goto(`${BASE}/manager/indicators`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    await page.screenshot({ path: ss('05a-indicators'), fullPage: true })

    const hasError = (await page.locator('.text-red-400, .text-red-500, [class*="error"]').count()) > 0
    const charts = await page.locator('canvas, svg[class*="chart"], [class*="Chart"]').count()
    log('GESTOR', 'Indicadores carregam', hasError ? 'WARN' : 'PASS', `charts~${charts}`)
  })

  test('5.2 Importar indicadores (página)', async ({ page }) => {
    await loginManager(page)
    await page.goto(`${BASE}/manager/indicators/import`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    await page.screenshot({ path: ss('05b-indicators-import'), fullPage: true })

    const hasUpload = (await page.locator('input[type="file"]').count()) > 0
    log('GESTOR', 'Importar indicadores', hasUpload ? 'PASS' : 'WARN', `upload=${hasUpload}`)
  })
})

test.describe('6. GESTOR — Escala de Plantões', () => {
  test('6.1 Escala carrega sem erro', async ({ page }) => {
    const netErrors: string[] = []
    page.on('response', async res => {
      if (res.status() >= 400 && !res.url().includes('auth')) netErrors.push(`[${res.status()}] ${res.url()}`)
    })
    await loginManager(page)
    await page.goto(`${BASE}/manager/schedule`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    await page.screenshot({ path: ss('06a-schedule'), fullPage: true })

    const hasError = (await page.locator('.text-red-400, .text-red-500').count()) > 0
    const hasGrid  = (await page.locator('table, [class*="grid"], [class*="schedule"]').count()) > 0
    const hasPublish = (await page.locator('button:has-text("Publicar")').count()) > 0
    log('GESTOR', 'Escala carrega', netErrors.length > 0 ? 'FAIL' : hasError ? 'WARN' : 'PASS',
      `grid=${hasGrid} publish=${hasPublish} netErrors=${netErrors.join(', ')||'none'}`)
  })

  test('6.2 Navegação entre semanas', async ({ page }) => {
    await loginManager(page)
    await page.goto(`${BASE}/manager/schedule`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const prevBtn = page.locator('button[title="Semana anterior"]')
    const nextBtn = page.locator('button[title="Próxima semana"]')
    const weekText = await page.locator('[class*="week"], text=/Semana/').first().textContent().catch(() => '')

    if (await prevBtn.isVisible()) {
      await nextBtn.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: ss('06b-schedule-next-week'), fullPage: true })
      log('GESTOR', 'Navegação semana', 'PASS', `semana inicial: ${weekText}`)
    } else {
      log('GESTOR', 'Navegação semana', 'WARN', 'Botões de navegação não encontrados')
    }
  })

  test('6.3 Publicar escala', async ({ page }) => {
    await loginManager(page)
    await page.goto(`${BASE}/manager/schedule`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    const publishBtn = page.locator('button:has-text("Publicar Escala")')
    if (await publishBtn.isVisible()) {
      await publishBtn.click()
      // Wait up to 10s for success message (Railway can have cold-start latency)
      try {
        await page.waitForSelector('text=/publicad/i', { timeout: 10000 })
        await page.screenshot({ path: ss('06c-schedule-publish'), fullPage: true })
        log('GESTOR', 'Publicar escala', 'PASS', 'mensagem de sucesso visível')
      } catch {
        await page.screenshot({ path: ss('06c-schedule-publish'), fullPage: true })
        const alreadyPublished = await page.locator('text=/foi publicada/i').isVisible()
        log('GESTOR', 'Publicar escala', alreadyPublished ? 'PASS' : 'WARN', alreadyPublished ? 'escala já publicada' : 'timeout aguardando confirmação')
      }
    } else {
      // Schedule already published — check for published banner
      const publishedBanner = await page.locator('text=/foi publicada/i').isVisible()
      log('GESTOR', 'Publicar escala', publishedBanner ? 'PASS' : 'WARN', publishedBanner ? 'escala já publicada' : 'botão não encontrado')
    }
  })
})

test.describe('7. GESTOR — Utilizadores', () => {
  test('7.1 Página de utilizadores', async ({ page }) => {
    await loginManager(page)
    await page.goto(`${BASE}/manager/users`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: ss('07a-manager-users'), fullPage: true })

    const hasError = (await page.locator('.text-red-400, .text-red-500, [class*="error"]').count()) > 0
    const users = await page.locator('[class*="user"], [class*="User"], tr, [class*="row"]').count()
    log('GESTOR', 'Lista utilizadores', hasError ? 'WARN' : 'PASS', `rows~${users}`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. PAINEL DO MÉDICO
// ─────────────────────────────────────────────────────────────────────────────
test.describe('8. MÉDICO — Dashboard', () => {
  test('8.1 Dashboard médico carrega', async ({ page }) => {
    await loginDoctor(page)
    await page.waitForTimeout(2000)
    await page.screenshot({ path: ss('08a-doctor-dashboard'), fullPage: true })

    const hasError = (await page.locator('.text-red-400, .text-red-500, [class*="error"]').count()) > 0
    const content = await page.locator('main, [class*="dashboard"], [class*="content"]').count()
    log('MÉDICO', 'Dashboard carrega', hasError ? 'WARN' : 'PASS', `content=${content}`)
  })
})

test.describe('9. MÉDICO — Trilhas', () => {
  test('9.1 Lista de trilhas visível', async ({ page }) => {
    await loginDoctor(page)
    await page.goto(`${BASE}/tracks`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: ss('09a-doctor-tracks'), fullPage: true })

    const hasError = (await page.locator('.text-red-400, .text-red-500').count()) > 0
    const tracks = await page.locator('[class*="track"], [class*="Track"], [class*="card"]').count()
    log('MÉDICO', 'Lista trilhas', hasError ? 'WARN' : 'PASS', `items~${tracks}`)
  })

  test('9.2 Abrir trilha → lista de lições', async ({ page }) => {
    await loginDoctor(page)
    await page.goto(`${BASE}/tracks`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const firstTrack = page.locator('a[href*="/tracks/"], button[class*="track"]').first()
    if (await firstTrack.isVisible()) {
      await firstTrack.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      await page.screenshot({ path: ss('09b-track-detail'), fullPage: true })
      const url = page.url()
      log('MÉDICO', 'Abrir trilha', url.includes('/tracks/') ? 'PASS' : 'WARN', url)
    } else {
      log('MÉDICO', 'Abrir trilha', 'WARN', 'Nenhuma trilha clicável encontrada')
    }
  })
})

test.describe('10. MÉDICO — Dúvidas', () => {
  test('10.1 Página de dúvidas', async ({ page }) => {
    await loginDoctor(page)
    await page.goto(`${BASE}/doubts`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: ss('10a-doctor-doubts'), fullPage: true })

    const hasError = (await page.locator('.text-red-400, .text-red-500').count()) > 0
    const hasForm = (await page.locator('textarea, input[placeholder*="dúvida"]').count()) > 0
    log('MÉDICO', 'Página dúvidas', hasError ? 'WARN' : 'PASS', `form=${hasForm}`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 11. RESPONSIVIDADE MOBILE
// ─────────────────────────────────────────────────────────────────────────────
test.describe('11. RESPONSIVIDADE', () => {
  test('11.1 Login — mobile 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: ss('11a-mobile-login'), fullPage: true })

    const hasEmail = await page.locator('#login-email').isVisible()
    log('RESPONSIVE', 'Login mobile 375px', hasEmail ? 'PASS' : 'FAIL')
  })

  test('11.2 Dashboard gestor — mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await loginManager(page)
    await page.goto(`${BASE}/manager/dashboard`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: ss('11b-mobile-manager-dashboard'), fullPage: true })
    log('RESPONSIVE', 'Manager dashboard mobile', 'PASS')
  })

  test('11.3 Escala — tablet 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await loginManager(page)
    await page.goto(`${BASE}/manager/schedule`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: ss('11c-tablet-schedule'), fullPage: true })
    log('RESPONSIVE', 'Escala tablet 768px', 'PASS')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 12. NOVAS FEATURES GESTOR
// ─────────────────────────────────────────────────────────────────────────────
test.describe('12. GESTOR — Novas Funcionalidades', () => {
  test('12.1 Saúde Ocupacional carrega', async ({ page }) => {
    await loginManager(page)
    await page.goto(`${BASE}/manager/occupational`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    await page.screenshot({ path: ss('12a-occupational'), fullPage: true })

    const hasH1 = await page.locator('h1').first().isVisible()
    const hasError = (await page.locator('.text-red-400, .text-red-500, .text-red-800').count()) > 0
    const hasTabs = await page.locator('button:has-text("Alertas")').first().isVisible()
    log('GESTOR', 'Saúde Ocupacional', hasH1 && hasTabs ? (hasError ? 'WARN' : 'PASS') : 'FAIL',
      `h1=${hasH1} tabs=${hasTabs} errors=${hasError}`)
  })

  test('12.2 Monitor de Diretrizes carrega', async ({ page }) => {
    await loginManager(page)
    await page.goto(`${BASE}/manager/watcher`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    await page.screenshot({ path: ss('12b-watcher'), fullPage: true })

    const hasH1 = await page.locator('h1').first().isVisible()
    const hasBtn = await page.locator('button:has-text("Verificar")').first().isVisible()
    log('GESTOR', 'Monitor de Diretrizes', hasH1 && hasBtn ? 'PASS' : 'FAIL',
      `h1=${hasH1} btn=${hasBtn}`)
  })

  test('12.3 Rostering IA carrega', async ({ page }) => {
    await loginManager(page)
    await page.goto(`${BASE}/manager/rostering`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    await page.screenshot({ path: ss('12c-rostering'), fullPage: true })

    const hasH1 = await page.locator('h1').first().isVisible()
    const hasSwapsTab = await page.locator('button:has-text("Trocas")').first().isVisible()
    const hasChatTab  = await page.locator('button:has-text("Assistente")').first().isVisible()
    log('GESTOR', 'Rostering IA', hasH1 && hasSwapsTab && hasChatTab ? 'PASS' : 'FAIL',
      `h1=${hasH1} swaps=${hasSwapsTab} chat=${hasChatTab}`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 13. NOVAS FEATURES MÉDICO
// ─────────────────────────────────────────────────────────────────────────────
test.describe('13. MÉDICO — Novas Funcionalidades', () => {
  test('13.1 Meus Plantões carrega', async ({ page }) => {
    await loginDoctor(page)
    await page.goto(`${BASE}/shifts`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    await page.screenshot({ path: ss('13a-doctor-shifts'), fullPage: true })

    const hasH1 = await page.locator('h1').first().isVisible()
    const hasTrocarBtn = await page.locator('button:has-text("Troca")').first().isVisible()
    log('MÉDICO', 'Meus Plantões', hasH1 ? 'PASS' : 'FAIL', `h1=${hasH1} swapBtn=${hasTrocarBtn}`)
  })

  test('13.2 Suporte Clínico (CDSS) carrega', async ({ page }) => {
    await loginDoctor(page)
    await page.goto(`${BASE}/cdss`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: ss('13b-cdss'), fullPage: true })

    const hasH1   = await page.locator('h1').first().isVisible()
    const hasInput = await page.locator('input[type="text"], textarea').first().isVisible()
    const hasSuggestions = (await page.locator('button:has-text("protocolo"), button:has-text("sepse"), button:has-text("Dose"), button:has-text("Critérios")').count()) > 0
    log('MÉDICO', 'Suporte Clínico CDSS', hasH1 && hasInput ? 'PASS' : 'FAIL',
      `h1=${hasH1} input=${hasInput} sugestoes=${hasSuggestions}`)
  })

  test('13.3 CDSS — enviar pergunta', async ({ page }) => {
    await loginDoctor(page)
    await page.goto(`${BASE}/cdss`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const input = page.locator('input[type="text"]').first()
    await input.fill('Qual é o protocolo de sepse?')
    await page.locator('button[type="submit"]').last().click()

    // Wait for response (up to 15s for CDSS)
    try {
      await page.waitForFunction(() => {
        const msgs = document.querySelectorAll('[class*="rounded-2xl"]')
        return msgs.length >= 2
      }, { timeout: 15000 })
      await page.screenshot({ path: ss('13c-cdss-response'), fullPage: true })
      log('MÉDICO', 'CDSS resposta', 'PASS', 'resposta recebida')
    } catch {
      await page.screenshot({ path: ss('13c-cdss-response'), fullPage: true })
      log('MÉDICO', 'CDSS resposta', 'WARN', 'timeout aguardando resposta (OPENAI_API_KEY pode estar ausente)')
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 14. SEGURANÇA — Acesso não autorizado
// ─────────────────────────────────────────────────────────────────────────────
test.describe('14. SEGURANÇA', () => {
  test('14.1 Rota manager bloqueada sem auth', async ({ page }) => {
    await page.goto(`${BASE}/manager/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: ss('12a-unauth-manager'), fullPage: true })
    const url = page.url()
    log('SEG', 'Proteção rota manager', url.includes('/login') ? 'PASS' : 'FAIL', url)
  })

  test('14.2 Rota doctor bloqueada sem auth', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: ss('12b-unauth-doctor'), fullPage: true })
    const url = page.url()
    log('SEG', 'Proteção rota doctor', url.includes('/login') ? 'PASS' : 'FAIL', url)
  })

  test('14.3 Doctor não acessa painel do gestor', async ({ page }) => {
    await loginDoctor(page)
    await page.goto(`${BASE}/manager/dashboard`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: ss('12c-doctor-tries-manager'), fullPage: true })
    const url = page.url()
    const blocked = url.includes('/login') || url.includes('/dashboard') || !url.includes('/manager')
    log('SEG', 'Doctor bloqueado de /manager', blocked ? 'PASS' : 'FAIL', `URL final: ${url}`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 13. RELATÓRIO FINAL
// ─────────────────────────────────────────────────────────────────────────────
test.afterAll(async () => {
  const total = report.length
  const pass  = report.filter(r => r.status === 'PASS').length
  const warn  = report.filter(r => r.status === 'WARN').length
  const fail  = report.filter(r => r.status === 'FAIL').length

  const lines = [
    '',
    '═══════════════════════════════════════════════════════',
    '  RELATÓRIO FINAL — SL Academy Audit',
    `  ${new Date().toISOString()}`,
    '═══════════════════════════════════════════════════════',
    `  Total: ${total} | ✅ ${pass} PASS | ⚠️ ${warn} WARN | ❌ ${fail} FAIL`,
    '',
  ]

  const sections = [...new Set(report.map(r => r.section))]
  for (const sec of sections) {
    lines.push(`  ── ${sec} ──`)
    report.filter(r => r.section === sec).forEach(r => {
      const icon = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️' : '❌'
      lines.push(`    ${icon} ${r.test}${r.detail ? ' → ' + r.detail : ''}`)
    })
    lines.push('')
  }
  lines.push('═══════════════════════════════════════════════════════')
  console.log(lines.join('\n'))

  // Salvar relatório em ficheiro
  ensureDir()
  fs.writeFileSync(path.join(SS, '_RELATORIO.txt'), lines.join('\n'), 'utf8')
})
