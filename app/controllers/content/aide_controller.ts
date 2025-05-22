import type { HttpContext } from '@adonisjs/core/http'
import SimulateurController from '#controllers/content/simulateur_controller'
import Aide from '#models/aide'
import Simulateur from '#models/simulateur'
import { marked } from 'marked'

export default class AideController {
/**
 * Class to serialize a single aide data for sharing types with Inertia in the show view.
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
        description: this.aide.description,
        metaDescription: this.aide.metaDescription,
      }
    }
  }

  /**
   * Class to serialize the list of aides data for sharing types with Inertia in the index view.
   */
  public static ListDto = class {
    constructor(private aides: Aide[]) { }

    toJson() {
      return this.aides.map((aide) => {
        return {
          title: aide.title,
          slug: aide.slug,
          description: aide.description,
          instructeur: aide.instructeur,
          type: aide.type,
          usage: aide.usage,
        }
      })
    }
  }

  /**
   * Liste des aides accessibles publiquement
   */
  public async index({ inertia }: HttpContext) {
    const aides = await Aide.query()
      .where('status', 'published')

    return inertia.render('content/aides/aides', {
      aides: new AideController.ListDto(aides).toJson(),
    })
  }

  /**
   * Affichage d'une aide dont le contenu est géré depuis l'admin
   */
  public async show({ params, inertia, response }: HttpContext) {
    // make sure aide is published or unlisted
    const aide = await Aide.query()
      .where('slug', params.aide_slug)
      .whereIn('status', ['published', 'unlisted'])
      .first()

    if (!aide) {
      return response.status(404).send('Aide non trouvée')
    }

    const html = await marked(aide.content)

    return inertia.render('content/aides/aide', {
      aide: new AideController.SingleDto(aide).toJson(),
      html,
    })
  }

  /**
   * Affichage d'une aide contextualisée à un résultat de simulation
   */
  public async showWithResults({ params, inertia, response }: HttpContext) {
    const simulateur = await Simulateur.query()
      .where('slug', params.simulateur_slug)
      .whereIn('status', ['published', 'unlisted'])
      .first()
    const aide = await Aide.query()
      .where('slug', params.aide_slug)
      .whereIn('status', ['published', 'unlisted'])
      .first()

    if (!aide) {
      return response.status(404).send('Aide non trouvée')
    }

    if (!simulateur) {
      return response.status(404).send('Simulateur non trouvé')
    }

    const html = await marked(aide.content)

    return inertia.render('content/aides/resultats-aide', {
      aide: new AideController.SingleDto(aide).toJson(),
      simulateur: new SimulateurController.SingleDto(simulateur).toJson(),
      hash: params.hash,
      html,
    })
  }
}
