import type { HttpContext } from '@adonisjs/core/http'
import Aide from '#models/aide'
import Notion from '#models/notion'
import Page from '#models/page'
import Simulateur from '#models/simulateur'
import string from '@adonisjs/core/helpers/string'

export default class AdminController {
  /**
   * Dashboard de l'admin
   */
  public async dashboard({ inertia }: HttpContext) {
    const [pagesCount, notionsCount, aidesCount, simulateursCount] = await Promise.all([
      Page.query().count('* as total'),
      Notion.query().count('* as total'),
      Aide.query().count('* as total'),
      Simulateur.query().count('* as total'),
    ]
      .map(async (query) => {
        const result = await query
        return Number(result[0].$extras.total)
      }),
    )

    const items: {
      name: string
      description: string
      count: number
      route: string
    }[] = [
      {
        name: 'Pages',
        description: 'Pages statiques du site (ex: CGU, Mentions légales)',
        count: pagesCount,
        route: '/admin/pages',
      },
      {
        name: 'Notions',
        description: 'Administrer les contenus \"notions\", qui expliquent des concepts à l\'utilisateur lors de la simulation',
        count: notionsCount,
        route: '/admin/notions',
      },
      {
        name: 'Aides',
        description: 'Administrer les aides financières utilisés dans les simulateurs',
        count: aidesCount,
        route: '/admin/aides',
      },
      {
        name: 'Simulateurs',
        description: 'Administrer les simulateurs d\'aides financières',
        count: simulateursCount,
        route: '/admin/simulateurs',
      },
    ]

    return inertia.render('admin/dashboard', {
      items,
    })
  }

  /**
   * CRUD pour les Pages
   */

  public async renderListPages({ inertia }: HttpContext) {
    const pages = await Page.all()

    return inertia.render('admin/pages/index', {
      pages: pages.map((page) => {
        return page.serialize({
          fields: {
            pick: ['id', 'updatedAt', 'title', 'slug', 'status', 'description'],
          },
        }) as Omit<SerializedPage, 'content' | 'metaDescription'>
      }),
    })
  }

  public async renderCreatePage({ inertia }: HttpContext) {
    return inertia.render('admin/pages/create')
  }

  public async renderEditPage({ params, inertia, response }: HttpContext) {
    const page = await Page.find(params.id)

    if (!page) {
      return response.status(404).send('Page non trouvée')
    }

    return inertia.render('admin/pages/edit', {
      page: page.serialize({
        fields: {
          pick: ['id', 'updatedAt', 'title', 'slug', 'status', 'description', 'metaDescription', 'content'],
        },
      }) as SerializedPage,
    })
  }

  public async createPage({ request, response }: HttpContext) {
    const data = request.only(['title', 'slug', 'status', 'description', 'metaDescription', 'content'])

    if (!data.slug) {
      // Générer un slug à partir du titre
      data.slug = string.slug(data.title)
    }
    await Page.create(data)

    return response.redirect().toRoute('/admin/pages')
  }

  public async updatePage({ params, request, response }: HttpContext) {
    const page = await Page.find(params.id)

    if (!page) {
      return response.status(404).send('Page non trouvée')
    }

    const data = request.only(['title', 'slug', 'status', 'description', 'metaDescription', 'content'])

    page.merge(data)
    await page.save()

    return response.redirect().toRoute('/admin/pages')
  }

  public async deletePage({ params, response }: HttpContext) {
    const page = await Page.find(params.id)

    if (!page) {
      return response.status(404).send('Page non trouvée')
    }

    await page.delete()

    return response.redirect().toRoute('/admin/pages')
  }

  /**
   * CRUD pour les Notions
   */

  public async renderPublicNotionsList({ inertia }: HttpContext) {
    const notions = await Notion.all()

    return inertia.render('admin/notions/index', {
      notions: notions.map((notion) => {
        return notion.serialize({
          fields: {
            pick: ['id', 'updatedAt', 'title', 'slug', 'status', 'description'],
          },
        }) as Omit<SerializedNotion, 'content' | 'metaDescription'>
      },
      ),
    })
  }

  public async renderCreateNotion({ inertia }: HttpContext) {
    return inertia.render('admin/notions/create')
  }

  public async renderEditNotion({ params, inertia, response }: HttpContext) {
    const notion = await Notion.find(params.id)

    if (!notion) {
      return response.status(404).send('Notion non trouvée')
    }

    return inertia.render('admin/notions/edit', {
      notion: notion.serialize({
        fields: {
          pick: ['id', 'updatedAt', 'title', 'slug', 'status', 'description', 'metaDescription', 'content'],
        },
      }) as SerializedNotion,
    })
  }

  public async createNotion({ request, response }: HttpContext) {
    const data = request.only(['title', 'slug', 'status', 'description', 'metaDescription', 'content'])

    if (!data.slug) {
      // Générer un slug à partir du titre
      data.slug = string.slug(data.title)
    }
    await Notion.create(data)

    return response.redirect().toRoute('/admin/notions')
  }

  public async updateNotion({ params, request, response }: HttpContext) {
    const notion = await Notion.find(params.id)

    if (!notion) {
      return response.status(404).send('Notion non trouvée')
    }

    const data = request.only(['title', 'slug', 'status', 'description', 'metaDescription', 'content'])

    notion.merge(data)
    await notion.save()

    return response.redirect().toRoute('/admin/notions')
  }

