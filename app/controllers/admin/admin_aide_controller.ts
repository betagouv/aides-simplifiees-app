import type { HttpContext } from '@adonisjs/core/http'
import Aide from '#models/aide'
import string from '@adonisjs/core/helpers/string'

export default class AdminAideController {
  /**
   * Class to serialize the aide data for sharing types with Inertia in the create/edit views.
   * @see https://docs.adonisjs.com/guides/views-and-templates/inertia#model-serialization
   */
  public static SingleDto = class {
    constructor(private aide: Aide) { }

    toJson() {
      return {
        id: this.aide.id,
        updatedAt: this.aide.updatedAt,
        title: this.aide.title,
        slug: this.aide.slug,
        status: this.aide.status,
        description: this.aide.description,
        metaDescription: this.aide.metaDescription,
        content: this.aide.content,
        type: this.aide.type,
        usage: this.aide.usage,
        instructeur: this.aide.instructeur,
        textesLoi: this.aide.textesLoi,
      }
    }
  }

  /**
   * Class to serialize the aides data for sharing types with Inertia in the index view.
   */
  public static ListDto = class {
    constructor(private aides: Aide[]) { }

    toJson() {
      return this.aides.map((aide) => {
        return {
          id: aide.id,
          updatedAt: aide.updatedAt,
          title: aide.title,
          slug: aide.slug,
          status: aide.status,
          description: aide.description,
          type: aide.type,
          instructeur: aide.instructeur,
        }
      })
    }
  }

  /**
   * Fields that can be set when creating or updating an aide
   */
  private static allowedFields: Array<keyof Aide> = [
    'title',
    'slug',
    'status',
    'description',
    'metaDescription',
    'content',
    'type',
    'usage',
    'instructeur',
    'textesLoi',
  ]

  /**
   * List all aides in admin dashboard
   */
  public async index({ inertia }: HttpContext) {
    const aides = await Aide.all()

    return inertia.render('admin/aides/index', {
      aides: new AdminAideController.ListDto(aides).toJson(),
    })
  }

  /**
   * Show create aide form
   */
  public async create({ inertia }: HttpContext) {
    return inertia.render('admin/aides/create')
  }

  /**
   * Show edit aide form
   */
  public async edit({ params, inertia, response }: HttpContext) {
    const aide = await Aide.find(params.id)

    if (!aide) {
      return response.status(404).send('Aide non trouvée')
    }

    return inertia.render('admin/aides/edit', {
      aide: new AdminAideController.SingleDto(aide).toJson(),
    })
  }

  /**
   * Store a new aide
   */
  public async store({ request, response }: HttpContext) {
    const data = request.only(AdminAideController.allowedFields)

    if (!data.slug) {
      // Générer un slug à partir du titre
      data.slug = string.slug(data.title)
    }
    await Aide.create(data)

    return response.redirect().toRoute('/admin/aides')
  }

  /**
   * Update an aide
   */
  public async update({ params, request, response }: HttpContext) {
    const aide = await Aide.find(params.id)

    if (!aide) {
      return response.status(404).send('Aide non trouvée')
    }

    const data = request.only(AdminAideController.allowedFields)

    aide.merge(data)
    await aide.save()

    return response.redirect().toRoute('/admin/aides')
  }

  /**
   * Delete an aide
   */
  public async destroy({ params, response }: HttpContext) {
    const aide = await Aide.find(params.id)

    if (!aide) {
      return response.status(404).send('Aide non trouvée')
    }

    await aide.delete()

    return response.redirect().toRoute('/admin/aides')
  }
}
