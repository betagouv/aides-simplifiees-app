import { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  public async home({ inertia }: HttpContext) {
    return inertia.render('home')
  }

  public async partenaires({ inertia }: HttpContext) {
    return inertia.render('partenaires')
  }

  public async integrerNosSimulateurs({ inertia }: HttpContext) {
    return inertia.render('integrer-nos-simulateurs')
  }

  public async contact({ inertia }: HttpContext) {
    return inertia.render('contact')
  }
}
