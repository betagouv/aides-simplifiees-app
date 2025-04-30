import type { HttpContext } from '@adonisjs/core/http'
import type { DateTime } from 'luxon'
import Aide from '#models/aide'
import FormSubmission from '#models/form_submission'
import Simulateur from '#models/simulateur'
import SimulateurService from '#services/simulateur_service'

export default class SimulateurController {
  private simulateurService = new SimulateurService()

  // List all simulateurs
  public async listSimulateurs({ inertia }: HttpContext) {
    const simulateurs = await Simulateur.all()

    return inertia.render('simulateurs/index', { simulateurs })
  }

  // Show a simulateur
  public async showSimulateur({ params, inertia, response }: HttpContext) {
    const simulateur = await Simulateur.findBy('slug', params.simulateur_slug)

    if (!simulateur) {
      return response.status(404).send('Simulateur non trouvé')
    }

    // Preload steps, questions and choices for the simulateur
    await simulateur.load('steps', (stepsQuery) => {
      stepsQuery.preload('questions', (questionsQuery) => {
        questionsQuery.preload('choices')
      })
    })

    return inertia.render('simulateurs/simulateur', {
      simulateur,
      simulateurJson: JSON.parse(simulateur.builtJson || '{}'),
    })
  }

  public async showRecapitulatif({ params, inertia, response }: HttpContext) {
    const simulateur = await Simulateur.findBy('slug', params.simulateur_slug)
    if (!simulateur) {
      return response.status(404).send('Simulateur non trouvé')
    }
    return inertia.render('simulateurs/recapitulatif', {
      simulateur,
    })
  }

  // Generate and update built_json for a simulateur
  public async generateBuiltJson({ params, response }: HttpContext) {
    const id = params.id

    try {
      const builtJson = await this.simulateurService.generateBuiltJson(id)
      return response.json({
        success: true,
        data: JSON.parse(builtJson),
      })
    }
    catch (error) {
      return response.status(404).json({
        success: false,
        message: `Simulateur with id ${id} not found`,
        error: error.message,
      })
    }
  }

  // Create a sample simulateur (for testing)
  public async createSample({ response }: HttpContext) {
    try {
      const simulateur = await this.simulateurService.createSampleSimulateur()
      return response.json({
        success: true,
        message: 'Sample simulateur created successfully',
        simulateur,
      })
    }
    catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to create sample simulateur',
        error: error.message,
      })
    }
  }

  public async showResultats({ params, inertia, request, response }: HttpContext) {
    // Fetch the simulateur by ID or slug
    const simulateur = await Simulateur.findBy('slug', params.simulateur_slug)

    if (!simulateur) {
      return response.status(404).send('Simulateur non trouvé')
    }

    /**
     * Mock calculation response for testing purposes.
     */
    const isMock = request.qs().mock === 'true' || params.hash === 'mock-hash'
    if (isMock) {
      const mockCalculationResponse = {
        'aide-personnalisee-logement': 42.23,
        'aide-personnalisee-logement-eligibilite': true,
        'garantie-visale': 1000,
        'garantie-visale-eligibilite': true,
        'locapass': 800,
        'locapass-eligibilite': true,
        'mobilite-master-1': 1000,
        'mobilite-master-1-eligibilite': false,
        'mobilite-parcoursup': 500,
        'mobilite-parcoursup-eligibilite': true,
      }
      return inertia.render('simulateurs/resultats', {
        simulateur,
        createdAt: new Date(),
        results: await this.transformSimulationResults(mockCalculationResponse, {
          simulateur_slug: params.simulateur_slug,
          hash: 'mock-hash',
        }),
        secureHash: 'mock-hash',
      })
    }

    /**
     * A secure hash is required to fetch the form submission.
     */
    if (!params.hash) {
      return response.redirect(`/simulateurs/${simulateur.slug}`)
    }

    const formSubmission = await FormSubmission.query()
      .where('secure_hash', params.hash)
      .where('simulator_id', params.simulateur_slug)
      .first() as {
      results: SimulationResultsAides
      createdAt: DateTime
    }

    if (!formSubmission) {
      return response.status(404).send('Résultats non trouvés')
    }

    // Render the results page with the form submission data if available
    return inertia.render('simulateurs/resultats', {
      simulateur,
      createdAt: formSubmission.createdAt.toJSDate(),
      results: await this.transformSimulationResults(formSubmission.results, params),
      secureHash: params.hash as string,
    })
  }

  /**
   * Given the raw simulation results, transform them into a more user-friendly displayable format.
   */
  private async transformSimulationResults(
    simulationResults: SimulationResultsAides,
    params: Record<string, string>,
  ): Promise<RichSimulationResults> {
    const rawAides = []

    // First pass: Extract raw aides from results with eligibility info
    for (const [key, value] of Object.entries(simulationResults)) {
      if (key.endsWith('-eligibilite')) {
        // Extract the base aide slug
        const aideSlug = key.replace('-eligibilite', '')
        const eligibilite = value === true

        // Get the amount if available
        const montant = (simulationResults[aideSlug] as number) || 0

        rawAides.push({
          id: aideSlug,
          eligibilite,
          montant: eligibilite ? montant : 0,
        })
      }
    }

    // Load required aides from Aide Model and convert to an object indexed by slug
    const aides = await Aide.query()
      .whereIn('slug', rawAides.map(aide => aide.id))
    const aidesBySlug: Record<string, Aide> = {}
    aides.forEach((aide) => {
      aidesBySlug[aide.slug] = aide
    })

    // Second pass: Enrich raw aides with aide details
    const allAides: RichAide[] = []
    const eligibleAides: RichAide[] = []
    const nonEligibleAides: RichAide[] = []
    const montants: RichMontant[] = []
    const textesLoi: TexteLoi[] = []

    for (const rawAide of rawAides) {
      const aideDetails = aidesBySlug[rawAide.id]

      if (aideDetails) {
        const richAide: RichAide = {
          // Data from calculation response
          id: rawAide.id,
          montant: rawAide.montant,
          link: `/simulateurs/${params.simulateur_slug}/resultats/${params.hash}/aides/${rawAide.id}#simulateur-title`,
          eligibilite: rawAide.eligibilite,
          // Data from database content source
          title: aideDetails.title || `Aide ${rawAide.id}`,
          description: aideDetails.description || 'Description non disponible',
          textesLoi: aideDetails.textesLoi || [],
          instructeur: aideDetails.instructeur || 'Instructeur non disponible',
          type: aideDetails.type || 'aide-financiere',
          usage: aideDetails.usage || 'frais-installation-logement',
        }

        allAides.push(richAide)
        if (rawAide.eligibilite) {
          eligibleAides.push(richAide)
        }
        else {
          nonEligibleAides.push(richAide)
        }
        if (richAide.usage && richAide.montant > 0) {
          const existingMontant = montants.find(m => m.usageAide === richAide.usage)
          if (existingMontant) {
            existingMontant.montant += richAide.montant
          }
          else {
            montants.push({
              usageAide: richAide.usage,
              montant: richAide.montant,
            })
          }
        }

        if (Array.isArray(richAide.textesLoi)) {
          textesLoi.push(...richAide.textesLoi)
        }
      }
    }
    return {
      aides: eligibleAides,
      aidesNonEligibles: nonEligibleAides,
      montants,
      textesLoi,
    }
  }
}
