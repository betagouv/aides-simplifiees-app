// app/controllers/admin_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Aide from '#models/aide'
import Notion from '#models/notion'
import Page from '#models/page'
import Simulateur from '#models/simulateur'
import string from '@adonisjs/core/helpers/string'

export default class AdminController {
  // Dashboard d'administration
  public async dashboard({ inertia }: HttpContext) {
    const [pagesCount, notionsCount, aidesCount, simulateursCount] = await Promise.all([
      Page.query().count('* as total'),
      Notion.query().count('* as total'),
      Aide.query().count('* as total'),
      Simulateur.query().count('* as total'),
    ])

    return inertia.render('admin/dashboard', {
      counts: {
        pages: (pagesCount[0] as any).total,
        notions: (notionsCount[0] as any).total,
        aides: (aidesCount[0] as any).total,
        simulateurs: (simulateursCount[0] as any).total,
      },
    })
  }

  // CRUD pour les Pages

  public async listPages({ inertia }: HttpContext) {
    const pages = await Page.all()

    return inertia.render('admin/pages/index', { pages })
  }

  public async createPage({ inertia }: HttpContext) {
    return inertia.render('admin/pages/create')
  }

  public async storePage({ request, response }: HttpContext) {
    const data = request.only(['title', 'content', 'metaDescription'])

    // Générer un slug à partir du titre
    const slug = string.slug(data.title)

    await Page.create({
      ...data,
      slug,
    })

    return response.redirect().toRoute('admin.pages.index')
  }

  public async editPage({ params, inertia, response }: HttpContext) {
    const page = await Page.find(params.id)

    if (!page) {
      return response.status(404).send('Page non trouvée')
    }

    return inertia.render('admin/pages/edit', { page })
  }

  public async updatePage({ params, request, response }: HttpContext) {
    const page = await Page.find(params.id)

    if (!page) {
      return response.status(404).send('Page non trouvée')
    }

    const data = request.only(['title', 'content', 'metaDescription'])

    page.merge(data)
    await page.save()

    return response.redirect().toRoute('admin.pages.index')
  }

  // CRUD pour les Notions
  public async listNotions({ inertia }: HttpContext) {
    const notions = await Notion.all()

    return inertia.render('admin/notions/index', { notions })
  }

  public async createNotion({ inertia }: HttpContext) {
    return inertia.render('admin/notions/create')
  }

  public async storeNotion({ request, response }: HttpContext) {
    const data = request.only(['title', 'content', 'category'])

    // Générer un slug à partir du titre
    const slug = string.slug(data.title)

    await Notion.create({
      ...data,
      slug,
    })

    return response.redirect().toRoute('admin.notions.index')
  }

  public async editNotion({ params, inertia, response }: HttpContext) {
    const notion = await Notion.find(params.id)

    if (!notion) {
      return response.status(404).send('Notion non trouvée')
    }

    return inertia.render('admin/notions/edit', { notion })
  }

  public async updateNotion({ params, request, response }: HttpContext) {
    const notion = await Notion.find(params.id)

    if (!notion) {
      return response.status(404).send('Notion non trouvée')
    }

    const data = request.only(['title', 'content', 'category'])

    notion.merge(data)
    await notion.save()

    return response.redirect().toRoute('admin.notions.index')
  }

  public async deleteNotion({ params, response }: HttpContext) {
    const notion = await Notion.find(params.id)

    if (!notion) {
      return response.status(404).send('Notion non trouvée')
    }

    await notion.delete()

    return response.redirect().toRoute('admin.notions.index')
  }

  // CRUD pour les Aides
  public async listAides({ inertia }: HttpContext) {
    const aides = await Aide.all()

    return inertia.render('admin/aides/index', { aides })
  }

  public async createAide({ inertia }: HttpContext) {
    return inertia.render('admin/aides/create')
  }

  public async storeAide({ request, response }: HttpContext) {
    const data = request.only([
      'title',
      'content',
      'description',
      'type',
      'usage',
      'instructeur',
      'textesLoi',
    ])

    // Générer un slug à partir du titre
    const slug = string.slug(data.title)

    // Convertir textesLoi en JSON si présent
    if (data.textesLoi) {
      data.textesLoi = JSON.stringify(data.textesLoi)
    }

    await Aide.create({
      ...data,
      slug,
    })

    return response.redirect().toRoute('admin.aides.index')
  }

  public async editAide({ params, inertia, response }: HttpContext) {
    const aide = await Aide.find(params.id)

    if (!aide) {
      return response.status(404).send('Aide non trouvée')
    }

    return inertia.render('admin/aides/edit', { aide })
  }

  public async updateAide({ params, request, response }: HttpContext) {
    const aide = await Aide.find(params.id)

    if (!aide) {
      return response.status(404).send('Aide non trouvée')
    }

    const data = request.only([
      'title',
      'content',
      'description',
      'type',
      'usage',
      'instructeur',
      'textesLoi',
    ])

    // Convertir textesLoi en JSON si présent
    if (data.textesLoi) {
      data.textesLoi = JSON.stringify(data.textesLoi)
    }

    aide.merge(data)
    await aide.save()

    return response.redirect().toRoute('admin.aides.index')
  }

  public async deleteAide({ params, response }: HttpContext) {
    const aide = await Aide.find(params.id)

    if (!aide) {
      return response.status(404).send('Aide non trouvée')
    }

    await aide.delete()

    return response.redirect().toRoute('admin.aides.index')
  }

  // CRUD pour les Simulateurs
  public async listSimulateurs({ inertia }: HttpContext) {
    const simulateurs = await Simulateur.all()

    return inertia.render('admin/simulateurs/index', { simulateurs })
  }

  public async createSimulateur({ inertia }: HttpContext) {
    return inertia.render('admin/simulateurs/create')
  }

  public async storeSimulateur({ request, response }: HttpContext) {
    const data = request.only([
      'title',
      'slug',
      'description',
      'shortTitle',
      'pictogramPath',
      'status',
    ])

    await Simulateur.create({
      ...data,
      builtJson: JSON.stringify({}),
    })

    return response.redirect().toRoute('admin.simulateurs.index')
  }

  public async editSimulateur({ params, inertia, response }: HttpContext) {
    const simulateur = await Simulateur.find(params.id)

    if (!simulateur) {
      return response.status(404).send('Simulateur non trouvé')
    }

    return inertia.render('admin/simulateurs/edit', { simulateur })
  }

  public async updateSimulateur({ params, request, response }: HttpContext) {
    const simulateur = await Simulateur.find(params.id)

    if (!simulateur) {
      return response.status(404).send('Simulateur non trouvé')
    }

    const data = request.only([
      'title',
      'description',
      'shortTitle',
      'pictogramPath',
      'status',
    ])

    simulateur.merge(data)
    await simulateur.save()

    return response.redirect().toRoute('admin.simulateurs.index')
  }

  public async deleteSimulateur({ params, response }: HttpContext) {
    const simulateur = await Simulateur.find(params.id)

    if (!simulateur) {
      return response.status(404).send('Simulateur non trouvé')
    }

    await simulateur.delete()

    return response.redirect().toRoute('admin.simulateurs.index')
  }
}
