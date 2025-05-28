import { defineConfig } from '@adonisjs/cors'

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  enabled: true,
  origin: (origin, request) => {
    // Allow all origins for iframe integration scripts (for reintegrators)
    if (request.request.url().includes('/assets/iframe-integration')) {
      return true
    }

    // For all other routes, be restrictive - only allow specific domains
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3333',
      'https://aides.beta.gouv.fr',
    ]

    return allowedOrigins.includes(origin || '')
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
