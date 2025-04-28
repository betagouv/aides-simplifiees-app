import DefaultLayout from '~/layouts/default.vue'
import UserSimulationLayoutfrom from '~/layouts/user-simulation.vue'
// import { getParam } from '~/utils/url'

export function getLayout(uri: string) {
  let layout = DefaultLayout
  if (
    uri !== '/simulateurs/index'
    && (
      uri.match(/\/simulateurs\/[^/]+|\/simulateur-notion/)
      || uri.match(/\/aides\/resultats-aide/)
    )
  ) {
    layout = UserSimulationLayoutfrom
  }

  return layout
}
