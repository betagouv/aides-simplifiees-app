import { defineConfig } from '@adonisjs/shield'

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
        '\'unsafe-inline\'', // Required for Vite HMR in dev and inline scripts
        '\'unsafe-eval\'', // Required for Vue in dev mode
        'https://cdn.jsdelivr.net', // For DSFR icons
        'https://stats.data.gouv.fr', // Matomo analytics
      ],
      styleSrc: [
        '\'self\'',
        '\'unsafe-inline\'', // Required for DSFR inline styles
        'https://cdn.jsdelivr.net', // For DSFR styles
      ],
      imgSrc: [
        '\'self\'',
        'data:', // For inline images
        'https:', // Allow all HTTPS images (for external logos, etc.)
      ],
      fontSrc: [
        '\'self\'',
        'data:',
        'https://cdn.jsdelivr.net', // For DSFR fonts
      ],
      connectSrc: [
        '\'self\'',
        'https://stats.data.gouv.fr', // Matomo analytics
        'https://geo.api.gouv.fr', // Address autocomplete
        'https://api-adresse.data.gouv.fr', // Address autocomplete
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
