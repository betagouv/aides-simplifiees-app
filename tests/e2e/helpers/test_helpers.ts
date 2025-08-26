import type { Locator, Page } from 'playwright'

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { TestLogger } from '../test_logger.js'

const logger = new TestLogger({ prefix: 'TEST', timestamp: false })

/**
 * Interface for persona test data structure
 */
export interface PersonaTestData {
  name: string
  description: string
  test_data: Record<string, any>
  status: string
}

/**
 * Load personas data from JSON file
 */
export async function loadPersonasData(simulateurSlug: string): Promise<PersonaTestData[]> {
  try {
    const personasFilePath = path.resolve(process.cwd(), 'database', 'data', `personas-${simulateurSlug}.json`)

    if (!fs.existsSync(personasFilePath)) {
      logger.error(`Personas file not found: ${personasFilePath}`)
      return []
    }

    const personasContent = fs.readFileSync(personasFilePath, 'utf-8')
    const personasData: PersonaTestData[] = JSON.parse(personasContent)

    return personasData.filter(persona => persona.status === 'active')
  }
  catch (error) {
    logger.error(`Error loading personas data: ${error}`)
    return []
  }
}

/**
 * Answer a specific question using persona data
 */
export async function answerQuestionWithPersonaData(
  page: Page,
  questionContainer: Locator,
  questionId: string,
  personaData: Record<string, any>,
): Promise<boolean> {
  try {
    const questionValue = personaData[questionId]

    if (questionValue === undefined || questionValue === null) {
      // Fall back to generic answer if no persona data
      logger.info(`No persona data for ${questionId}, using generic answer`)
      return await answerQuestionGeneric(questionContainer)
    }

    // Check question types and handle accordingly
    const radioCount = await questionContainer.locator('input[type="radio"]').count()
    const checkboxCount = await questionContainer.locator('input[type="checkbox"]').count()
    const numberCount = await questionContainer.locator('input[type="number"]').count()
    const dateCount = await questionContainer.locator('input[type="date"]').count()
    const comboboxCount = await questionContainer.getByTestId('combobox').count()
    const textCount = await questionContainer.locator('input[type="text"]').count()

    // Check for the actual Vue combobox implementation patterns
    const comboboxRole = await questionContainer.locator('input[role="combobox"]').count()
    const searchWrapper = await questionContainer.locator('[role="search"]').count()
    const datalistCount = await questionContainer.locator('datalist').count()

    logger.info(`Question ${questionId} element counts: radio=${radioCount}, checkbox=${checkboxCount}, number=${numberCount}, date=${dateCount}, combobox=${comboboxCount}, text=${textCount}`)
    logger.info(`Question ${questionId} combobox patterns: comboboxRole=${comboboxRole}, searchWrapper=${searchWrapper}, datalist=${datalistCount}`)

    // Handle different question types based on persona data
    if (radioCount > 0) {
      logger.info(`Handling ${questionId} as radio question`)
      return await selectRadioOption(questionContainer, questionValue)
    }
    else if (checkboxCount > 0) {
      logger.info(`Handling ${questionId} as checkbox question`)
      return await selectCheckboxOptions(questionContainer, questionValue)
    }
    else if (numberCount > 0) {
      logger.info(`Handling ${questionId} as number question`)
      return await fillNumberInput(questionContainer, questionValue)
    }
    else if (dateCount > 0) {
      logger.info(`Handling ${questionId} as date question`)
      return await fillDateInput(questionContainer, questionValue)
    }
    else if (comboboxCount > 0 || comboboxRole > 0 || searchWrapper > 0 || datalistCount > 0) {
      logger.info(`Handling ${questionId} as combobox question`)
      return await fillCombobox(page, questionContainer, questionValue)
    }
    else if (textCount > 0) {
      logger.info(`Handling ${questionId} as text question`)
      return await fillTextInput(questionContainer, questionValue)
    }

    logger.error(`Unknown question type for ${questionId}`)
    return false
  }
  catch (error) {
    logger.error(`Error answering question ${questionId} with persona data: ${error}`)
    return await answerQuestionGeneric(questionContainer)
  }
}/**
  * Select radio option based on persona value
  */
