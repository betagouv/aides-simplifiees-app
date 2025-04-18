import type { RouteLocationNormalizedGeneric } from 'vue-router'

export function isIframeRoute(route: RouteLocationNormalizedGeneric) {
  return route.query.iframe === 'true' || route.params.iframe === 'true'
}
