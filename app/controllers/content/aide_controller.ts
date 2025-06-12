import type { HttpContext } from '@adonisjs/core/http'
import SimulateurController from '#controllers/content/simulateur_controller'
import Aide from '#models/aide'
import Simulateur from '#models/simulateur'
import { Exception } from '@adonisjs/core/exceptions'
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
        typeAide: this.aide.typeAide
          ? {
              id: this.aide.typeAide.id,
              slug: this.aide.typeAide.slug,
              label: this.aide.typeAide.label,
              iconName: this.aide.typeAide.iconName,
            }
          : null,
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
          typeAide: aide.typeAide
            ? {
                id: aide.typeAide.id,
                slug: aide.typeAide.slug,
                label: aide.typeAide.label,
                iconName: aide.typeAide.iconName,
              }
            : null,
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
      .preload('typeAide')

    return inertia.render('content/aides/aides', {
      aides: new AideController.ListDto(aides).toJson(),
    })
  }

  /**
   * Affichage d'une aide dont le contenu est géré depuis l'admin
   */
  public async show({ params, inertia }: HttpContext) {
    // make sure aide is published or unlisted
    const aide = await Aide.query()
      .where('slug', params.aide_slug)
      .whereIn('status', ['published', 'unlisted'])
      .preload('typeAide')
      .first()

    if (!aide) {
      throw new Exception('Aide non trouvée', { status: 404, code: 'NOT_FOUND' })
    }

    const html = aide.content
      ? marked(aide.content)
      : ''

    return inertia.render('content/aides/aide', {
      aide: new AideController.SingleDto(aide).toJson(),
      html,
    })
  }

  /**
   * Affichage d'une aide contextualisée à un résultat de simulation
   */
  public async showWithResults({ params, inertia }: HttpContext) {
    const simulateur = await Simulateur.query()
      .where('slug', params.simulateur_slug)
      .whereIn('status', ['published', 'unlisted'])
      .first()
    const aide = await Aide.query()
      .where('slug', params.aide_slug)
      .whereIn('status', ['published', 'unlisted'])
      .preload('typeAide')
      .first()

    if (!aide) {
      throw new Exception('Aide non trouvée', { status: 404, code: 'NOT_FOUND' })
    }

    if (!simulateur) {
      throw new Exception('Simulateur non trouvé', { status: 404, code: 'NOT_FOUND' })
    }

    const html = aide.content
      ? marked(aide.content)
      : ''

    return inertia.render('content/aides/resultats-aide', {
      aide: new AideController.SingleDto(aide).toJson(),
      simulateur: new SimulateurController.SingleDto(simulateur).toJson(),
      hash: params.hash,
      html,
    })
  }
}
