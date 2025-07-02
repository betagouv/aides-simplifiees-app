import type { HttpContext } from '@adonisjs/core/http'
import Page from '#models/page'
import { Exception } from '@adonisjs/core/exceptions'
import { marked } from 'marked'

export default class PageController {
/**
 * Class to serialize a single page data for sharing types with Inertia in the show view.
 * @see https://docs.adonisjs.com/guides/views-and-templates/inertia#model-serialization
 */
  public static SingleDto = class {
    constructor(private page: Page) { }

    toJson() {
      return {
        id: this.page.id,
        updatedAt: this.page.updatedAt.toString(), // Convert DateTime to string for JSON serialization
        title: this.page.title,
        slug: this.page.slug,
        description: this.page.description,
        metaDescription: this.page.metaDescription,
      }
    }
  }

  /**
   * Affichage d'une notion dont le contenu est géré depuis l'admin
   */
  public async show({ params, inertia }: HttpContext) {
    const page = await Page.query()
      .where('slug', params.page_slug)
      .whereIn('status', ['published', 'unlisted'])
      .first()

    if (!page) {
      throw new Exception('Page non trouvée', { status: 404, code: 'NOT_FOUND' })
    }

    const html = page.content
      ? marked(page.content)
      : ''

    return inertia.render('content/pages/page', {
      page: new PageController.SingleDto(page).toJson(),
      html,
    })
  }
}
