import type { HttpContext } from '@adonisjs/core/http'
import { promises as fs } from 'node:fs'
import FormSubmission from '#models/form_submission'
import Persona from '#models/persona'
import Simulateur from '#models/simulateur'
import { Exception } from '@adonisjs/core/exceptions'
import app from '@adonisjs/core/services/app'

export default class AdminPersonaController {
  /**
   * Class to serialize the persona data for sharing types with Inertia in the create/edit views.
   */
  public static SingleDto = class {
    constructor(private persona: Persona) {}

    toJson() {
      return {
        id: this.persona.id,
        updatedAt: this.persona.updatedAt.toString(), // Convert DateTime to string for JSON serialization
        name: this.persona.name,
        description: this.persona.description,
        testData: this.persona.testData,
        simulateurId: this.persona.simulateurId,
        status: this.persona.status,
      }
    }
  }

  /**
   * Class to serialize the personas data for sharing types with Inertia in the index view.
   */
  public static ListDto = class {
    constructor(private personas: Persona[]) {}

    toJson() {
      return this.personas.map(persona => ({
        id: persona.id,
        updatedAt: persona.updatedAt.toString(), // Convert DateTime to string for JSON serialization
        name: persona.name,
        description: persona.description,
        simulateurId: persona.simulateurId,
        status: persona.status,
      }))
    }
  }

  /**
   * Fields that can be set when creating or updating a persona
   */
  private static allowedFields: Array<keyof Persona> = [
    'name',
    'description',
    'simulateurId',
    'status',
  ]

  /**
   * List all personas for a specific simulateur
   */
  public async index({ params, inertia }: HttpContext) {
    const simulateur = await Simulateur.find(params.simulateur_id)
    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
    }

    const personas = await Persona.query().where('simulateur_id', params.simulateur_id)

