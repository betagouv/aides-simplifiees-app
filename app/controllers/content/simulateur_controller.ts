import type { HttpContext } from '@adonisjs/core/http'
import type { DateTime } from 'luxon'
import Aide from '#models/aide'
import FormSubmission from '#models/form_submission'
import Simulateur from '#models/simulateur'
import SimulateurService from '#services/simulateur_service'
import { Exception } from '@adonisjs/core/exceptions'

export default class SimulateurController {
  /**
   * Class to serialize a single simulateur data for sharing types with Inertia in the show view.
   * @see https://docs.adonisjs.com/guides/views-and-templates/inertia#model-serialization
   */
  public static SingleDto = class {
    constructor(private simulateur: Simulateur) { }
    toJson() {
      return {
        title: this.simulateur.title,
        slug: this.simulateur.slug,
        pictogramPath: this.simulateur.pictogramPath,
        description: this.simulateur.description,
        metaDescription: this.simulateur.metaDescription,
      }
    }
  }

  /**
   * Class to serialize the list of simulateurs data for sharing types with Inertia in the index view.
   */
  public static ListDto = class {
    constructor(private simulateurs: Simulateur[]) { }

    toJson() {
      return this.simulateurs.map((simulateur) => {
        return {
          title: simulateur.title,
          slug: simulateur.slug,
          pictogramPath: simulateur.pictogramPath,
        }
      })
    }
  }

  private simulateurService = new SimulateurService()

  /**
   * Render the list page of public simulateurs
   */
  public async index({ inertia }: HttpContext) {
    const simulateurs = await Simulateur.query()
      .where('status', 'published')

    return inertia.render('simulateurs/index', {
      simulateurs: new SimulateurController.ListDto(simulateurs).toJson(),
    })
  }

  /**
   * Render a single simulateur page
   */
  public async show({ params, inertia }: HttpContext) {
    const simulateur = await Simulateur.query()
      .where('slug', params.simulateur_slug)
      .whereIn('status', ['published', 'unlisted'])
      .first()

    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
    }

    return inertia.render('simulateurs/simulateur', {
      simulateur: new SimulateurController.SingleDto(simulateur).toJson(),
    })
  }

  /**
   * Render the recapitulatif page for a simulateur
   */
  public async showRecapitulatif({ params, inertia }: HttpContext) {
    const simulateur = await Simulateur.findBy('slug', params.simulateur_slug)
    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
    }
    return inertia.render('simulateurs/recapitulatif', {
      simulateur: new SimulateurController.SingleDto(simulateur).toJson(),
    })
  }

  public async showResultats({ params, inertia, response }: HttpContext) {
    const simulateur = await Simulateur.findBy('slug', params.simulateur_slug)

    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
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
      throw new Exception('Résultats non trouvés', { status: 404, code: 'NOT_FOUND' })
    }

    return inertia.render('simulateurs/resultats', {
      simulateur: new SimulateurController.SingleDto(simulateur).toJson(),
      createdAt: formSubmission.createdAt,
      results: await this.transformSimulationResults(formSubmission.results, params),
      secureHash: params.hash as string,
    })
  }

  public async showMockResultats({ params, inertia }: HttpContext) {
    const simulateur = await Simulateur.findBy('slug', params.simulateur_slug)
    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
    }

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
      simulateur: new SimulateurController.SingleDto(simulateur).toJson(),
      createdAt: new Date(),
      results: await this.transformSimulationResults(mockCalculationResponse, {
        simulateur_slug: params.simulateur_slug,
        hash: 'mock-hash',
      }),
      secureHash: 'mock-hash',
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
      .preload('typeAide')

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
          typeAide: aideDetails.typeAide,
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