async function selectRadioOption(questionContainer: Locator, value: any): Promise<boolean> {
  try {
    // First try to find radio input with matching value
    const radioWithValue = questionContainer.locator(`input[type="radio"][value="${value}"]`)
    if (await radioWithValue.count() > 0) {
      const label = radioWithValue.locator('..').locator('label')
      if (await label.count() > 0) {
        await label.click()
        return true
      }
    }

    // If no exact value match, try to find by text content
    const radioLabels = questionContainer.locator('.fr-radio-group label')
    const labelCount = await radioLabels.count()

    for (let i = 0; i < labelCount; i++) {
      const label = radioLabels.nth(i)
      const labelText = await label.textContent()
      if (labelText && labelText.toLowerCase().includes(value.toString().toLowerCase())) {
        await label.click()
        return true
      }
    }

    // Fall back to first option
    const firstLabel = questionContainer.locator('.fr-radio-group label').first()
    if (await firstLabel.count() > 0) {
      await firstLabel.click()
      return true
    }

    return false
  }
  catch {
    return false
  }
}

/**
 * Select checkbox options based on persona value (can be array or single value)
 */
async function selectCheckboxOptions(questionContainer: Locator, value: any): Promise<boolean> {
  try {
    const values = Array.isArray(value) ? value : [value]
    let selectedAny = false

    for (const val of values) {
      // Try to find checkbox with matching value
      const checkboxWithValue = questionContainer.locator(`input[type="checkbox"][value="${val}"]`)
      if (await checkboxWithValue.count() > 0) {
        const label = checkboxWithValue.locator('..').locator('label')
        if (await label.count() > 0) {
          await label.click()
          selectedAny = true
          continue
        }
      }

      // If no exact value match, try to find by text content
      const checkboxLabels = questionContainer.locator('.fr-checkbox-group label')
      const labelCount = await checkboxLabels.count()

      for (let i = 0; i < labelCount; i++) {
        const label = checkboxLabels.nth(i)
        const labelText = await label.textContent()
        if (labelText && labelText.toLowerCase().includes(val.toString().toLowerCase())) {
          await label.click()
          selectedAny = true
          break
        }
      }
    }

    // If no matches found, select first checkbox
    if (!selectedAny) {
      const firstLabel = questionContainer.locator('.fr-checkbox-group label').first()
      if (await firstLabel.count() > 0) {
        await firstLabel.click()
        return true
      }
    }

    return selectedAny
  }
  catch {
    return false
  }
}

/**
 * Fill number input with persona value
 */
async function fillNumberInput(questionContainer: Locator, value: any): Promise<boolean> {
  try {
    const numberInput = questionContainer.locator('input[type="number"]').first()
    await numberInput.fill(value.toString())
    return true
  }
  catch {
    return false
  }
}

/**
 * Fill date input with persona value
 */
async function fillDateInput(questionContainer: Locator, value: any): Promise<boolean> {
  try {
    const dateInput = questionContainer.locator('input[type="date"]').first()
    // Ensure date is in YYYY-MM-DD format
    const dateValue = value.toString()
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      await dateInput.fill(dateValue)
      return true
    }
    return false
  }
  catch {
    return false
  }
}

/**
 * Fill combobox with persona value
 */
