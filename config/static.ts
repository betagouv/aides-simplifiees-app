import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/static'

/**
 * Configuration options to tweak the static files middleware.
 * The complete set of options are documented on the
 * official documentation website.
 *
 * https://docs.adonisjs.com/guides/static-assets
 */
const staticServerConfig = defineConfig({
  /**
   * Disable static middleware in production when using nginx as reverse proxy
   * Can be overridden with ENABLE_STATIC_MIDDLEWARE=true environment variable
   */
  enabled: env.get('ENABLE_STATIC_MIDDLEWARE') === 'true' ? true : !app.inProduction,
  etag: true,
  lastModified: true,
  dotFiles: 'ignore',
})

export default staticServerConfig
