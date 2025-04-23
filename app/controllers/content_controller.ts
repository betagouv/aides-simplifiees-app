// app/controllers/content_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Aide from '#models/aide'
import Notion from '#models/notion'
import Page from '#models/page'
import { marked } from 'marked'

export default class ContentController {
  // Affichage d'une page
  public async showPage({ params, inertia, response }: HttpContext) {
    const slug = params.slug

    const page = await Page.findBy('slug', slug)

    console.log(page)

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
    const slug = params.slug

    const notion = await Notion.findBy('slug', slug)

    if (!notion) {
      return response.status(404).send('Notion non trouvée')
    }

    const html = await marked(notion.content)

    return inertia.render('content/notions/notion', {
      type: 'notion',
      item: notion,
      html,
    })
  }

  // Affichage d'une aide
  public async showAide({ params, inertia, response }: HttpContext) {
    const slug = params.slug

    const aide = await Aide.findBy('slug', slug)

    if (!aide) {
      return response.status(404).send('Aide non trouvée')
    }

    const html = await marked(aide.content)

    return inertia.render('aides/aide', {
      aide,
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

    return inertia.render('aides/aides', { aides })
  }
}
