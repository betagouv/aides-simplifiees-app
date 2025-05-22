import type { HttpContext } from '@adonisjs/core/http'
import Aide from '#models/aide'
import Notion from '#models/notion'
import Page from '#models/page'
import Simulateur from '#models/simulateur'

export default class AdminDashboardController {
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
        description: 'Administrer les contenus "notions", qui expliquent des concepts à l\'utilisateur lors de la simulation',
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
}
