import { test } from '@japa/runner'
import {
  answerAllQuestionsInCurrentPage,
  goToNextSurveyPage,
  setupApiMocks,
  startSurvey,
} from './helpers/test_helpers.js'

test.group('Survey resume and restart functionality', () => {
  test('should display resume choice screen when returning with existing answers', async ({
    expect,
    visit,
  }) => {
    const simulateurSlug = 'comprehensive-test'
    const page = await visit(`/simulateurs/${simulateurSlug}`, { waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    // Start survey and answer some questions
    await startSurvey(page)
    await answerAllQuestionsInCurrentPage(page)
    await goToNextSurveyPage(page)

    // Refresh the page to simulate returning to the survey
    await page.reload({ waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    // Should show the choice screen with resume and restart buttons
    const choiceScreen = page.locator('.fr-card').filter({
      hasText: 'Vous avez déjà commencé une simulation',
    })
    expect(await choiceScreen.isVisible()).toBeTruthy()

    // Verify progress badge is displayed
    const progressBadge = page.locator('.fr-badge').filter({ hasText: /Progression : \d+%/ })
    expect(await progressBadge.isVisible()).toBeTruthy()

    // Verify both buttons are present
    const resumeButton = page.getByTestId('survey-resume-button')
    const restartButton = page.getByTestId('survey-restart-button')
    expect(await resumeButton.isVisible()).toBeTruthy()
    expect(await restartButton.isVisible()).toBeTruthy()

    // Verify the question text is displayed
    const questionText = page.locator('p').filter({
      hasText: 'Souhaitez-vous reprendre votre simulation ou la recommencer ?',
    })
    expect(await questionText.isVisible()).toBeTruthy()
  })

  test('should resume survey from last position when clicking resume button', async ({
    expect,
    visit,
  }) => {
    const simulateurSlug = 'comprehensive-test'
    const page = await visit(`/simulateurs/${simulateurSlug}`, { waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    // Start survey and answer questions on multiple pages
    await startSurvey(page)
    await answerAllQuestionsInCurrentPage(page)
    await goToNextSurveyPage(page)
    await answerAllQuestionsInCurrentPage(page)

    // Refresh the page
    await page.reload({ waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    // Click resume button
    const resumeButton = page.getByTestId('survey-resume-button')
    await resumeButton.click()

    // Should be on the survey form (not welcome screen)
    const surveyPage = page.getByTestId('survey-page')
    expect(await surveyPage.isVisible()).toBeTruthy()

    // Should not show welcome screen
    const welcomeScreen = page.getByTestId('survey-welcome-title')
    expect(await welcomeScreen.isVisible()).toBeFalsy()

    // Should not show choice screen anymore
    const choiceScreen = page.locator('.fr-card').filter({
      hasText: 'Vous avez déjà commencé une simulation',
    })
    expect(await choiceScreen.isVisible()).toBeFalsy()
  })

  test('should restart survey from beginning when clicking restart button', async ({
    expect,
    visit,
  }) => {
    const simulateurSlug = 'comprehensive-test'
    const page = await visit(`/simulateurs/${simulateurSlug}`, { waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    // Start survey and answer questions
    await startSurvey(page)
    await answerAllQuestionsInCurrentPage(page)
    await goToNextSurveyPage(page)

    // Refresh the page
    await page.reload({ waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    // Click restart button
    const restartButton = page.getByTestId('survey-restart-button')
    await restartButton.click()

    // Should show welcome screen
    const welcomeScreen = page.getByTestId('survey-welcome-title')
    expect(await welcomeScreen.isVisible()).toBeTruthy()

    // Should not show choice screen
    const choiceScreen = page.locator('.fr-card').filter({
      hasText: 'Vous avez déjà commencé une simulation',
    })
    expect(await choiceScreen.isVisible()).toBeFalsy()

    // Should not show survey form yet
    const surveyPage = page.getByTestId('survey-page')
    expect(await surveyPage.isVisible()).toBeFalsy()
  })

  test('should NOT show resume choice when survey schema version is incremented', async ({
    expect,
    browser,
  }) => {
    const simulateurSlug = 'comprehensive-test'

    // First visit: answer some questions in a new context
    const context1 = await browser.newContext()
    let page = await context1.newPage()
    await page.goto(`http://localhost:3333/simulateurs/${simulateurSlug}`, {
      waitUntil: 'networkidle',
    })
    await setupApiMocks(page, simulateurSlug)
    await startSurvey(page)
    await answerAllQuestionsInCurrentPage(page)
    await goToNextSurveyPage(page)
    await answerAllQuestionsInCurrentPage(page)

    // Wait for Pinia to persist data to localStorage
    await page.waitForTimeout(500)

    // Get stored localStorage data
    const storedData = await page.evaluate(() => localStorage.getItem('surveys'))

    // Debug: log the stored data
    if (!storedData) {
      console.error('No data found in localStorage after answering questions')
      // Try to see what's actually in localStorage
      const allKeys = await page.evaluate(() => Object.keys(localStorage))
      console.error('Available localStorage keys:', allKeys)
    }

    // Close first context
    await context1.close()

    // Only proceed if we have stored data
    if (!storedData) {
      throw new Error('No stored data found in localStorage')
    }

    // Create new context and restore localStorage with incremented version
    const context2 = await browser.newContext()
    page = await context2.newPage()

    // Setup route BEFORE navigating to the page
    await page.route('**/forms/comprehensive-test.json', async (route) => {
      const response = await route.fetch()
      const json = await response.json()

      // Increment version
      const versionParts = json.version.split('.')
      versionParts[2] = String(Number(versionParts[2]) + 1)
      json.version = versionParts.join('.')

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(json),
      })
    })

    // Restore previous answers in localStorage
    await page.addInitScript((data: string) => {
      localStorage.setItem('surveys', data)
    }, storedData as string)

    await page.goto(`http://localhost:3333/simulateurs/${simulateurSlug}`, {
      waitUntil: 'networkidle',
    })
    await setupApiMocks(page, simulateurSlug)

    // Wait for schema to load
    await page.waitForTimeout(1500)

    // Should show welcome screen (not choice screen) because version changed
    const welcomeScreen = page.getByTestId('survey-welcome-title')
    expect(await welcomeScreen.isVisible()).toBeTruthy()

    // Should NOT show choice screen
    const choiceScreen = page.locator('.fr-card').filter({
      hasText: 'Vous avez déjà commencé une simulation',
    })
    expect(await choiceScreen.isVisible()).toBeFalsy()

    // Should NOT show survey form yet
    const surveyPage = page.getByTestId('survey-page')
    expect(await surveyPage.isVisible()).toBeFalsy()

    // Verify progress is 0%
    const answersInStore = await page.evaluate(() => {
      const surveysStore = localStorage.getItem('surveys')
      if (surveysStore) {
        const parsed = JSON.parse(surveysStore)
        return parsed.answers?.['comprehensive-test']
      }
      return null
    })

    // Answers should be empty (reset)
    expect(answersInStore).toEqual({})

    // Cleanup
    await context2.close()
  })

  test('should NOT show resume choice when survey has forceRefresh flag', async ({
    expect,
    browser,
  }) => {
    const simulateurSlug = 'comprehensive-test'

    // First visit: answer some questions in a new context
    const context1 = await browser.newContext()
    let page = await context1.newPage()
    await page.goto(`http://localhost:3333/simulateurs/${simulateurSlug}`, {
      waitUntil: 'networkidle',
    })
    await setupApiMocks(page, simulateurSlug)
    await startSurvey(page)
    await answerAllQuestionsInCurrentPage(page)
    await goToNextSurveyPage(page)

    // Wait for Pinia to persist data to localStorage
    await page.waitForTimeout(500)

    // Get stored localStorage data
    const storedData = await page.evaluate(() => localStorage.getItem('surveys'))

    // Debug: log the stored data
    if (!storedData) {
      console.error('No data found in localStorage after answering questions')
      // Try to see what's actually in localStorage
      const allKeys = await page.evaluate(() => Object.keys(localStorage))
      console.error('Available localStorage keys:', allKeys)
    }

    // Close first context
    await context1.close()

    // Only proceed if we have stored data
    if (!storedData) {
      throw new Error('No stored data found in localStorage')
    }

    // Create new context with forceRefresh
    const context2 = await browser.newContext()
    page = await context2.newPage()

    // Setup route BEFORE navigating to the page
    await page.route('**/forms/comprehensive-test.json', async (route) => {
      const response = await route.fetch()
      const json = await response.json()
      json.forceRefresh = true

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(json),
      })
    })

    // Restore previous answers in localStorage
    await page.addInitScript((data: string) => {
      localStorage.setItem('surveys', data)
    }, storedData as string)

    await page.goto(`http://localhost:3333/simulateurs/${simulateurSlug}`, {
      waitUntil: 'networkidle',
    })
    await setupApiMocks(page, simulateurSlug)

    // Wait for schema to load
    await page.waitForTimeout(1500)

    // Should show welcome screen because forceRefresh is true
    const welcomeScreen = page.getByTestId('survey-welcome-title')
    expect(await welcomeScreen.isVisible()).toBeTruthy()

    // Should NOT show choice screen
    const choiceScreen = page.locator('.fr-card').filter({
      hasText: 'Vous avez déjà commencé une simulation',
    })
    expect(await choiceScreen.isVisible()).toBeFalsy()

    // Cleanup
    await context2.close()
  })

  test('should show welcome screen on first visit (no existing answers)', async ({
    expect,
    visit,
  }) => {
    const simulateurSlug = 'demenagement-logement'
    const page = await visit(`/simulateurs/${simulateurSlug}`, { waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    // Clear localStorage to ensure fresh state
    await page.evaluate(() => {
      localStorage.removeItem('pinia:surveys')
    })

    // Reload to apply cleared state
    await page.reload({ waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    // Should show welcome screen
    const welcomeScreen = page.getByTestId('survey-welcome-title')
    expect(await welcomeScreen.isVisible()).toBeTruthy()

    // Should NOT show choice screen
    const choiceScreen = page.locator('.fr-card').filter({
      hasText: 'Vous avez déjà commencé une simulation',
    })
    expect(await choiceScreen.isVisible()).toBeFalsy()

    // Should NOT show survey form yet
    const surveyPage = page.getByTestId('survey-page')
    expect(await surveyPage.isVisible()).toBeFalsy()

    // Start button should be visible
    const startButton = page.getByTestId('survey-start-button')
    expect(await startButton.isVisible()).toBeTruthy()
  })

  test('should preserve progress percentage when showing choice screen', async ({
    expect,
    visit,
  }) => {
    const simulateurSlug = 'comprehensive-test'
    const page = await visit(`/simulateurs/${simulateurSlug}`, { waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    // Start survey and answer questions to reach ~50% progress
    await startSurvey(page)
    await answerAllQuestionsInCurrentPage(page)
    await goToNextSurveyPage(page)
    await answerAllQuestionsInCurrentPage(page)

    // Refresh the page
    await page.reload({ waitUntil: 'networkidle' })
    await setupApiMocks(page, simulateurSlug)

    // Verify progress badge shows a percentage > 0
    const progressBadge = page.locator('.fr-badge').filter({ hasText: /Progression : \d+%/ })
    expect(await progressBadge.isVisible()).toBeTruthy()

    const progressText = await progressBadge.textContent()
    const progressMatch = progressText?.match(/(\d+)%/)
    const progressValue = progressMatch ? Number.parseInt(progressMatch[1], 10) : 0

    // Progress should be greater than 0% but less than 100%
    expect(progressValue).toBeGreaterThan(0)
    expect(progressValue).toBeLessThan(100)
  })
})