async function fillCombobox(page: Page, questionContainer: Locator, value: any): Promise<boolean> {
  try {
    // Handle JSON-like value format: {"value":"75101","text":"75001 - Paris 1er Arrondissement"}
    let searchValue = value
    let selectValue = value

    if (typeof value === 'object' && value.text && value.value) {
      searchValue = value.text
      selectValue = value.value
    }
    else if (typeof value === 'string' && value.startsWith('{')) {
      try {
        const parsed = JSON.parse(value)
        searchValue = parsed.text || parsed.value
        selectValue = parsed.value
      }
      catch {
        searchValue = value
        selectValue = value
      }
    }

    logger.info(`Combobox: searching for "${searchValue}", selecting "${selectValue}"`)

    // The Vue component uses DsfrInput with role="combobox"
    const textInput = questionContainer.locator('input[role="combobox"]').first()
    await textInput.fill(searchValue.toString())

    // Click the search button to trigger the autocomplete API call
    const searchButton = questionContainer.locator('button[title="Rechercher"]').first()
    await searchButton.click()

    // Wait for the API call to complete and datalist to be populated
    await page.waitForTimeout(2000)

    // Check if the datalist has been populated with options
    const datalist = questionContainer.locator('datalist').first()
    const optionCount = await datalist.locator('option').count()
    logger.info(`Found ${optionCount} options in datalist after search`)

    if (optionCount > 0) {
      // Try to find an option that matches our desired text or value
      const options = datalist.locator('option')
      let foundMatch = false

      for (let i = 0; i < optionCount; i++) {
        const option = options.nth(i)
        const optionValue = await option.getAttribute('value')
        const optionLabel = await option.getAttribute('label')

        // Check if this option matches what we're looking for
        const matchesText = optionValue === searchValue.toString() || optionLabel === searchValue.toString()
        const matchesPartial = optionValue?.includes(searchValue.toString()) || optionLabel?.includes(searchValue.toString())

        if (matchesText || (i === 0 && matchesPartial)) {
          // Set the input value to match the option exactly
          const valueToSet = optionValue || optionLabel || ''
          await textInput.fill(valueToSet)

          // Trigger the input event to let Vue know the value changed
          await textInput.dispatchEvent('input')

          // Wait a moment for Vue to process the change
          await page.waitForTimeout(500)

          foundMatch = true
          logger.info(`Successfully selected combobox option: "${valueToSet}"`)
          break
        }
      }

      if (!foundMatch) {
        // Fall back to first option if no exact match
        const firstOption = options.first()
        const firstValue = await firstOption.getAttribute('value')
        const firstLabel = await firstOption.getAttribute('label')
        const valueToSet = firstValue || firstLabel || ''

        await textInput.fill(valueToSet)
        await textInput.dispatchEvent('input')
        await page.waitForTimeout(500)

        logger.info(`Selected first combobox option as fallback: "${valueToSet}"`)
        foundMatch = true
      }

      return foundMatch
    }
    else {
      logger.error(`No options found in datalist after search`)
      return false
    }
  }
  catch (error) {
    logger.error(`Error filling combobox: ${error}`)
    return false
  }
}/**
  * Fill text input with persona value
  */
async function fillTextInput(questionContainer: Locator, value: any): Promise<boolean> {
  try {
    const textInput = questionContainer.locator('input[type="text"]').first()
    await textInput.fill(value.toString())
    return true
  }
  catch {
    return false
  }
}

/**
 * Generic answer function (fallback)
 */
async function answerQuestionGeneric(questionContainer: Locator): Promise<boolean> {
  try {
    if (await questionContainer.locator('input[type="radio"]').count() > 0) {
      const radioLabel = questionContainer.locator('.fr-radio-group label').first()
      await radioLabel.click()
    }
    else if (await questionContainer.locator('input[type="checkbox"]').count() > 0) {
      const checkboxLabel = questionContainer.locator('.fr-checkbox-group label').first()
      await checkboxLabel.click()
    }
    else if (await questionContainer.locator('input[type="number"]').count() > 0) {
      const numberInput = questionContainer.locator('input[type="number"]').first()
      await numberInput.fill('1000')
    }
    else if (await questionContainer.locator('input[type="date"]').count() > 0) {
      const dateInput = questionContainer.locator('input[type="date"]').first()
      await dateInput.fill('1980-01-01')
    }
    else if (await questionContainer.locator('input[type="text"]').count() > 0) {
      const textInput = questionContainer.locator('input[type="text"]').first()
      await textInput.fill('Test response')
    }
    return true
  }
  catch {
    return false
  }
}

/**
 * Answer all questions in current page using persona data
 */
export async function answerAllQuestionsWithPersonaData(
  page: Page,
  personaData: Record<string, any>,
): Promise<boolean> {
  try {
    await page.getByTestId('survey-page').waitFor({ state: 'visible' })

    const surveyQuestions = page.getByTestId('survey-question')
    const questionCount = await surveyQuestions.count()

    logger.info(`Found ${questionCount} questions on current page`)

    if (questionCount === 0) {
      return false
    }

    for (let i = 0; i < questionCount; i++) {
      const questionContainer = surveyQuestions.nth(i)
      const questionId = await questionContainer.getAttribute('data-question-id')

      logger.info(`Processing question ${i + 1}/${questionCount}, ID: ${questionId}`)

      if (questionId) {
        const hasPersonaData = personaData[questionId] !== undefined
        logger.info(`Question ${questionId}: has persona data = ${hasPersonaData}, value = ${JSON.stringify(personaData[questionId])}`)
        await answerQuestionWithPersonaData(page, questionContainer, questionId, personaData)
      }
      else {
        logger.info(`Question ${i + 1} has no ID, using generic answer`)
        await answerQuestionGeneric(questionContainer)
      }
    }

    return true
  }
  catch (error) {
    logger.error(`Error answering questions with persona data: ${error}`)
    return false
  }
}

