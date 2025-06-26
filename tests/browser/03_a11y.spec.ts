import { test } from '@japa/runner'
import { configureAxe, exportAxeResults } from './axe.config.js'

/**
 * Tests d'accessibilité E2E pour les pages principales
 * Couvre les parcours critiques identifiés
 *
 * Références RGAA :
 * - RGAA 1.1 : Images avec attribut alt approprié
 * - RGAA 3.2 : Contraste des couleurs suffisant (4.5:1 minimum)
 * - RGAA 8.9 : Étiquetage des champs de formulaire
 * - RGAA 9.1 : Titre de page informatif
 * - RGAA 12.6 : Landmarks et régions
 */
test.group('Accessibilité - Pages principales', () => {
  test('Page d\'accueil - Accessibilité générale', async ({ visit, expect }) => {
    const page = await visit('/', { waitUntil: 'networkidle' })

    // Attendre que la page soit complètement chargée
    await page.waitForSelector('h1', { state: 'visible' })

    // Configuration et exécution d'Axe
    const axeBuilder = await configureAxe(page)
    const axeResults = await axeBuilder.analyze()

    // RGAA 9.1 : Vérifier qu'il y a un titre de page
    const pageTitle = await page.textContent('title')
    expect(pageTitle).toBeTruthy()
    expect(pageTitle?.length).toBeGreaterThan(10)

    // RGAA 9.1 : Vérifier la présence d'un h1 unique
    const h1Elements = await page.locator('h1').count()
    expect(h1Elements).toBe(1)

    // RGAA 12.6 : Vérifier la présence de landmarks
    const mainLandmark = page.locator('main, [role="main"]')
    expect(await mainLandmark.count()).toBeGreaterThan(0)

    // RGAA 1.1 : Vérifier que les images ont des attributs alt
    const images = page.locator('img')
    const imageCount = await images.count()

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      const ariaLabel = await img.getAttribute('aria-label')
      const ariaHidden = await img.getAttribute('aria-hidden')

      // Une image doit avoir soit alt, soit aria-label, soit être cachée
      expect(alt !== null || ariaLabel !== null || ariaHidden === 'true').toBe(true)
    }

    // Pas de violations critiques d'accessibilité
    expect(axeResults.violations.filter(v => v.impact === 'critical')).toHaveLength(0)

    // Exporter les résultats pour analyse
    await exportAxeResults(axeResults, 'homepage')

    console.log(`✅ Page d'accueil : ${axeResults.violations.length} violations détectées`)
  })

  test('Liste des simulateurs - Navigation et accessibilité', async ({ visit, expect }) => {
    const page = await visit('/simulateurs', { waitUntil: 'networkidle' })

    await page.waitForSelector('h1', { state: 'visible' })

    const axeBuilder = await configureAxe(page)
    const axeResults = await axeBuilder.analyze()

    // RGAA 9.1 : Structure de titres cohérente
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    expect(headings.length).toBeGreaterThan(0)

    // RGAA 11.9 : Liens explicites
    const links = page.locator('a')
    const linkCount = await links.count()

    for (let i = 0; i < Math.min(linkCount, 10); i++) { // Limiter à 10 premiers liens
      const link = links.nth(i)
      const text = await link.textContent()
      const ariaLabel = await link.getAttribute('aria-label')
      const title = await link.getAttribute('title')

      // Un lien doit avoir du texte visible ou un label accessible
      expect(
        (text && text.trim().length > 0)
        || (ariaLabel && ariaLabel.length > 0)
        || (title && title.length > 0),
      ).toBe(true)
    }

    expect(axeResults.violations.filter(v => v.impact === 'critical')).toHaveLength(0)
    await exportAxeResults(axeResults, 'simulateurs-list')

    console.log(`✅ Liste simulateurs : ${axeResults.violations.length} violations détectées`)
  })

  test('Page de simulateur - Écran d\'accueil', async ({ visit, expect }) => {
    const page = await visit('/simulateurs/demenagement-logement', { waitUntil: 'networkidle' })

    // Attendre l'écran de bienvenue
    await page.waitForSelector('[data-testid="survey-welcome-title"]', { state: 'visible' })

    const axeBuilder = await configureAxe(page)
    const axeResults = await axeBuilder.analyze()

    // RGAA 11.13 : Boutons avec libellés explicites
    const startButton = page.getByTestId('survey-start-button')
    expect(await startButton.isVisible()).toBe(true)

    const buttonText = await startButton.textContent()
    expect(buttonText).toBeTruthy()
    expect(buttonText?.trim().length).toBeGreaterThan(3)

    // RGAA 10.4 : Focus visible sur les éléments interactifs
    await startButton.focus()
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'A'].includes(focusedElement || '')).toBe(true)

    expect(axeResults.violations.filter(v => v.impact === 'critical')).toHaveLength(0)
    await exportAxeResults(axeResults, 'simulateur-welcome')

    console.log(`✅ Simulateur (accueil) : ${axeResults.violations.length} violations détectées`)
  })

  test('Formulaire de simulation - Première page', async ({ visit, expect }) => {
    const page = await visit('/simulateurs/demenagement-logement', { waitUntil: 'networkidle' })

    // Démarrer la simulation
    await page.waitForSelector('[data-testid="survey-start-button"]', { state: 'visible' })
    await page.getByTestId('survey-start-button').click()

    // Attendre que la première question s'affiche
    await page.waitForSelector('[data-testid="survey-page"]', { state: 'visible' })

    const axeBuilder = await configureAxe(page)
    const axeResults = await axeBuilder.analyze()

    // RGAA 11.1 : Étiquetage des champs de formulaire
    const formFields = page.locator('input, select, textarea')
    const fieldCount = await formFields.count()

    for (let i = 0; i < fieldCount; i++) {
      const field = formFields.nth(i)
      const fieldId = await field.getAttribute('id')
      const ariaLabel = await field.getAttribute('aria-label')
      const ariaLabelledby = await field.getAttribute('aria-labelledby')

      if (fieldId) {
        // Rechercher un label associé
        const associatedLabel = page.locator(`label[for="${fieldId}"]`)
        const labelExists = await associatedLabel.count() > 0

        expect(labelExists || ariaLabel || ariaLabelledby).toBeTruthy()
      }
    }

    // RGAA 11.10 : Messages d'erreur associés aux champs
    const errorMessages = page.locator('[role="alert"], .fr-error-text')
    const errorCount = await errorMessages.count()

    if (errorCount > 0) {
      // Vérifier que les erreurs sont bien associées aux champs
      for (let i = 0; i < errorCount; i++) {
        const error = errorMessages.nth(i)
        const errorId = await error.getAttribute('id')

        if (errorId) {
          const fieldWithError = page.locator(`[aria-describedby*="${errorId}"]`)
          expect(await fieldWithError.count()).toBeGreaterThan(0)
        }
      }
    }

    expect(axeResults.violations.filter(v => v.impact === 'critical')).toHaveLength(0)
    await exportAxeResults(axeResults, 'simulateur-form')

    console.log(`✅ Formulaire simulation : ${axeResults.violations.length} violations détectées`)
  })

  test('Pages statiques - Contact et mentions', async ({ visit, expect }) => {
    // Test de la page contact
    const contactPage = await visit('/contact', { waitUntil: 'networkidle' })
    await contactPage.waitForSelector('h1', { state: 'visible' })

    const contactAxeBuilder = await configureAxe(contactPage)
    const contactResults = await contactAxeBuilder.analyze()

    expect(contactResults.violations.filter(v => v.impact === 'critical')).toHaveLength(0)
    await exportAxeResults(contactResults, 'contact-page')

    // Test de la page cookies
    const cookiesPage = await visit('/cookies', { waitUntil: 'networkidle' })
    await cookiesPage.waitForSelector('h1', { state: 'visible' })

    const cookiesAxeBuilder = await configureAxe(cookiesPage)
    const cookiesResults = await cookiesAxeBuilder.analyze()

    expect(cookiesResults.violations.filter(v => v.impact === 'critical')).toHaveLength(0)
    await exportAxeResults(cookiesResults, 'cookies-page')

    console.log(`✅ Pages statiques : Contact et Cookies validées`)
  })
})
