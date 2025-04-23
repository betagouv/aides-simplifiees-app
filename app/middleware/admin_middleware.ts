// app/middleware/admin_middleware.ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware pour protéger les routes d'administration
 * Vérifie si l'utilisateur est connecté et a un rôle d'admin
 */
export default class AdminMiddleware {
  /**
   * L'URL vers laquelle rediriger en cas d'accès non autorisé
   */
  redirectTo = '/login'

  async handle(ctx: HttpContext, next: NextFn) {
    // Vérifier si l'utilisateur est authentifié
    await ctx.auth.authenticateUsing(undefined, { loginRoute: this.redirectTo })

    const user = ctx.auth.user

    if (!user) {
      return ctx.response.redirect(this.redirectTo)
    }

    // Vérification si l'utilisateur est un admin
    // Soit par le flag isAdmin, soit par le header Admin-Pass
    const isAdmin = user.isAdmin === true

    if (!isAdmin) {
      return ctx.response.status(403).send('Accès non autorisé')
    }

    return next()
  }
}
