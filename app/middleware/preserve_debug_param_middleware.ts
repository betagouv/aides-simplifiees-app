import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware to preserve the 'debug' query parameter from the referer URL
 * to the current request URL.
 */
export default class PreserveDebugParamMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx
    const referer = request.header('referer')

    // Continue if there's no referer
    if (!referer) {
      return next()
    }

    try {
      const refererUrl = new URL(referer)
      const currentDebug = request.qs().debug
      const refererDebug = refererUrl.searchParams.get('debug')

      // Only redirect if the referer had debug but current request doesn't
      if (refererDebug === 'true' && !currentDebug) {
        return response
          .redirect()
          .withQs() // Preserve existing query string
          .withQs({
            debug: 'true',
          })
          .toPath(request.url())
      }
    }
    catch (error) {
      console.error('Error in PreserveDebugParamMiddleware:', error)
    }

    await next()
  }
}