/**
 * Complete form using persona data
 */
export async function autoCompleteFormWithPersona(
  page: Page,
  personaData: Record<string, any>,
  personaName: string = 'Unknown Persona',
): Promise<boolean> {
  try {
    logger.info(`Starting form completion with persona: ${personaName}`)
    await startSurvey(page)

    let questionCount = 0
    const maxQuestions = 20

    while (questionCount < maxQuestions) {
      logger.info(`Checking for questions (iteration ${questionCount + 1}/${maxQuestions})`)

      if (!await waitForSurveyQuestion(page)) {
        logger.info(`No more questions found`)
        // Check if we've reached results
        if (await isOnResultsPage(page)) {
          logger.info(`Successfully completed form with persona: ${personaName}`)
          return true
        }

        break
      }

      await answerAllQuestionsWithPersonaData(page, personaData)

      logger.info(`Attempting to go to next page`)
      if (!await goToNextSurveyPage(page)) {
        logger.info(`Failed to go to next page or reached end`)
        break
      }

      questionCount++
    }

    const success = await isOnResultsPage(page)
    if (success) {
      logger.info(`Successfully completed form with persona: ${personaName}`)
    }
    else {
      logger.error(`Failed to complete form with persona: ${personaName}. Current URL: ${page.url()}`)
    }

    return success
  }
  catch (error) {
    logger.error(`Error completing form with persona ${personaName}: ${error}`)
    return false
  }
} export async function startSurvey(page: Page): Promise<void> {
  const startButton = page.getByTestId('survey-start-button')
  // Wait for the start button to be visible
  await startButton.waitFor({ state: 'visible' })
  // Click the start button to begin the survey
  await startButton.click()
  await page.getByTestId('survey-page-container').waitFor({ state: 'visible' })
}

export async function waitForSurveyQuestion(page: Page): Promise<boolean> {
  try {
    await page.getByTestId('survey-question').waitFor({ state: 'visible', timeout: 200 })
    return true
  }
  catch {
    return false
  }
}

export async function isOnResultsPage(page: Page): Promise<boolean> {
  try {
    await page.waitForURL('**/resultats/**', { timeout: 4000 })
    return true
  }
  catch {
    return false
  }
}

/**
 * Answer a question based on its type - helper for test automation
 */
export async function answerQuestion(page: Page): Promise<boolean> {
  try {
    // Determine question type and answer accordingly
    if (await page.locator('input[type="radio"]').count() > 0) {
      /**
       * We click on the label instead of directly checking the input to match DSFR implementation
       */
      const radioLabel = page.locator('.fr-radio-group label').first()
      await radioLabel.scrollIntoViewIfNeeded()
      await radioLabel.click()
    }
    else if (await page.locator('input[type="checkbox"]').count() > 0) {
      /**
       * We click on the label instead of directly checking the input to match DSFR implementation
       */
      const checkboxLabel = page.locator('.fr-checkbox-group label').first()
      await checkboxLabel.scrollIntoViewIfNeeded()
      await checkboxLabel.click()
    }
    else if (await page.locator('input[type="number"]').count() > 0) {
      // Wait to ensure field is ready
      await page.waitForSelector('input[type="number"]', { state: 'visible' })
      await page.locator('input[type="number"]').scrollIntoViewIfNeeded()
      await page.locator('input[type="number"]').fill('1000')
    }
    else if (await page.locator('input[type="date"]').count() > 0) {
      // Wait to ensure field is ready
      await page.waitForSelector('input[type="date"]', { state: 'visible' })
      await page.locator('input[type="date"]').scrollIntoViewIfNeeded()
      await page.locator('input[type="date"]').fill('1980-01-01')
    }
    else if (await page.getByTestId('combobox').count() > 0) {
      // Fill the text field to trigger autocomplete
      const textInput = page.locator('[role="combobox"] input[type="search"]').first()
      await textInput.fill('Paris')

      // click on the search button
      const searchButton = page.locator('[role="combobox"] [role="searchbox"] button').first()
      await searchButton.click()

      // Wait for suggestions to appear
      await page.waitForSelector('[role="listbox"]', { state: 'visible' })
      const listBoxSelect = page.locator('[role="listbox"] select').first()

      // Select the first suggestion
      await listBoxSelect.selectOption('12345')
    }
    else if (await page.locator('input[type="text"]').count() > 0) {
      // Regular text field
      await page.waitForSelector('input[type="text"]', { state: 'visible' })
      await page.locator('input[type="text"]').scrollIntoViewIfNeeded()
      await page.locator('input[type="text"]').fill('Test response')
    }

    return false
  }
  catch {
    return false
  }
}

