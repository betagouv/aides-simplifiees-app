import type { HttpContext } from '@adonisjs/core/http'

export default class StaticPagesController {
  public async home({ inertia }: HttpContext) {
    return inertia.render('home')
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
}
