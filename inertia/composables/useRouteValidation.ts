import type { RouteLocationNormalizedGeneric } from 'vue-router'

/**
 * A composable function to make sure content routes ([aide_id], [simulateur_id], [notion_id])
 * are valid before rendering the page
 */
export function useContentRouteValidation(
  paramNames: string[],
  route: RouteLocationNormalizedGeneric
): boolean {
  const nuxtApp = useNuxtApp()
  /**
   * We saved the validRoutes in the payload in the init.server.ts plugin
   * This is a map of param names to valid values
   * For example, validRoutes.aide_id = ['aide1', 'aide2', ...]
   */
  const validRoutes = nuxtApp.payload.data.validRoutes
  return paramNames.every((paramName) => {
    const validValues = validRoutes[paramName]
    const paramValue = route.params[paramName]
    const value = Array.isArray(paramValue) ? paramValue[0] : paramValue
    return validValues.includes(value)
  })
}

/**
 * Given a key or an array of keys (param names),
 * returns a function that will actually validate the route
 */
export function getContentRouteValidator (key: string | string[]) {
  const paramNames = Array.isArray(key) ? key : [key]
  return (route: RouteLocationNormalizedGeneric) => {
    return useContentRouteValidation(paramNames, route)
  }
}
