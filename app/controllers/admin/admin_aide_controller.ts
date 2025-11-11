import type { HttpContext } from '@adonisjs/core/http'
import AdminTypeAideController from '#controllers/admin/admin_type_aide_controller'
import Aide from '#models/aide'
import TypeAideModel from '#models/type_aide'
import { Exception } from '@adonisjs/core/exceptions'
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
        updatedAt: this.aide.updatedAt.toString(), // Convert DateTime to string for JSON serialization
        title: this.aide.title,
        slug: this.aide.slug,
        status: this.aide.status,
        description: this.aide.description,
        metaDescription: this.aide.metaDescription,
        content: this.aide.content,
        typeAideId: this.aide.typeAideId,
        usage: this.aide.usage,
        instructeur: this.aide.instructeur,
        textesLoi: this.aide.textesLoi,
        dsEnabled: this.aide.dsEnabled,
        dsDemarcheId: this.aide.dsDemarcheId,
        dsFieldMapping: this.aide.dsFieldMapping,
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
          updatedAt: aide.updatedAt.toString(), // Convert DateTime to string for JSON serialization
          title: aide.title,
          slug: aide.slug,
          status: aide.status,
          typeAide: aide.typeAide ? new AdminTypeAideController.SingleDto(aide.typeAide).toJson() : null,
          description: aide.description,
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
    'typeAideId',
    'usage',
    'instructeur',
    'textesLoi',
    'dsEnabled',
    'dsDemarcheId',
    'dsFieldMapping',
  ]

  /**
   * List all aides in admin dashboard
   */
  public async index({ inertia }: HttpContext) {
    const aides = await Aide.query()
      .preload('typeAide')

    return inertia.render('admin/aides/index', {
      aides: new AdminAideController.ListDto(aides).toJson(),
    })
  }

  /**
   * Show create aide form
   */
  public async create({ inertia }: HttpContext) {
    const typesAide = await TypeAideModel.all()

    return inertia.render('admin/aides/create', {
      typesAide: typesAide.map(type => ({
        id: type.id,
        label: type.label,
      })),
    })
  }

  /**
   * Show edit aide form
   */

  public async edit({ params, inertia }: HttpContext) {
    const aide = await Aide.query()
      .where('id', params.id)
      .first()

    if (!aide) {
      throw new Exception('Aide non trouvée', { status: 404, code: 'NOT_FOUND' })
    }

    const typesAide = await TypeAideModel.all()

    return inertia.render('admin/aides/edit', {
      aide: new AdminAideController.SingleDto(aide).toJson(),
      typesAide: typesAide.map(type => ({
        id: type.id,
        label: type.label,
      })),
    })
  }

  /**
   * Store a new aide
   */
  public async store({ request, response }: HttpContext) {
    const data = request.only(AdminAideController.allowedFields)

    if (!data.slug) {
      // Générer un slug à partir du titre
      data.slug = string.slug(data.title, { strict: true, lower: true })
    }

    // Convert dsEnabled string to boolean
    if (typeof data.dsEnabled === 'string') {
      data.dsEnabled = data.dsEnabled === 'true'
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
      throw new Exception('Aide non trouvée', { status: 404, code: 'NOT_FOUND' })
    }

    const data = request.only(AdminAideController.allowedFields)

    // Convert dsEnabled string to boolean
    if (typeof data.dsEnabled === 'string') {
      data.dsEnabled = data.dsEnabled === 'true'
    }

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
      throw new Exception('Aide non trouvée', { status: 404, code: 'NOT_FOUND' })
    }

    await aide.delete()

    return response.redirect().toRoute('/admin/aides')
  }
}
