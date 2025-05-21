import type { HttpContext } from '@adonisjs/core/http'
import Aide from '#models/aide'
import Notion from '#models/notion'
import Page from '#models/page'
import Simulateur from '#models/simulateur'
import { marked } from 'marked'

export default class DynamicContentController {
  /**
   * Liste des notions accessibles publiquement
   */
  public async renderPublicNotionsList({ inertia }: HttpContext) {
    const notions = await Notion.query()
      .where('status', 'published')

    return inertia.render('content/notions/notions', {
      notions: notions.map((notion) => {
        return notion.serialize({
          fields: ['title', 'slug', 'description'],
        })
      }) as SerializedNotion[],
    })
  }

  /**
   * Liste des aides accessibles publiquement
   */
  public async renderPublicAidesList({ inertia }: HttpContext) {
    const aides = await Aide.query()
      .where('status', 'published')

    return inertia.render('content/aides/aides', {
      aides: aides.map((aide) => {
        return aide.serialize({
          fields: ['title', 'slug', 'description'],
        })
      }) as SerializedAide[],
    })
  }

  /**
   * Affichage d'une page dont le contenu est géré depuis l'admin
   */
  public async renderPage({ params, inertia, response }: HttpContext) {
    const page = await Page.query()
      .where('slug', params.page_slug)
      .whereIn('status', ['published', 'unlisted'])
      .first()

    if (!page) {
      return response.status(404).send('Page non trouvée')
    }

    const html = await marked(page.content)

    return inertia.render('content/pages/page', {
      page: page.serialize({
        fields: ['id', 'updatedAt', 'title', 'slug', 'metaDescription'],
      }) as Omit<SerializedPage, 'content'>,
      html,
    })
  }

  /**
   * Affichage d'une notion dont le contenu est géré depuis l'admin
   */
  public async renderNotion({ params, inertia, response }: HttpContext) {
    const notion = await Notion.query()
      .where('slug', params.notion_slug)
      .whereIn('status', ['published', 'unlisted'])
      .first()

    if (!notion) {
      return response.status(404).send('Notion non trouvée')
    }

    const html = await marked(notion.content)

    return inertia.render('content/notions/notion', {
      notion: notion.serialize({
        fields: ['id', 'updatedAt', 'title', 'slug', 'metaDescription'],
      }) as Omit<SerializedNotion, 'content'>,
      html,
    })
  }

  /**
   * Affichage d'une notion contextualisée à un simulateur
   */
  public async renderSimulationNotion({ params, inertia, response }: HttpContext) {
    const notion = await Notion.query()
      .where('slug', params.notion_slug)
      .whereIn('status', ['published', 'unlisted'])
      .first()
    const simulateur = await Simulateur.query()
      .where('slug', params.simulateur_slug)
      .whereIn('status', ['published', 'unlisted'])
      .first()

    if (!notion) {
      return response.status(404).send('Notion non trouvée')
    }

    if (!simulateur) {
      return response.status(404).send('Simulateur non trouvé')
    }

    const html = await marked(notion.content)
    return inertia.render('content/notions/simulateur-notion', {
      notion: notion.serialize({
        fields: ['id', 'updatedAt', 'title', 'slug', 'metaDescription'],
      }) as Omit<SerializedNotion, 'content'>,
      simulateur: simulateur.serialize({
        fields: ['id', 'updatedAt', 'title', 'slug', 'metaDescription'],
      }) as Omit<SerializedSimulateur, 'content'>,
      html,
    })
  }

  /**
   * Affichage d'une aide dont le contenu est géré depuis l'admin
   */
  public async renderAide({ params, inertia, response }: HttpContext) {
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
      aide: aide.serialize({
        fields: ['id', 'updatedAt', 'title', 'slug', 'metaDescription'],
      }) as Omit<SerializedAide, 'content'>,
      html,
    })
  }

  /**
   * Affichage d'une aide contextualisée à un résultat de simulation
   */
  public async renderResultatsAide({ params, inertia, response }: HttpContext) {
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
      hash: params.hash,
      aide: aide.serialize({
        fields: ['id', 'updatedAt', 'title', 'slug', 'metaDescription'],
      }) as Omit<SerializedAide, 'content'>,
      simulateur: simulateur.serialize({
        fields: ['id', 'updatedAt', 'title', 'slug', 'metaDescription'],
      }) as Omit<SerializedSimulateur, 'content'>,
      html,
    })
  }
}
