import { test as base, Page } from '@playwright/test'

type AuthFixtures = {
  authenticatedPage: Page
  managerPage: Page
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login as doctor
    await page.goto('/login')
    await page.fill('input[type="email"]', 'doctor@hospital.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    
    await use(page)
  },

  managerPage: async ({ page }, use) => {
    // Login as manager
    await page.goto('/login')
    await page.fill('input[type="email"]', 'manager@hospital.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    
    await use(page)
  },
})

export { expect } from '@playwright/test'