export async function answerAllQuestionsInCurrentPage(page: Page): Promise<boolean> {
  try {
    // Wait for the survey page to be visible
    await page.getByTestId('survey-page').waitFor({ state: 'visible' })

    // Get all survey questions in the current page
    const surveyQuestions = page.getByTestId('survey-question')
    const questionCount = await surveyQuestions.count()

    if (questionCount === 0) {
      return false
    }

    // Answer each question sequentially
    for (let i = 0; i < questionCount; i++) {
      const questionContainer = surveyQuestions.nth(i)

      // Determine question type and answer accordingly within this specific question container
      if (await questionContainer.locator('input[type="radio"]').count() > 0) {
        const radioLabel = questionContainer.locator('.fr-radio-group label').first()
        await radioLabel.click()
      }
      else if (await questionContainer.locator('input[type="checkbox"]').count() > 0) {
        const checkboxLabel = questionContainer.locator('.fr-checkbox-group label').first()
        await checkboxLabel.click()
      }
      else if (await questionContainer.locator('input[type="number"]').count() > 0) {
        const numberInput = questionContainer.locator('input[type="number"]').first()
        await numberInput.fill('1000')
      }
      else if (await questionContainer.locator('input[type="date"]').count() > 0) {
        const dateInput = questionContainer.locator('input[type="date"]').first()
        await dateInput.fill('1980-01-01')
      }
      else if (await questionContainer.getByTestId('combobox').count() > 0) {
        // Fill the text field to trigger autocomplete
        const textInput = questionContainer.locator('[role="combobox"] input[type="search"]').first()
        await textInput.fill('Paris')

        // click on the search button
        const searchButton = questionContainer.locator('[role="combobox"] [role="searchbox"] button').first()
        await searchButton.click()

        // Wait for suggestions to appear
        await page.waitForSelector('[role="listbox"]', { state: 'visible' })
        const listBoxSelect = page.locator('[role="listbox"] select').first()

        // Select the first suggestion
        await listBoxSelect.selectOption('12345')
      }
      else if (await questionContainer.locator('input[type="text"]').count() > 0) {
        const textInput = questionContainer.locator('input[type="text"]').first()
        await textInput.fill('Test response')
      }
    }

    return true
  }
  catch (error) {
    logger.error(`Error answering questions in current page: ${error}`)
    return false
  }
}

export async function getAllSurveyPageAnswers(page: Page): Promise<Record<string, string | null>> {
  const answers: Record<string, string | null> = {}
  const surveyQuestions = page.getByTestId('survey-question')
  const questionCount = await surveyQuestions.count()
  for (let i = 0; i < questionCount; i++) {
    const questionContainer = surveyQuestions.nth(i)
    const questionId = await questionContainer.getAttribute('data-question-id')
    if (!questionId) {
      continue // Skip if no question ID found
    }
    // Check for radio inputs
    const radioInput = questionContainer.locator('input[type="radio"]:checked')
    if (await radioInput.count() > 0) {
      const label = await radioInput.evaluate((el) => {
        const labelElement = el.closest('label')
        return labelElement ? labelElement.textContent?.trim() : ''
      })
      answers[questionId] = label || null
      continue
    }
    // Check for checkbox inputs
    const checkboxInput = questionContainer.locator('input[type="checkbox"]:checked')
    if (await checkboxInput.count() > 0) {
      const label = await checkboxInput.evaluate((el) => {
        const labelElement = el.closest('label')
        return labelElement ? labelElement.textContent?.trim() : ''
      })
      answers[questionId] = label || null
      continue
    }
    // Check for number inputs
    const numberInput = questionContainer.locator('input[type="number"]')
    if (await numberInput.count() > 0) {
      const value = await numberInput.inputValue()
      answers[questionId] = value || null
      continue
    }
    // Check for date inputs
    const dateInput = questionContainer.locator('input[type="date"]')
    if (await dateInput.count() > 0) {
      const value = await dateInput.inputValue()
      answers[questionId] = value || null
      continue
    }
    // Check for combobox inputs
    const comboboxInput = questionContainer.getByTestId('combobox')
    if (await comboboxInput.count() > 0) {
      const listBox = comboboxInput.locator('[role="listbox"]')
      if (await listBox.count() > 0) {
        const selectedOption = await listBox.evaluate((el) => {
          const selected = el.querySelector('[aria-selected="true"]')
          return selected ? selected.textContent?.trim() : null
        })
        if (selectedOption) {
          answers[questionId] = selectedOption || null
          continue
        }
      }
    }
    // Check for text inputs
    const textInput = questionContainer.locator('input[type="text"]')
    if (await textInput.count() > 0) {
      const value = await textInput.inputValue()
      answers[questionId] = value || null
      continue
    }
    // If no known input type found, log a warning
    logger.warn(`No known input type found for question ID: ${questionId}`)
  }
  return answers
}