    return inertia.render('admin/personas/index', {
      personas: new AdminPersonaController.ListDto(personas).toJson(),
      simulateur: {
        id: simulateur.id,
        title: simulateur.title,
        slug: simulateur.slug,
      },
    })
  }

  /**
   * Show create persona form
   */
  public async create({ params, inertia }: HttpContext) {
    const simulateur = await Simulateur.find(params.simulateur_id)
    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
    }

    return inertia.render('admin/personas/create', {
      simulateur: {
        id: simulateur.id,
        title: simulateur.title,
        slug: simulateur.slug,
      },
    })
  }

  /**
   * Show edit persona form
   */
  public async edit({ params, inertia }: HttpContext) {
    const persona = await Persona.query()
      .where('id', params.id)
      .where('simulateur_id', params.simulateur_id)
      .first()

    if (!persona) {
      throw new Exception('Persona non trouvée', { status: 404, code: 'NOT_FOUND' })
    }

    const simulateur = await Simulateur.find(params.simulateur_id)
    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
    }

    return inertia.render('admin/personas/edit', {
      persona: new AdminPersonaController.SingleDto(persona).toJson(),
      simulateur: {
        id: simulateur.id,
        title: simulateur.title,
        slug: simulateur.slug,
      },
    })
  }

  /**
   * Store a new persona
   */
  public async store({ params, request, response }: HttpContext) {
    const simulateur = await Simulateur.find(params.simulateur_id)
    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
    }

    const data = request.only([...AdminPersonaController.allowedFields, 'testData'])

    const persona = new Persona()
    persona.name = data.name
    persona.description = data.description
    persona.simulateurId = params.simulateur_id
    persona.status = data.status || 'active'
    persona.testData = data.testData || {}

    await persona.save()

    return response.redirect(`/admin/simulateurs/${params.simulateur_id}/personas`)
  }

  /**
   * Update a persona
   */
  public async update({ params, request, response }: HttpContext) {
    const simulateur = await Simulateur.find(params.simulateur_id)
    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
    }

    const persona = await Persona.query()
      .where('id', params.id)
      .where('simulateur_id', params.simulateur_id)
      .first()

    if (!persona) {
      throw new Exception('Persona non trouvée', { status: 404, code: 'NOT_FOUND' })
    }

    const data = request.only([...AdminPersonaController.allowedFields, 'testData'])

    persona.name = data.name
    persona.description = data.description
    persona.status = data.status

    // Handle testData - it could be a string (JSON) or an object
    if (data.testData) {
      if (typeof data.testData === 'string') {
        // If it's already a JSON string, parse it first
        try {
          persona.testData = JSON.parse(data.testData)
        }
        catch {
          // If parsing fails, treat it as empty object
          persona.testData = {}
        }
      }
      else {
        // If it's an object, use it directly
        persona.testData = data.testData
      }
    }
    else {
      persona.testData = {}
    }

    await persona.save()

    return response.redirect(`/admin/simulateurs/${params.simulateur_id}/personas`)
  }

  /**
   * Delete a persona
   */
  public async destroy({ params, response }: HttpContext) {
    const persona = await Persona.query()
      .where('id', params.id)
      .where('simulateur_id', params.simulateur_id)
      .first()

    if (!persona) {
      throw new Exception('Persona non trouvée', { status: 404, code: 'NOT_FOUND' })
    }

    await persona.delete()

    return response.redirect(`/admin/simulateurs/${params.simulateur_id}/personas`)
  }

  /**
   * Import personas from JSON
   */
  public async import({ params, request, response }: HttpContext) {
    const simulateur = await Simulateur.find(params.simulateur_id)
    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
    }

    const file = request.file('file')

    if (!file) {
      throw new Exception('Aucun fichier fourni', { status: 400, code: 'NO_FILE' })
    }

    if (!file.isValid) {
      throw new Exception('Fichier invalide', { status: 400, code: 'INVALID_FILE' })
    }

    try {
      // Move file to temp directory and read content
      await file.move(app.tmpPath())
      const fileContent = await fs.readFile(file.filePath!, 'utf8')
      const personas = JSON.parse(fileContent)

      if (!Array.isArray(personas)) {
        throw new Exception('Le fichier doit contenir un tableau de personas', { status: 400, code: 'INVALID_FORMAT' })
      }

      const createdPersonas = []
      for (const personaData of personas) {
        const persona = new Persona()
        persona.name = personaData.name
        persona.description = personaData.description || null
        persona.simulateurId = params.simulateur_id
        persona.status = personaData.status || 'active'
        persona.testData = personaData.testData || personaData.test_data || {}

        await persona.save()
        createdPersonas.push(persona)
      }

      return response.redirect(`/admin/simulateurs/${params.simulateur_id}/personas`)
    }
    catch (error) {
      if (error instanceof SyntaxError) {
        throw new Exception('Format JSON invalide', { status: 400, code: 'INVALID_JSON' })
      }
      throw error
    }
  }

  /**
   * Export personas as JSON
   */
  public async export({ params, response }: HttpContext) {
    const simulateur = await Simulateur.find(params.simulateur_id)
    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
    }

    const personas = await Persona.query().where('simulateur_id', params.simulateur_id)

    const exportData = personas.map(persona => ({
      name: persona.name,
      description: persona.description,
      test_data: persona.testData,
      status: persona.status,
    }))

    return response
      .header('Content-Type', 'application/json; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${simulateur.slug}-personas.json"`)
      .send(JSON.stringify(exportData, null, 2))
  }

  /**
   * Run a simulation with persona test data
   */
  public async runSimulation({ params, response }: HttpContext) {
    try {
      const persona = await Persona.find(params.id)
      if (!persona) {
        throw new Exception('Persona non trouvé', { status: 404, code: 'NOT_FOUND' })
      }

      const simulateur = await Simulateur.find(persona.simulateurId)
      if (!simulateur) {
        throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
      }

      // Check if persona has test data
      if (!persona.testData || Object.keys(persona.testData).length === 0) {
        return response.status(400).json({
          success: false,
          error: 'Ce persona ne contient pas de données de test valides',
        })
      }

      // Create a form submission with persona test data
      const submission = await FormSubmission.create({
        simulateurSlug: simulateur.slug,
        answers: persona.testData,
        results: persona.testData, // Use the testData as mock results for now
      })

      // Get the URL for viewing results
      const resultsUrl = submission.getResultsUrl()

      // Redirect to results page
      return response.redirect().toPath(resultsUrl)
    }
    catch (error: any) {
      console.error('Error running simulation with persona:', error)

      return response.status(500).json({
        success: false,
        error: 'Failed to run simulation',
        details: error.message,
      })
    }
  }
}
