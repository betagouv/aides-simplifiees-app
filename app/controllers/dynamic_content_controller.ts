// app/controllers/content_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Aide from '#models/aide'
import Notion from '#models/notion'
import Page from '#models/page'
import Simulateur from '#models/simulateur'
import { marked } from 'marked'

export default class DynamicContentController {
  // Affichage d'une page
  public async showPage({ params, inertia, response }: HttpContext) {
    const page = await Page.findBy('slug', params.page_slug)

    if (!page) {
      return response.status(404).send('Page non trouvée')
    }

    const content = await marked(page.content)

    return inertia.render('content/pages/page', {
      page,
      content,
    })
  }

  // Affichage d'une notion
  public async showNotion({ params, inertia, response }: HttpContext) {
    const notion = await Notion.findBy('slug', params.notion_slug)

    if (!notion) {
      return response.status(404).send('Notion non trouvée')
    }

    const html = await marked(notion.content)

    return inertia.render('content/notions/notion', {
      notion,
      html,
    })
  }

  // Affichage d'une notion contextualisée à un simulateur
  public async showSimulateurNotion({ params, inertia, response }: HttpContext) {
    const notion = await Notion.findBy('slug', params.notion_slug)
    const simulateur = await Simulateur.findBy('slug', params.simulateur_slug)

    if (!notion) {
      return response.status(404).send('Notion non trouvée')
    }

    if (!simulateur) {
      return response.status(404).send('Simulateur non trouvé')
    }

    const html = await marked(notion.content)
    return inertia.render('content/notions/simulateur-notion', {
      notion,
      simulateur,
      html,
    })
  }

  // Affichage d'une aide
  public async showAide({ params, inertia, response }: HttpContext) {
    const aide = await Aide.findBy('slug', params.aide_slug)

    if (!aide) {
      return response.status(404).send('Aide non trouvée')
    }

    const html = await marked(aide.content)

    return inertia.render('content/aides/aide', {
      aide,
      html,
    })
  }

  // Affichage d'une aide contextualisée à un résultat de simulation
  public async showResultatsAide({ params, inertia, response }: HttpContext) {
    const simulateur = await Simulateur.findBy('slug', params.simulateur_slug)
    const aide = await Aide.findBy('slug', params.aide_slug)

    if (!aide) {
      return response.status(404).send('Aide non trouvée')
    }

    if (!simulateur) {
      return response.status(404).send('Simulateur non trouvé')
    }

    const html = await marked(aide.content)
    return inertia.render('content/aides/resultats-aide', {
      hash: params.hash,
      aide,
      simulateur,
      html,
    })
  }

  // Liste des notions
  public async listNotions({ inertia }: HttpContext) {
    const notions = await Notion.all()

    return inertia.render('content/notions/notions', { notions })
  }

  // Liste des aides
  public async listAides({ inertia }: HttpContext) {
    const aides = await Aide.all()

    return inertia.render('content/aides/aides', { aides })
  }
}
