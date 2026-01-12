import env from '#start/env'
import { defineConfig } from '@adonisjs/shield'

const isDevelopment = env.get('NODE_ENV') === 'development'

const shieldConfig = defineConfig({
  /**
   * Configure CSP policies for your app. Refer documentation
   * to learn more
   */
  csp: {
    enabled: true,
    directives: {
      defaultSrc: ['\'self\''],
      scriptSrc: [
        '\'self\'',
        ...(isDevelopment
          ? [
              '\'unsafe-inline\'', // Required for Vite HMR in dev
              '\'unsafe-eval\'', // Required for Vue in dev mode
            ]
          : []),
        'https://stats.beta.gouv.fr', // Matomo analytics
      ],
      styleSrc: [
        '\'self\'',
        '\'unsafe-inline\'', // Required for Vue dynamic :style bindings
      ],
      imgSrc: [
        '\'self\'',
        'data:', // For inline images
        'https:', // Allow all HTTPS images (for external logos, etc.)
      ],
      fontSrc: [
        '\'self\'',
        'data:',
      ],
      connectSrc: [
        '\'self\'',
        'https://stats.beta.gouv.fr', // Matomo analytics
        ...(isDevelopment
          ? [
              'ws://localhost:*', // Vite HMR websocket
              'wss://localhost:*', // Vite HMR websocket (secure)
            ]
          : []),
      ],
      frameSrc: ['\'self\''],
      objectSrc: ['\'none\''],
      baseUri: ['\'self\''],
      formAction: ['\'self\''],
      frameAncestors: ['\'self\'', 'https:', 'http:'], // Allow embedding in iframes
    },
    reportOnly: false,
  },

  /**
   * Configure CSRF protection options. Refer documentation
   * to learn more
   */
  csrf: {
    enabled: true,
    exceptRoutes: ({ request }) => {
      return request.url().includes('/api/')
    },
    enableXsrfCookie: true,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    cookieOptions: {
      httpOnly: false, // XSRF token needs to be accessible by JavaScript
      secure: true,
      sameSite: 'none', // Required for iframe integration
    },
  },

  /**
   * Control how your website should be embedded inside
   * iFrames
   */
  xFrame: {
    enabled: false,
  },

  /**
   * Force browser to always use HTTPS
   */
  hsts: {
    enabled: true,
    maxAge: '180 days',
  },

  /**
   * Disable browsers from sniffing the content type of a
   * response and always rely on the "content-type" header.
   */
  contentTypeSniffing: {
    enabled: true,
  },
})

export default shieldConfig
