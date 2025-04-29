import { test } from '@japa/runner'

test.group('Subsidy simulator form', () => {
  const simulateurId = 'demenagement-logement'

  /**
   * Scénario 4.1 : Affichage d'un formulaire de simulation
   */
  test('should display welcome screen and start a new simulation', async ({ expect, visit }) => {
    const page = await visit(`/simulateurs/${simulateurId}`, { waitUntil: 'networkidle' })
    await page.waitForSelector('#simulateur-title', { state: 'visible' })
    // Check if welcome screen is visible
    expect(await page.getByText('Un simulateur en cours d\'amélioration').isVisible()).toBe(true)

    // Click the start button
    await page.getByRole('button', { name: 'Commencer la simulation' }).click()

    // Verify the first question is displayed
    expect(await page.getByTestId('question-container').isVisible()).toBe(true)
  })

  /**
   * Scénario 4.2 : Completion d'un formulaire jusqu'à la page de résultats avec mock de l'API
   */
  test('should complete the form and reach results page with mocked API', async ({ expect, visit }) => {
    const page = await visit(`/simulateurs/${simulateurId}`, { waitUntil: 'networkidle' })
    // Setup API interception before starting the simulation
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

    // Mock store-form-data API
    await page.route('**/api/store-form-data', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          filename: 'test-mock-filename.json',
        }),
      })
    })

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

    // Start the simulation
    await page.getByRole('button', { name: 'Commencer la simulation' }).click()

    // Function to answer the current question based on its type
    async function answerCurrentQuestion() {
      // Wait for question container to be visible
      await page.waitForSelector('[data-testid="question-container"]', { state: 'visible' })

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

      // Click next button to proceed to next question or results page
      const nextButton = page.getByRole('button', { name: /Suivant|Terminer/ })
      await nextButton.scrollIntoViewIfNeeded()
      // Make sure the button is visible and enabled
      expect(await nextButton.isVisible()).toBe(true)
      expect(await nextButton.isEnabled()).toBe(true)
      await nextButton.click({ force: true })
    }

    // Track the maximum number of questions to prevent infinite loops
    const maxQuestions = 30
    let questionCount = 0
    let isCompleted = false

    while (!isCompleted && questionCount < maxQuestions) {
      try {
        await answerCurrentQuestion()
        // await page.screenshot({ path: `./tests/e2e/screenshots/question-${questionCount}.png` })
        // await page.waitForTimeout(500)
        questionCount++
        if (questionCount >= maxQuestions) {
          await page.screenshot({ path: './tests/e2e/screenshots/max-questions-reached.png' })
          throw new Error('Exceeded maximum question count')
        }

        // Check if we've been redirected to results page
        if (page.url().includes('/resultats')) {
          isCompleted = true
          break
        }

        // Check if there's a loading state that indicates form submission
        const isLoading = await page.getByText('Estimation en cours...').isVisible()
        const hasLoaded = await page.getByText('Estimation terminée').isVisible()
        if (isLoading || hasLoaded) {
          // Wait for redirect to results page
          /** @todo fix this */
          await page.waitForURL(`**/simulateurs/${simulateurId}/resultats**`, { timeout: 10000 })

          isCompleted = true
          break
        }
      }
      catch (error) {
        console.error(`Error at question ${questionCount}:`, error)
      }
    }

    // take a screenshot of the results page
    // await page.screenshot({ path: './tests/e2e/screenshots/simulation-results.png' })

    // Verify we've been redirected to results page
    await page.waitForURL(`**/simulateurs/${simulateurId}/resultats**`, { timeout: 10000 })
    expect(page.url()).toContain(`/simulateurs/${simulateurId}/resultats`)

    // We should then verify results page elements
  })
})
