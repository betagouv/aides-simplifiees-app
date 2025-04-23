import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware to preserve the 'debug' query parameter from the referer URL
 * to the current request URL.
 */
export default class PreserveIframeParamMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx
    const referer = request.header('referer')

    // Continue if there's no referer
    if (!referer) {
      return next()
    }

    try {
      const refererUrl = new URL(referer)
      const currentIframe = request.qs().iframe
      const refererIframe = refererUrl.searchParams.get('iframe')

      // Only redirect if the referer had iframe but current request doesn't
      if (refererIframe === 'true' && !currentIframe) {
        return response
          .redirect()
          .withQs() // Preserve existing query string
          .withQs({
            iframe: 'true',
          })
          .toPath(request.url())
      }
    }
    catch (error) {
      console.error('Error in PreserveIframeParamMiddleware:', error)
    }

    await next()
  }
}
