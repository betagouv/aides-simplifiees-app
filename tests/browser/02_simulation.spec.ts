import { test } from '@japa/runner'
import {
  answerAllQuestionsInCurrentPage,
  autoCompleteForm,
  getAllSurveyPageAnswers,
  goToNextSurveyPage,
  goToPreviousSurveyPage,
  setupApiMocks,
  startSurvey,
} from './helpers/test_helpers.js'

test.group('Subsidy simulator form', () => {
  test('should display welcome screen and start a new simulation', async ({ expect, visit }) => {
    const simulateurSlug = 'demenagement-logement'

    const page = await visit(`/simulateurs/${simulateurSlug}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('#simulateur-title', { state: 'visible' })
    // Check if welcome screen is visible
    expect(await page.getByTestId('survey-welcome-title').isVisible()).toBe(true)

    // Click the start button
    await page.getByTestId('survey-start-button').click()

    // Verify the first question is displayed
    expect(await page.getByTestId('survey-page').isVisible()).toBe(true)
  })
  // test('should complete comprehensive-test form flow', async ({ visit }) => {
  //   const simulateurSlug = 'comprehensive-test'
  //   const page = await visit(`/simulateurs/${simulateurSlug}`, { waitUntil: 'networkidle' })
  //   await setupApiMocks(page, simulateurSlug)

  //   await autoCompleteForm(page)
  // })

  test('should complete demenagement-logement form flow', async ({ visit }) => {
    const simulateurSlug = 'demenagement-logement'
    const page = await visit(`/simulateurs/${simulateurSlug}`, { waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    await autoCompleteForm(page)
  })

  test('should complete entreprise-innovation form flow', async ({ visit }) => {
    const simulateurSlug = 'entreprise-innovation'
    const page = await visit(`/simulateurs/${simulateurSlug}`, { waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    await autoCompleteForm(page)
  })

  test('should persist answers across page navigations', async ({ visit, expect }) => {
    const simulateurSlug = 'comprehensive-test'
    const page = await visit(`/simulateurs/${simulateurSlug}`, { waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    await startSurvey(page)

    const N_PAGES = 3

    // Answer questions and track them
    const initialAnswers = new Map()
    for (let i = 0; i < N_PAGES; i++) {
      await answerAllQuestionsInCurrentPage(page)
      initialAnswers.set(i, await getAllSurveyPageAnswers(page))
      if (i < N_PAGES - 1) { // Don't go to next page on last iteration
        await goToNextSurveyPage(page)
      }
    }

    // Refresh the page
    await page.reload({ waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    // Expect to show the choice to resume the survey
    const resumeButton = page.getByTestId('survey-resume-button')
    expect(resumeButton.isVisible()).toBeTruthy()
    await resumeButton.click()

    // Verify state persistence
    for (let i = N_PAGES; i > 0; i--) {
      const currentAnswers = await getAllSurveyPageAnswers(page)
      expect(currentAnswers).toEqual(initialAnswers.get(i - 1))
      await goToPreviousSurveyPage(page)
    }
  })

  test('should handle link to notion page', async ({ visit }) => {
    const simulateurSlug = 'comprehensive-test'
    const page = await visit(`/simulateurs/${simulateurSlug}`, { waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    await startSurvey(page)

    // Look for help links
    let foundHelpLinks = false
    let attempts = 0

    while (attempts < 5 && !foundHelpLinks) {
      const notionLink = page.getByTestId('survey-question-notion-button')

      if (await notionLink.isVisible()) {
        foundHelpLinks = true
        await notionLink.click({ force: true })
        await page.waitForURL('**/notions/*', { timeout: 1000 })
        await page.goBack()
        await page.waitForURL(`**/simulateurs/${simulateurSlug}`, { timeout: 1000 })
      }
      else {
        await answerAllQuestionsInCurrentPage(page)
        await goToNextSurveyPage(page)
        attempts++
      }
    }
  })

  test('should handle recapitulatif functionality', async ({ visit, expect }) => {
    const simulateurSlug = 'comprehensive-test'
    const page = await visit(`/simulateurs/${simulateurSlug}`, { waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    await startSurvey(page)

    // Answer questions in first page and go to next
    await answerAllQuestionsInCurrentPage(page)
    await goToNextSurveyPage(page)

    // Answer questions in second page
    await answerAllQuestionsInCurrentPage(page)

    // Navigate to recapitulatif page using the navigation button
    const recapButton = page.getByRole('button', { name: /Récapitulatif/ })
    expect(await recapButton.isVisible()).toBeTruthy()
    await recapButton.click()

    // Wait for recapitulatif page to load
    await page.waitForURL(`**/simulateurs/${simulateurSlug}/recapitulatif**`)

    // Verify page structure
    expect(await page.locator('h2').filter({ hasText: 'Récapitulatif des informations' }).isVisible()).toBeTruthy()

    // Verify back link is present
    const backLink = page.getByRole('link', { name: /Revenir à la question en cours/ })
    expect(await backLink.isVisible()).toBeTruthy()

    // Wait for accordions to load and verify they are present
    const accordionsGroup = page.getByTestId('recapitulatif-accordions-group')
    expect(await accordionsGroup.isVisible()).toBeTruthy()

    await page.waitForTimeout(500) // Wait for animations to complete

    // Verify questions are displayed with answers
    const questionRows = page.locator('.question-row')
    expect(await questionRows.count()).toBeGreaterThan(0)

    // Verify at least one question has an answer (check for quoted text which indicates an answer)
    const answeredQuestions = page.locator('.user-answer.fr-hint-text')
    expect(await answeredQuestions.count()).toBeGreaterThan(0)

    // Verify "Question en cours" badge is present for current question
    const currentQuestionBadge = page.locator('.fr-badge').filter({ hasText: 'Question en cours' })
    expect(await currentQuestionBadge.isVisible()).toBeTruthy()

    // Test editing functionality - find modify/respond button
    const modifierButton = page.getByRole('button', { name: /Modifier|Répondre/ }).first()
    expect(await modifierButton.isVisible()).toBeTruthy()

    // Click on modify button
    await modifierButton.click()

    // Should navigate back to the simulator page
    await page.waitForURL(`**/simulateurs/${simulateurSlug}**`, { timeout: 3000 })

    // Verify we're back on the survey form
    await page.waitForTimeout(200) // this is needed to ensure the page is fully loaded
    expect(await page.getByTestId('survey-page').isVisible()).toBeTruthy()

    // Navigate back to recapitulatif to test back link
    await page.getByRole('button', { name: /Récapitulatif/ }).click()
    await page.waitForURL(`**/simulateurs/${simulateurSlug}/recapitulatif**`)

    // Test the back link functionality
    await backLink.click()
    await page.waitForURL(`**/simulateurs/${simulateurSlug}**`, { timeout: 3000 })

    // Verify we're back on the survey form
    await page.waitForTimeout(200) // this is needed to ensure the page is fully loaded
    expect(await page.getByTestId('survey-page').isVisible()).toBeTruthy()
  })
})
