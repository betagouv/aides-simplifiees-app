import type { HttpContext } from '@adonisjs/core/http'
import { getLatestIntegrity, IFRAME_SCRIPT_LATEST_VERSION } from '#config/iframe_integration'
import SimulateurController from '#controllers/content/simulateur_controller'
import Simulateur from '#models/simulateur'

export default class StaticPagesController {
  public async showHome({ inertia }: HttpContext) {
    const simulateurs = await Simulateur.query()
      .where('status', 'published')

    return inertia.render('home', {
      simulateurs: new SimulateurController.ListDto(simulateurs).toJson(),
    })
  }

  public async showPartenaires({ inertia }: HttpContext) {
    return inertia.render('static/partenaires')
  }

  public async showIntegrerNosSimulateurs({ inertia }: HttpContext) {
    return inertia.render('static/integrer-nos-simulateurs', {
      iframeSriHash: getLatestIntegrity(),
      iframeVersion: IFRAME_SCRIPT_LATEST_VERSION,
    })
  }

  public async showContact({ inertia }: HttpContext) {
    return inertia.render('static/contact')
  }

  public async showStatistiques({ inertia }: HttpContext) {
    return inertia.render('static/statistiques')
  }

  public async showCookies({ inertia }: HttpContext) {
    return inertia.render('static/cookies')
  }
}
