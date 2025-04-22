import { HttpContext } from '@adonisjs/core/http'
import Simulateur from '#models/simulateur'
import Step from '#models/step'
import Question from '#models/question'
import Choice from '#models/choice'
import SimulateurService from '#services/simulateur_service'
import { dd } from '@adonisjs/core/services/dumper'
import FormSubmission from '#models/form_submission'
import { transformSimulationResults } from '../../inertia/utils/transform-simulation-results.js'
import Aide from '#models/aide'

export default class SimulateurController {
  private simulateurService = new SimulateurService()

  // List all simulateurs
  public async index({ inertia }: HttpContext) {
    const simulateurs = await Simulateur.all()

    return inertia.render('simulateurs/index', { simulateurs })
  }

  // Show a simulateur
  public async showSimulateur({ params, inertia, response }: HttpContext) {
    const slug = params.slug

    const simulateur = await Simulateur.findBy('slug', slug)

    if (!simulateur) {
      return response.status(404).send('Simulateur non trouvé')
    }

    // Preload steps, questions and choices for the simulateur
    await simulateur.load('steps', (stepsQuery) => {
      stepsQuery.preload('questions', (questionsQuery) => {
        questionsQuery.preload('choices')
      })
    })

    return inertia.render('simulateurs/show', {
      simulateur,
      simulateurJson: JSON.parse(simulateur.builtJson || '{}'),
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
    } catch (error) {
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
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to create sample simulateur',
        error: error.message,
      })
    }
  }

  public async resultats({ params, inertia, response }: HttpContext) {
    const simulateurId = params.slug
    const secureHash = params.hash // This will be undefined if not present in the URL

    // Fetch the simulateur by ID or slug
    const simulateur = await Simulateur.findBy('slug', simulateurId)

    if (!simulateur) {
      return response.status(404).send('Simulateur non trouvé')
    }

    let formSubmission = null

    // If we have a secure hash, try to fetch the corresponding submission
    if (secureHash) {
      formSubmission = await FormSubmission.query()
        .where('secure_hash', secureHash)
        .where('simulator_id', simulateurId)
        .first()

      if (!formSubmission) {
        return response.status(404).send('Résultats non trouvés')
      }
    }

    // Load all aides from Aide Model and convert to an object indexed by slug
    const aides = await Aide.all()

    // Create an object where keys are aide slugs and values are the aide objects
    const aidesBySlug: Record<string, any> = {}

    aides.forEach((aide) => {
      aidesBySlug[aide.slug] = aide
    })

    // Process the simulation results
    if (formSubmission && formSubmission.results) {
      const simulationResults = formSubmission.results
      const rawAides = []

      // First pass: Extract raw aides from results with eligibility info
      for (const [key, value] of Object.entries(simulationResults)) {
        if (key.endsWith('-eligibilite')) {
          // Extract the base aide slug
          const aideSlug = key.replace('-eligibilite', '')
          const eligibilite = value === true

          // Get the amount if available
          const montant = simulationResults[aideSlug] || 0

          rawAides.push({
            id: aideSlug,
            eligibilite,
            montant: eligibilite ? montant : 0,
          })
        }
      }

      // Second pass: Enrich raw aides with aide details
      const richAides = []
      const eligibleAides = []
      const nonEligibleAides = []

      for (const rawAide of rawAides) {
        const aideDetails = aidesBySlug[rawAide.id]

        if (aideDetails) {
          const richAide = {
            // Data from calculation response
            id: rawAide.id,
            montant: rawAide.montant,
            link: `/aides/${rawAide.id}?hash=${secureHash}`,
            eligibilite: rawAide.eligibilite,
            // Data from aidesBySlug
            titre: aideDetails.titre || `Aide ${rawAide.id}`,
            description: aideDetails.description || 'Description non disponible',
            textesLoi: aideDetails.textesLoi || [],
            instructeur: aideDetails.instructeur || 'Instructeur non disponible',
            type: aideDetails.type || 'aide-financiere',
            usage: aideDetails.usage || 'frais-installation-logement',
          }

          richAides.push(richAide)

          // Group by eligibility
          if (rawAide.eligibilite) {
            eligibleAides.push(richAide)
          } else {
            nonEligibleAides.push(richAide)
          }
        }
      }

      // Calculate montants by usage type
      const montantsByUsage = new Map()

      for (const aide of eligibleAides) {
        if (!aide.usage) continue

        const currentTotal = montantsByUsage.get(aide.usage) || 0
        montantsByUsage.set(aide.usage, currentTotal + aide.montant)
      }

      // Transform to rich montants
      const montants = []
      montantsByUsage.forEach((montant, usageAide) => {
        montants.push({
          usageAide,
          montant,
        })
      })

      // Collect textes de loi
      const textesLoi = []
      richAides.forEach((aide) => {
        if (Array.isArray(aide.textesLoi)) {
          textesLoi.push(...aide.textesLoi)
        }
      })

      // Calculate basic echeances (this is a simplified example)
      const echeances = []

      // Create the formatted date/time
      const createdAt = new Date(formSubmission.createdAt)
      const date = createdAt.toLocaleDateString('fr-FR')
      const time = createdAt.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })

      // Set all the calculated data in formSubmission.results
      formSubmission.results = {
        ...formSubmission.results,
        createAt: { date, time },
        aides: eligibleAides,
        aidesNonEligibles: nonEligibleAides,
        montants,
        echeances,
        textesLoi,
      }
    }

    // Render the results page with the form submission data if available
    return inertia.render('simulateurs/resultats/resultats', {
      simulateur,
      formSubmission,
      // Only include the hash in props if we have a submission
      secureHash: formSubmission ? secureHash : null,
      aidesBySlug,
    })
  }
}
