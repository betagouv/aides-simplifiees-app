import DefaultLayout from '~/layouts/default.vue'
import iframeLayout from '~/layouts/iframe.vue'
import UserSimulationLayoutfrom from '~/layouts/user-simulation.vue'
// import { getParam } from '~/utils/url'

export function getLayout(uri: string) {
  let layout = DefaultLayout

  if (uri.match(/\/simulateurs|\/simulateur-notion/)) {
    layout = UserSimulationLayoutfrom
  }

  return layout
}
