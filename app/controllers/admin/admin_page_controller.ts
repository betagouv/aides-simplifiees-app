import type { HttpContext } from '@adonisjs/core/http'
import Page from '#models/page'
import string from '@adonisjs/core/helpers/string'

export default class AdminPageController {
  /**
   * Class to serialize the page data for sharing types with Inertia in the create/edit views.
   * @see https://docs.adonisjs.com/guides/views-and-templates/inertia#model-serialization
   */
  public static SingleDto = class {
    constructor(private page: Page) { }

    toJson() {
      return {
        id: this.page.id,
        updatedAt: this.page.updatedAt,
        title: this.page.title,
        slug: this.page.slug,
        status: this.page.status,
        description: this.page.description,
        metaDescription: this.page.metaDescription,
        content: this.page.content,
      }
    }
  }

  /**
   * Class to serialize the pages data for sharing types with Inertia in the index view.
   */
  public static ListDto = class {
    constructor(private pages: Page[]) { }

    toJson() {
      return this.pages.map((page) => {
        return {
          id: page.id,
          updatedAt: page.updatedAt,
          title: page.title,
          slug: page.slug,
          status: page.status,
          description: page.description,
        }
      })
    }
  }

  /**
   * Fields that can be set when creating or updating a page
   */
  private static allowedFields: Array<keyof Page> = [
    'title',
    'slug',
    'status',
    'description',
    'metaDescription',
    'content',
  ]

  /**
   * List all pages in admin dashboard
   */
  public async index({ inertia }: HttpContext) {
    const pages = await Page.all()

    return inertia.render('admin/pages/index', {
      pages: new AdminPageController.ListDto(pages).toJson(),
    })
  }

  /**
   * Show create page form
   */
  public async create({ inertia }: HttpContext) {
    return inertia.render('admin/pages/create')
  }

  /**
   * Show edit page form
   */
  public async edit({ params, inertia, response }: HttpContext) {
    const page = await Page.find(params.id)

    if (!page) {
      return response.status(404).send('Page non trouvée')
    }

    return inertia.render('admin/pages/edit', {
      page: new AdminPageController.SingleDto(page).toJson(),
    })
  }

  /**
   * Store a new page
   */
  public async store({ request, response }: HttpContext) {
    const data = request.only(AdminPageController.allowedFields)

    if (!data.slug) {
      // Generate a slug from the title if not provided
      data.slug = string.slug(data.title)
    }
    await Page.create(data)

    return response.redirect().toRoute('/admin/pages')
  }

  /**
   * Update a page
   */
  public async update({ params, request, response }: HttpContext) {
    const page = await Page.find(params.id)

    if (!page) {
      return response.status(404).send('Page non trouvée')
    }

    const data = request.only(AdminPageController.allowedFields)

    page.merge(data)
    await page.save()

    return response.redirect().toRoute('/admin/pages')
  }

  /**
   * Delete a page
   */
  public async destroy({ params, response }: HttpContext) {
    const page = await Page.find(params.id)

    if (!page) {
      return response.status(404).send('Page non trouvée')
    }

    await page.delete()

    return response.redirect().toRoute('/admin/pages')
  }
}
