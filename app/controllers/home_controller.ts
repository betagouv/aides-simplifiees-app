import { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  public async home({ inertia }: HttpContext) {
    return inertia.render('home')
  }
}