export async function goToNextSurveyPage(page: Page): Promise<boolean> {
  try {
    // Click next button to proceed to next question or results page
    const nextButton = page.getByRole('button', { name: /Suivant|Continuer|Terminer/ })
    // await nextButton.scrollIntoViewIfNeeded()
    // Make sure the button is visible and enabled
    await nextButton.waitFor({ state: 'visible' })
    // await nextButton.scrollIntoViewIfNeeded()
    if (!(await nextButton.isEnabled())) {
      throw new Error('Next button is not enabled')
    }
    await nextButton.click({ force: true })
    return true
  }
  catch {
    return false
  }
}

export async function goToPreviousSurveyPage(page: Page): Promise<boolean> {
  try {
    // Click previous button to go back to the previous question
    const previousButton = page.getByRole('button', { name: /Précédent|Retour/ })
    // Make sure the button is visible and enabled
    await previousButton.waitFor({ state: 'visible' })
    if (!(await previousButton.isEnabled())) {
      throw new Error('Previous button is not enabled')
    }
    await previousButton.click({ force: true })
    return true
  }
  catch {
    return false
  }
}

export async function autoCompleteForm(page: Page): Promise<boolean> {
  try {
    await startSurvey(page)

    let questionCount = 0
    const maxQuestions = 20

    while (questionCount < maxQuestions) {
      if (!await waitForSurveyQuestion(page)) {
        // Check if we've reached results
        if (await isOnResultsPage(page)) {
          return true
        }
        break
      }

      // await answerQuestion(page)
      await answerAllQuestionsInCurrentPage(page)

      if (!await goToNextSurveyPage(page)) {
        break
      }

      questionCount++
    }

    return await isOnResultsPage(page)
  }
  catch {
    return false
  }
}

/**
 * Check if an element has focus
 */
export async function isFocused(locator: Locator): Promise<boolean> {
  try {
    const page = locator.page()
    const focusedElement = page.locator(':focus')
    const locatorHandle = await locator.elementHandle()
    const focusedHandle = await focusedElement.elementHandle()

    if (!locatorHandle || !focusedHandle) {
      return false
    }

    return await page.evaluate(
      ([target, focused]) => target === focused,
      [locatorHandle, focusedHandle],
    )
  }
  catch {
    return false
  }
}

/**
 * Check if an element or its children have focus
 */
export async function hasFocusWithin(locator: Locator): Promise<boolean> {
  try {
    const page = locator.page()
    const element = await locator.elementHandle()

    if (!element) {
      return false
    }

    return await page.evaluate((el) => {
      return el.contains(document.activeElement)
    }, element)
  }
  catch {
    return false
  }
}

/**
 * Setup API mocks for consistent testing
 */
