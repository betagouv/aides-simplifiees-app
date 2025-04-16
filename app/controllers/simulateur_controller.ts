import { HttpContext } from '@adonisjs/core/http'
import Simulateur from '#models/simulateur'
import Step from '#models/step'
import Question from '#models/question'
import Choice from '#models/choice'
import SimulateurService from '#services/simulateur_service'

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
      simulateurJson: JSON.parse(simulateur.builtJson || '{}')
    })
  }

  // Generate and update built_json for a simulateur
  public async generateBuiltJson({ params, response }: HttpContext) {
    const id = params.id

    try {
      const builtJson = await this.simulateurService.generateBuiltJson(id)
      return response.json({
        success: true,
        data: JSON.parse(builtJson)
      })
    } catch (error) {
      return response.status(404).json({
        success: false,
        message: `Simulateur with id ${id} not found`,
        error: error.message
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
        simulateur
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to create sample simulateur',
        error: error.message
      })
    }
  }
}
