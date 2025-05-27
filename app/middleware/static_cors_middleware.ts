import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware CORS spécifique pour les fichiers statiques iframe-integration
 * Ce middleware ajoute les en-têtes CORS nécessaires pour permettre
 * l'utilisation de crossorigin="anonymous" avec SRI
 */
export default class StaticCorsMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Vérifier si c'est une requête pour un fichier iframe-integration
    if (ctx.request.url().includes('/assets/iframe-integration')) {
      // Ajouter les en-têtes CORS pour permettre l'accès depuis n'importe quel domaine
      ctx.response.header('Access-Control-Allow-Origin', '*')
      ctx.response.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
      ctx.response.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Origin')
      ctx.response.header('Access-Control-Max-Age', '86400') // 24 heures

      // Si c'est une requête OPTIONS (preflight), répondre immédiatement
      if (ctx.request.method() === 'OPTIONS') {
        return ctx.response.status(204).send('')
      }
    }

    // Continuer avec le middleware suivant
    await next()
  }
}