export async function setupApiMocks(page: Page, simulateurSlug: string): Promise<void> {
  if (simulateurSlug === 'demenagement-logement') {
  // Mock OpenFisca calculations
    await page.route('**/calculate', async (route) => {
    // Mock OpenFisca calculation response
      const mockResponse = {
        individus: {
          usager: {
            activite: {
              '2025-03': 'etudiant',
            },
            stagiaire: {
              '2025-03': 'stage',
            },
            sortie_academie: {
              '2025-03': true,
            },
            boursier: {
              '2025-03': true,
            },
            date_naissance: {
              ETERNITY: '1980-12-13',
            },
            handicap: {
              '2025-03': true,
            },
            statut_marital: {
              '2025-03': 'celibataire',
            },
            salaire_imposable: {
              'month:2024-03:12': 100,
            },
            locapass_eligibilite: {
              '2025-03': null,
            },
            aide_mobilite_master: {
              '2025-03': null,
            },
            aide_mobilite_parcoursup: {
              '2025-03': null,
            },
            nationalite: {
              '2025-03': 'FR',
            },
            annee_etude: {
              '2025-03': 'terminale',
            },
          },
        },
        menages: {
          menage_usager: {
            personne_de_reference: [
              'usager',
            ],
            conjoint: [],
            enfants: [],
            depcom: {
              '2025-03': '81202',
            },
            statut_occupation_logement: {
              '2025-03': 'locataire_vide',
            },
            logement_conventionne: {
              '2025-03': false,
            },
            coloc: {
              '2025-03': false,
            },
            loyer: {
              '2025-03': 100,
            },
            charges_locatives: {
              '2025-03': 100,
            },
            visale_eligibilite: {
              '2025-03': null,
            },
            visale_montant_max: {
              '2025-03': null,
            },
            date_entree_logement: {
              '2025-03': '2025-04',
            },
          },
        },
        foyers_fiscaux: {
          foyer_fiscal_usager: {
            declarants: [
              'usager',
            ],
            personnes_a_charge: [],
          },
        },
        familles: {
          famille_usager: {
            parents: [
              'usager',
            ],
            enfants: [],
            proprietaire_proche_famille: {
              '2025-03': true,
            },
            bourse_lycee: {
              '2025-03': 1,
            },
            apl: {
              '2025-03': null,
            },
          },
        },
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse),
      })
    })
  }
  if (
    simulateurSlug === 'demenagement-logement'
    || simulateurSlug === 'comprehensive-test'
  ) {
    // Mock commune autocomplete API
    await page.route('**/api/autocomplete/communes**', async (route) => {
    // Mock response for communes autocomplete
      const mockSuggestions = {
        suggestions: [
          {
            code: '12345',
            libelle: 'Paris',
            distributions_postales: [
              { code_postal: '75000' },
            ],
          },
          {
            code: '67890',
            libelle: 'Lyon',
            distributions_postales: [
              { code_postal: '69000' },
            ],
          },
        ],
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSuggestions),
      })
    })
  }

  const MOCK_SECURE_HASH = 'mock-hash'
  // Mock autocomplete APIs
  await page.route('**/api/form-submissions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        secureHash: MOCK_SECURE_HASH,
      }),
    })
  })
}

/**
 * Basic accessibility checks using common patterns
 */
export async function checkBasicAccessibility(page: Page): Promise<{ passed: boolean, issues: string[] }> {
  const issues: string[] = []

  try {
    // Check for basic landmarks
    const main = page.locator('main, [role="main"]')
    if (await main.count() === 0) {
      issues.push('No main landmark found')
    }

    // Check heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    if (await headings.count() === 0) {
      issues.push('No headings found')
    }

    // Check form labels
    const inputs = page.locator('input:not([type="hidden"]), select, textarea')
    const inputCount = await inputs.count()

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledby = await input.getAttribute('aria-labelledby')

      if (id) {
        const label = page.locator(`label[for="${id}"]`)
        const hasLabel = await label.count() > 0

        if (!hasLabel && !ariaLabel && !ariaLabelledby) {
          issues.push(`Input at index ${i} has no accessible label`)
        }
      }
    }

    // Check for focus indicators
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    if (await focusedElement.count() === 0) {
      issues.push('No keyboard focus visible')
    }

    return {
      passed: issues.length === 0,
      issues,
    }
  }
  catch (error) {
    issues.push(`Accessibility check failed: ${error}`)
    return {
      passed: false,
      issues,
    }
  }
}

/**
 * Generate test data based on simulateur type
 */
export function generateTestData(simulateurSlug: string) {
  const baseData = {
    age: 25,
    city: 'Paris',
    income: 2000,
    hasJob: true,
  }

  switch (simulateurSlug) {
    case 'comprehensive-test':
      return {
        ...baseData,
        familySize: 2,
        housingType: 'rent',
        disabilities: false,
      }
    case 'demenagement-logement':
      return {
        ...baseData,
        currentCity: 'Lyon',
        targetCity: 'Paris',
        moveDate: '2024-06-01',
        housingBudget: 1200,
      }
    case 'entreprise-innovation':
      return {
        ...baseData,
        companySize: 'pme',
        sector: 'technology',
        rdBudget: 50000,
      }
    default:
      return baseData
  }
}
