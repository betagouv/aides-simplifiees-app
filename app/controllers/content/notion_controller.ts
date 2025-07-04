import type { HttpContext } from '@adonisjs/core/http'
import SimulateurController from '#controllers/content/simulateur_controller'
import Notion from '#models/notion'
import Simulateur from '#models/simulateur'
import { Exception } from '@adonisjs/core/exceptions'
import { marked } from 'marked'

export default class NotionController {
  /**
   * Class to serialize a single notion data for sharing types with Inertia in the show view.
   * @see https://docs.adonisjs.com/guides/views-and-templates/inertia#model-serialization
   */
  public static SingleDto = class {
    constructor(private notion: Notion) { }

    toJson() {
      return {
        id: this.notion.id,
        updatedAt: this.notion.updatedAt.toString(), // Convert DateTime to string for JSON serialization
        title: this.notion.title,
        slug: this.notion.slug,
        description: this.notion.description,
        metaDescription: this.notion.metaDescription,
      }
    }
  }

  /**
   * Class to serialize the list of notions data for sharing types with Inertia in the index view.
   */
  public static ListDto = class {
    constructor(private notions: Notion[]) { }

    toJson() {
      return this.notions.map((notion) => {
        return {
          title: notion.title,
          slug: notion.slug,
          description: notion.description,
        }
      })
    }
  }

  /**
   * Liste des notions accessibles publiquement
   */
  public async index({ inertia }: HttpContext) {
    const notions = await Notion.query()
      .where('status', 'published')

    return inertia.render('content/notions/notions', {
      notions: new NotionController.ListDto(notions).toJson(),
    })
  }

  /**
   * Affichage d'une notion dont le contenu est géré depuis l'admin
   */
  public async show({ params, inertia }: HttpContext) {
    const notion = await Notion.query()
      .where('slug', params.notion_slug)
      .whereIn('status', ['published', 'unlisted'])
      .first()

    if (!notion) {
      throw new Exception('Notion non trouvée', { status: 404, code: 'NOT_FOUND' })
    }

    const html = notion.content
      ? await marked(notion.content)
      : ''

    return inertia.render('content/notions/notion', {
      notion: new NotionController.SingleDto(notion).toJson(),
      html,
    })
  }

  /**
   * Affichage d'une notion contextualisée à un simulateur
   */
  public async showWithSimulateur({ params, inertia }: HttpContext) {
    const notion = await Notion.query()
      .where('slug', params.notion_slug)
      .whereIn('status', ['published', 'unlisted'])
      .first()
    const simulateur = await Simulateur.query()
      .where('slug', params.simulateur_slug)
      .whereIn('status', ['published', 'unlisted'])
      .first()

    if (!notion) {
      throw new Exception('Notion non trouvée', { status: 404, code: 'NOT_FOUND' })
    }

    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
    }

    const html = notion.content
      ? await marked(notion.content)
      : ''

    return inertia.render('content/notions/simulateur-notion', {
      notion: new NotionController.SingleDto(notion).toJson(),
      simulateur: new SimulateurController.SingleDto(simulateur).toJson(),
      html,
    })
  }
}
