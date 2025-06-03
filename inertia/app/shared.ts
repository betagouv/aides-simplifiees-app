import DefaultLayout from '~/layouts/default.vue'
import UserSimulationLayoutfrom from '~/layouts/user-simulation.vue'

export function getLayout(uri: string) {
  let layout = DefaultLayout
  if (
    uri !== '/simulateurs/index'
    && uri !== '/admin/simulateurs/index'
    && (
      uri.match(/^\/simulateurs\/[^/]+|\/simulateur-notion/)
      || uri.match(/^\/content\/aides\/resultats-aide/)
    )
  ) {
    layout = UserSimulationLayoutfrom
  }

  return layout
}
