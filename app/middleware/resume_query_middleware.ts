import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class ResumeQueryMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx
    const resume = request.qs().resume
    const referer = request.header('referer')
    // If there's no referer, continue with the request
    if (!referer) {
      return next()
    }

    const refererUrl = new URL(referer)

    // Check if coming from pages where we should force resume
    const shouldForceResume = [
      /\/simulateurs\/[^/]+\/recapitulatif/,
      /\/simulateurs\/[^/]+\/notions\/[^/]+$/,
      /\/simulateurs\/[^/]+\/resultats$/,
    ].some(pattern => pattern.test(refererUrl.pathname))

    /**
     * If user is coming from certain pages and 'resume' query param is not set,
     * we want to force resume by redirecting with resume=true
     */
    if (!resume && shouldForceResume) {
      return response
        .redirect()
        .withQs() // Preserve existing query string
        .withQs({
          resume: 'true',
        })
        .toPath(request.url())
    }

    /**
     * If resume is set but we're not coming from pages that should force resume,
     * we remove the resume param
     */
    if (resume && !shouldForceResume) {
      response
        .redirect()
        .withQs() // Preserve existing query string
        .withQs({
          resume: undefined, // Remove resume param
        })
        .toPath(request.url())
    }

    await next()
  }
}
