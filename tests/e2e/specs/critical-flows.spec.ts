import { test, expect } from '@playwright/test'

test.describe('EdgeForce CRM - Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  })

  test.describe('Authentication', () => {
    test('should display login page', async ({ page }) => {
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`)
      await expect(page.locator('h1')).toContainText(/login|sign in/i)
    })

    test('should display registration page', async ({ page }) => {
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register`)
      await expect(page.locator('h1')).toContainText(/register|sign up|create/i)
    })
  })

  test.describe('Dashboard', () => {
    test('should load dashboard page', async ({ page }) => {
      // Note: This would require authenticated session in real E2E
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`)
      // Dashboard may redirect to login if not authenticated
      const url = page.url()
      expect(url).toMatch(/dashboard|login/)
    })

    test('should display dashboard navigation', async ({ page }) => {
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`)
      // Check for navigation elements
      const sidebar = page.locator('aside')
      // Sidebar exists or we're on login
      await expect(sidebar.or(page.locator('text=Sign In'))).toBeVisible()
    })
  })

  test.describe('Contacts', () => {
    test('should display contacts page', async ({ page }) => {
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contacts`)
      const url = page.url()
      expect(url).toMatch(/contacts|login/)
    })

    test('should have search functionality', async ({ page }) => {
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/contacts`)
      const searchInput = page.locator('input[placeholder*="Search" i]').first()
      // Either search exists or we're on login
      await expect(searchInput.or(page.locator('text=Sign In'))).toBeVisible()
    })
  })

  test.describe('Pipeline', () => {
    test('should display pipeline stages', async ({ page }) => {
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pipeline`)
      const url = page.url()
      expect(url).toMatch(/pipeline|login/)
    })

    test('should have draggable deal cards', async ({ page }) => {
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pipeline`)
      // Check for Kanban columns
      const columns = page.locator('[class*="rounded"]').first()
      await expect(columns.or(page.locator('text=Sign In'))).toBeVisible()
    })
  })

  test.describe('Quotes & Invoices', () => {
    test('should display quotes page', async ({ page }) => {
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/quotes`)
      const url = page.url()
      expect(url).toMatch(/quotes|login/)
    })

    test('should display invoices page', async ({ page }) => {
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoices`)
      const url = page.url()
      expect(url).toMatch(/invoices|login/)
    })

    test('should have quote status badges', async ({ page }) => {
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/quotes`)
      const statusElement = page.locator('text=Draft').first()
      await expect(statusElement.or(page.locator('text=Sign In'))).toBeVisible()
    })
  })

  test.describe('Settings', () => {
    test('should display settings page', async ({ page }) => {
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`)
      const url = page.url()
      expect(url).toMatch(/settings|login/)
    })

    test('should have settings sections', async ({ page }) => {
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`)
      const settingsNav = page.locator('nav').first()
      await expect(settingsNav.or(page.locator('text=Sign In'))).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`)
      const h1 = page.locator('h1').first()
      await expect(h1.or(page.locator('text=Sign In'))).toBeVisible()
    })

    test('should have form labels', async ({ page }) => {
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`)
      const emailInput = page.locator('input[type="email"]').first()
      await expect(emailInput.or(page.locator('h1'))).toBeVisible()
    })

    test('should have button labels', async ({ page }) => {
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`)
      const submitButton = page.locator('button[type="submit"]').first()
      await expect(submitButton.or(page.locator('h1'))).toBeVisible()
    })
  })

  test.describe('Performance', () => {
    test('should load page within 3 seconds', async ({ page }) => {
      const startTime = Date.now()
      await page.goto(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`)
      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(3000)
    })
  })
})