  public async deleteNotion({ params, response }: HttpContext) {
    const notion = await Notion.find(params.id)

    if (!notion) {
      return response.status(404).send('Notion non trouvée')
    }

    await notion.delete()

    return response.redirect().toRoute('/admin/notions')
  }

  /**
   * CRUD pour les Aides
   */

  public async renderPublicAidesList({ inertia }: HttpContext) {
    const aides = await Aide.all()

    return inertia.render('admin/aides/index', {
      aides: aides.map((aide) => {
        return aide.serialize({
          fields: {
            pick: ['id', 'updatedAt', 'title', 'slug', 'status', 'description', 'type', 'instructeur'],
          },
        }) as Omit<SerializedAide, 'content' | 'textesLoi' | 'usage' | 'metaDescription'>
      }),
    })
  }

  public async renderCreateAide({ inertia }: HttpContext) {
    return inertia.render('admin/aides/create')
  }

  public async renderEditAide({ params, inertia, response }: HttpContext) {
    const aide = await Aide.find(params.id)

    if (!aide) {
      return response.status(404).send('Aide non trouvée')
    }

    return inertia.render('admin/aides/edit', {
      aide: aide.serialize({
        fields: {
          pick: ['id', 'updatedAt', 'title', 'slug', 'status', 'description', 'metaDescription', 'content', 'type', 'usage', 'instructeur', 'textesLoi'],
        },
      }) as SerializedAide,
    })
  }

  public async createAide({ request, response }: HttpContext) {
    const data = request.only(['title', 'slug', 'status', 'description', 'metaDescription', 'content', 'type', 'usage', 'instructeur', 'textesLoi'])

    // Convertir textesLoi en JSON si présent
    if (data.textesLoi) {
      data.textesLoi = JSON.stringify(data.textesLoi)
    }

    if (!data.slug) {
      // Générer un slug à partir du titre
      data.slug = string.slug(data.title)
    }
    await Aide.create(data)

    return response.redirect().toRoute('/admin/aides')
  }

  public async updateAide({ params, request, response }: HttpContext) {
    const aide = await Aide.find(params.id)

    if (!aide) {
      return response.status(404).send('Aide non trouvée')
    }

    const data = request.only(['title', 'slug', 'status', 'description', 'metaDescription', 'content', 'type', 'usage', 'instructeur', 'textesLoi'])

    // Convertir textesLoi en JSON si présent
    if (data.textesLoi) {
      data.textesLoi = JSON.stringify(data.textesLoi)
    }

    aide.merge(data)
    await aide.save()

    return response.redirect().toRoute('/admin/aides')
  }

  public async deleteAide({ params, response }: HttpContext) {
    const aide = await Aide.find(params.id)

    if (!aide) {
      return response.status(404).send('Aide non trouvée')
    }

    await aide.delete()

    return response.redirect().toRoute('/admin/aides')
  }

  /**
   * CRUD pour les Simulateurs
   */

  public async renderListSimulateurs({ inertia }: HttpContext) {
    const simulateurs = await Simulateur.all()

    return inertia.render('admin/simulateurs/index', {
      simulateurs: simulateurs.map((simulateur) => {
        return simulateur.serialize({
          fields: {
            pick: ['id', 'updatedAt', 'title', 'slug', 'status', 'description', 'pictogramPath'],
          },
        }) as Omit<SerializedSimulateur, 'metaDescription'>
      }),
    })
  }

  public async renderCreateSimulateur({ inertia }: HttpContext) {
    return inertia.render('admin/simulateurs/create')
  }

  public async renderEditSimulateur({ params, inertia, response }: HttpContext) {
    const simulateur = await Simulateur.find(params.id)

    if (!simulateur) {
      return response.status(404).send('Simulateur non trouvé')
    }

    return inertia.render('admin/simulateurs/edit', {
      simulateur: simulateur.serialize({
        fields: {
          pick: ['id', 'updatedAt', 'slug', 'title', 'description', 'pictogramPath', 'status'],
        },
      }) as SerializedSimulateur,
    })
  }

  public async createSimulateur({ request, response }: HttpContext) {
    const data = request.only(['title', 'slug', 'status', 'description', 'metaDescription', 'pictogramPath'])

    if (!data.slug) {
      // Générer un slug à partir du titre
      data.slug = string.slug(data.title)
    }

    await Simulateur.create({
      ...data,
      builtJson: JSON.stringify({}),
    })

    return response.redirect().toRoute('/admin/simulateurs')
  }

  public async updateSimulateur({ params, request, response }: HttpContext) {
    const simulateur = await Simulateur.find(params.id)

    if (!simulateur) {
      return response.status(404).send('Simulateur non trouvé')
    }

    const data = request.only(['title', 'slug', 'status', 'description', 'metaDescription', 'pictogramPath'])

    simulateur.merge(data)
    await simulateur.save()

    return response.redirect().toRoute('/admin/simulateurs')
  }

  public async deleteSimulateur({ params, response }: HttpContext) {
    const simulateur = await Simulateur.find(params.id)

    if (!simulateur) {
      return response.status(404).send('Simulateur non trouvé')
    }

    await simulateur.delete()

    return response.redirect().toRoute('/admin/simulateurs')
  }
}
