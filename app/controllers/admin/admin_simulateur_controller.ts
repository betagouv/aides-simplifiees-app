import type { HttpContext } from '@adonisjs/core/http'
import Simulateur from '#models/simulateur'
import { Exception } from '@adonisjs/core/exceptions'
import string from '@adonisjs/core/helpers/string'

export default class AdminSimulateurController {
  /**
   * Class to serialize the simulateur data for sharing types with Inertia in the create/edit views.
   * @see https://docs.adonisjs.com/guides/views-and-templates/inertia#model-serialization
   */
  public static SingleDto = class {
    constructor(private simulateur: Simulateur) { }

    toJson() {
      return {
        id: this.simulateur.id,
        updatedAt: this.simulateur.updatedAt.toString(), // Convert DateTime to string for JSON serialization
        title: this.simulateur.title,
        slug: this.simulateur.slug,
        status: this.simulateur.status,
        description: this.simulateur.description,
        metaDescription: this.simulateur.metaDescription,
        pictogramPath: this.simulateur.pictogramPath,
        usesPublicodesForms: this.simulateur.usesPublicodesForms,
      }
    }
  }

  /**
   * Class to serialize the simulateurs data for sharing types with Inertia in the index view.
   */
  public static ListDto = class {
    constructor(private simulateurs: Simulateur[]) { }

    toJson() {
      return this.simulateurs.map((simulateur) => {
        return {
          id: simulateur.id,
          updatedAt: simulateur.updatedAt.toString(), // Convert DateTime to string for JSON serialization
          title: simulateur.title,
          slug: simulateur.slug,
          status: simulateur.status,
          description: simulateur.description,
          pictogramPath: simulateur.pictogramPath,
        }
      })
    }
  }

  /**
   * Fields that can be set when creating or updating a simulateur
   */
  private static allowedFields: Array<keyof Simulateur> = [
    'title',
    'slug',
    'status',
    'description',
    'metaDescription',
    'pictogramPath',
    'usesPublicodesForms',
  ]

  /**
   * List all simulateurs in admin dashboard
   */
  public async index({ inertia }: HttpContext) {
    const simulateurs = await Simulateur.all()

    return inertia.render('admin/simulateurs/index', {
      simulateurs: new AdminSimulateurController.ListDto(simulateurs).toJson(),
    })
  }

  /**
   * Show create simulateur form
   */
  public async create({ inertia }: HttpContext) {
    return inertia.render('admin/simulateurs/create')
  }

  /**
   * Show edit simulateur form
   */
  public async edit({ params, inertia }: HttpContext) {
    const simulateur = await Simulateur.find(params.id)

    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
    }

    return inertia.render('admin/simulateurs/edit', {
      simulateur: new AdminSimulateurController.SingleDto(simulateur).toJson(),
    })
  }

  /**
   * Store a new simulateur
   */
  public async store({ request, response }: HttpContext) {
    const data = request.only(AdminSimulateurController.allowedFields)

    if (!data.slug) {
      // Générer un slug à partir du titre
      data.slug = string.slug(data.title, { strict: true, lower: true })
    }

    await Simulateur.create({
      ...data,
      builtJson: JSON.stringify({}),
    })

    return response.redirect('/admin/simulateurs')
  }

  /**
   * Update a simulateur
   */
  public async update({ params, request, response }: HttpContext) {
    const simulateur = await Simulateur.find(params.id)

    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
    }

    const data = request.only(AdminSimulateurController.allowedFields)

    simulateur.merge(data)
    await simulateur.save()

    return response.redirect('/admin/simulateurs')
  }

  /**
   * Delete a simulateur
   */
  public async destroy({ params, response }: HttpContext) {
    const simulateur = await Simulateur.find(params.id)

    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
    }

    await simulateur.delete()

    return response.redirect('/admin/simulateurs')
  }
}
