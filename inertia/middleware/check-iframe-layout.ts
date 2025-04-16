export default defineNuxtRouteMiddleware((to, from) => {
  if (from.query.iframe && !to.query.iframe) {
    // Preserve the iframe query parameter when navigating to a new page
    return navigateTo({
      ...to,
      query: {
        ...to.query,
        iframe: from.query.iframe
      }
    })
  }
  if (isIframeRoute(to)) {
    return setPageLayout('iframe')
  }
})
