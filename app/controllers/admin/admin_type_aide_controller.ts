import type { HttpContext } from '@adonisjs/core/http'
import TypeAide from '#models/type_aide'
import string from '@adonisjs/core/helpers/string'

export default class AdminTypeAideController {
  /**
   * Class to serialize the type aide data for sharing types with Inertia in the create/edit views.
   */
  public static SingleDto = class {
    constructor(private typeAide: TypeAide) { }

    toJson() {
      return {
        id: this.typeAide.id,
        slug: this.typeAide.slug,
        label: this.typeAide.label,
        iconName: this.typeAide.iconName,
        updatedAt: this.typeAide.updatedAt,
      }
    }
  }

  /**
   * Class to serialize the type aides data for sharing types with Inertia in the index view.
   */
  public static ListDto = class {
    constructor(private typeAides: TypeAide[]) { }

    toJson() {
      return this.typeAides.map((typeAide) => {
        return {
          id: typeAide.id,
          slug: typeAide.slug,
          label: typeAide.label,
          iconName: typeAide.iconName,
          updatedAt: typeAide.updatedAt,
        }
      })
    }
  }

  /**
   * Fields that can be set when creating or updating a type aide
   */
  private static allowedFields: Array<keyof TypeAide> = [
    'slug',
    'label',
    'iconName',
  ]

  /**
   * List all type aides in admin dashboard
   */
  public async index({ inertia }: HttpContext) {
    const typeAides = await TypeAide.all()

    return inertia.render('admin/type_aides/index', {
      typeAides: new AdminTypeAideController.ListDto(typeAides).toJson(),
    })
  }

  /**
   * Show create type aide form
   */
  public async create({ inertia }: HttpContext) {
    return inertia.render('admin/type_aides/create')
  }

  /**
   * Show edit type aide form
   */
  public async edit({ params, inertia, response }: HttpContext) {
    const typeAide = await TypeAide.find(params.id)

    if (!typeAide) {
      return response.status(404).send('Type d\'aide non trouvé')
    }

    return inertia.render('admin/type_aides/edit', {
      typeAide: new AdminTypeAideController.SingleDto(typeAide).toJson(),
    })
  }

  /**
   * Store a new type aide
   */
  public async store({ request, response }: HttpContext) {
    const data = request.only(AdminTypeAideController.allowedFields)

    if (!data.slug) {
      // Generate slug from label
      data.slug = string.slug(data.label, { strict: true, lower: true })
    }
    await TypeAide.create(data)

    return response.redirect().toRoute('/admin/type-aides')
  }

  /**
   * Update a type aide
   */
  public async update({ params, request, response }: HttpContext) {
    const typeAide = await TypeAide.find(params.id)

    if (!typeAide) {
      return response.status(404).send('Type d\'aide non trouvé')
    }

    const data = request.only(AdminTypeAideController.allowedFields)

    typeAide.merge(data)
    await typeAide.save()

    return response.redirect().toRoute('/admin/type-aides')
  }

  /**
   * Delete a type aide
   */
  public async destroy({ params, response }: HttpContext) {
    const typeAide = await TypeAide.find(params.id)

    if (!typeAide) {
      return response.status(404).send('Type d\'aide non trouvé')
    }

    await typeAide.delete()

    return response.redirect().toRoute('/admin/type-aides')
  }
}
