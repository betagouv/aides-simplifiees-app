import type { HttpContext } from '@adonisjs/core/http'
import Simulateur from '#models/simulateur'

export default class StaticPagesController {
  public async home({ inertia }: HttpContext) {
    // Fetch published simulateurs
    const simulateurs = await Simulateur.query()
      .where('status', 'published')

    return inertia.render('home', {
      simulateurs: simulateurs.map((simulateur) => {
        return simulateur.serialize({
          fields: ['id', 'title', 'slug', 'description', 'pictogramPath'],
        })
      }),
    })
  }

  public async partenaires({ inertia }: HttpContext) {
    return inertia.render('content/pages/partenaires')
  }

  public async integrerNosSimulateurs({ inertia }: HttpContext) {
    return inertia.render('content/pages/integrer-nos-simulateurs')
  }

  public async contact({ inertia }: HttpContext) {
    return inertia.render('content/pages/contact')
  }

  public async statistiques({ inertia }: HttpContext) {
    return inertia.render('statistiques')
  }

  public async cookies({ inertia }: HttpContext) {
    return inertia.render('content/pages/cookies')
  }
}
