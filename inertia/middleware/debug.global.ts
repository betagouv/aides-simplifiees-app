export default defineNuxtRouteMiddleware((to, from) => {
  if (from.query.debug && !to.query.debug) {
    return navigateTo({
      ...to,
      query: {
        ...to.query,
        debug: from.query.debug
      }
    })
  }
})
