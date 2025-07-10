import { test } from '@japa/runner'

test.group('Application UI tests', () => {
  test('homepage loads successfully with link to housing simulator', async ({ visit, expect }) => {
    // Open new page and navigate to homepage
    const page = await visit('/', { waitUntil: 'networkidle' })

    // Check that there's a clickable link to the "Déménagement & logement" simulator
    const demenagementLink = page.getByRole('link', { name: /déménagement/i, exact: false }).first()
    expect(await demenagementLink.isVisible()).toBe(true)
    expect(await demenagementLink.isEnabled()).toBe(true)

    // Verify the href attribute points to the correct simulator
    const href = await demenagementLink.getAttribute('href')
    expect(href).toContain('/simulateurs/demenagement-logement')
  })

  test('homepage displays menu, footer and links to static pages', async ({ visit, expect }) => {
    const page = await visit('/', { waitUntil: 'networkidle' })

    // Check that the header title is correct
    const headerTitle = page.locator('.fr-header__service-title').first()
    expect(await headerTitle.textContent()).toContain('aides simplifiées')

    // Get the current viewport width
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    const navMenu = page.locator('[aria-label="Menu principal"]').first()

    // Check footer exists
    const footer = page.locator('.fr-footer')
    expect(await footer.isVisible()).toBe(true)

    // Check that footer contains links to static pages
    const footerLinks = [
      { name: 'Accessibilité', url: '/content/accessibilite' },
      { name: 'Mentions légales', url: '/content/mentions-legales' },
      { name: 'Données personnelles', url: '/content/donnees-personnelles' },
      { name: 'Gestion des cookies', url: '/content/gestion-cookies' },
    ]

    for (const link of footerLinks) {
      const footerLink = page.getByRole('link', { name: link.name }).first()
      expect(await footerLink.isVisible()).toBe(true)
    }

    // Determine if we're on mobile viewport (below 768px is mobile in DSFR)
    if (viewportWidth >= 768) {
      // On desktop, the navigation should be visible by default
      expect(await navMenu.isVisible()).toBe(true)

      // Test the contact page specifically
      const contactLink = page.getByRole('link', { name: 'Contact' }).first()
      await contactLink.click()
      await page.waitForURL('**/contact')
      expect(page.url()).toContain('/contact')

      const h1 = page.locator('h1')
      expect(await h1.textContent()).toContain('Contact')
    }
    else {
      // On mobile, the navigation menu is hidden by default
      expect(await navMenu.isVisible()).toBe(false)

      // Click the nav toggler button to show the menu
      const navOpenBtn = page.locator('[data-testid="open-menu-btn"]')
      expect(await navOpenBtn.isVisible()).toBe(true)
      await navOpenBtn.click()

      // Wait for menu to be visible and animation to complete
      await navMenu.waitFor({ state: 'visible' })
      // await page.screenshot({ path: 'tests/browser/screenshots/menu-should-be-open.png' })

      const navCloseBtn = page.locator('[data-testid="close-modal-btn"]')
      await navCloseBtn.click()

      // Wait for menu to be hidden and animation to complete
      // await page.screenshot({ path: 'tests/browser/screenshots/menu-should-be-closed.png' })
      await navMenu.waitFor({ state: 'hidden' })
    }
  })

  test('notions and aides pages are accessible and navigable', async ({ visit, expect }) => {
    // Test /notions page
    let page = await visit('/notions')
    expect(page.url()).toContain('/notions')
    await page.waitForLoadState('networkidle')

    const notionsH1 = page.locator('h1')
    expect(await notionsH1.textContent()).toContain('Notions')

    // Get the first notion link and navigate to it
    const firstNotionLink = page.locator('.fr-card a').first()
    const notionTitle = await firstNotionLink.textContent()
    await firstNotionLink.click()
    await page.waitForURL('**/notions/*')

    const detailH1 = page.locator('h1')
    expect(await detailH1.textContent()).toContain(notionTitle || '')

    // Test /aides page
    page = await visit('/aides')
    expect(page.url()).toContain('/aides')

    const aidesH1 = page.locator('h1')
    expect(await aidesH1.textContent()).toContain('Aides')

    // Get the first aide link and navigate to it
    const firstAideLink = page.locator('.fr-card a').first()
    const aideTitle = await firstAideLink.textContent()
    await firstAideLink.click()
    await page.waitForURL('**/aides/*')

    // Check we're on an aide detail page
    expect(page.url()).toContain('/aides')

    const aideDetailH1 = page.locator('h1')
    expect(await aideDetailH1.textContent()).toContain(aideTitle || '')
  })
})
