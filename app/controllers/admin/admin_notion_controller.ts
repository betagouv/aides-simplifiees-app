import type { HttpContext } from '@adonisjs/core/http'
import Notion from '#models/notion'
import { Exception } from '@adonisjs/core/exceptions'
import string from '@adonisjs/core/helpers/string'

export default class AdminNotionController {
  /**
   * Class to serialize the notion data for sharing types with Inertia in the create/edit views.
   * @see https://docs.adonisjs.com/guides/views-and-templates/inertia#model-serialization
   */
  public static SingleDto = class {
    constructor(private notion: Notion) { }

    toJson() {
      return {
        id: this.notion.id,
        updatedAt: this.notion.updatedAt,
        title: this.notion.title,
        slug: this.notion.slug,
        status: this.notion.status,
        description: this.notion.description,
        metaDescription: this.notion.metaDescription,
        content: this.notion.content,
      }
    }
  }

  /**
   * Class to serialize the notions data for sharing types with Inertia in the index view.
   */
  public static ListDto = class {
    constructor(private notions: Notion[]) { }

    toJson() {
      return this.notions.map((notion) => {
        return {
          id: notion.id,
          updatedAt: notion.updatedAt,
          title: notion.title,
          slug: notion.slug,
          status: notion.status,
          description: notion.description,
        }
      })
    }
  }

  /**
   * Fields that can be set when creating or updating a notion
   */
  private static allowedFields: Array<keyof Notion> = [
    'title',
    'slug',
    'status',
    'description',
    'metaDescription',
    'content',
  ]

  /**
   * List all notions in admin dashboard
   */
  public async index({ inertia }: HttpContext) {
    const notions = await Notion.all()

    return inertia.render('admin/notions/index', {
      notions: new AdminNotionController.ListDto(notions).toJson(),
    })
  }

  /**
   * Show create notion form
   */
  public async create({ inertia }: HttpContext) {
    return inertia.render('admin/notions/create')
  }

  /**
   * Show edit notion form
   */
  public async edit({ params, inertia }: HttpContext) {
    const notion = await Notion.find(params.id)

    if (!notion) {
      throw new Exception('Notion non trouvée', { status: 404, code: 'NOT_FOUND' })
    }

    return inertia.render('admin/notions/edit', {
      notion: new AdminNotionController.SingleDto(notion).toJson(),
    })
  }

  /**
   * Store a new notion
   */
  public async store({ request, response }: HttpContext) {
    const data = request.only(AdminNotionController.allowedFields)

    if (!data.slug) {
      // Générer un slug à partir du titre
      data.slug = string.slug(data.title, { strict: true, lower: true })
    }
    await Notion.create(data)

    return response.redirect().toRoute('/admin/notions')
  }

  /**
   * Update a notion
   */
  public async update({ params, request, response }: HttpContext) {
    const notion = await Notion.find(params.id)

    if (!notion) {
      throw new Exception('Notion non trouvée', { status: 404, code: 'NOT_FOUND' })
    }

    const data = request.only(AdminNotionController.allowedFields)

    notion.merge(data)
    await notion.save()

    return response.redirect().toRoute('/admin/notions')
  }

  /**
   * Delete a notion
   */
  public async destroy({ params, response }: HttpContext) {
    const notion = await Notion.find(params.id)

    if (!notion) {
      throw new Exception('Notion non trouvée', { status: 404, code: 'NOT_FOUND' })
    }

    await notion.delete()

    return response.redirect().toRoute('/admin/notions')
  }
}
