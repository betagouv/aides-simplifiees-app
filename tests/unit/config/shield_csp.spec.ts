import shieldConfig from '#config/shield'
import { test } from '@japa/runner'

/**
 * Tests for CSP (Content Security Policy) configuration in shield.ts
 *
 * These tests verify that CSP directives are properly configured
 * to protect against XSS while allowing necessary resources.
 */
const directives = shieldConfig.csp.directives!

test.group('shield.ts CSP - Enabled', () => {
  test('should have CSP enabled', ({ assert }) => {
    assert.isTrue(shieldConfig.csp.enabled)
  })

  test('should not be in report-only mode', ({ assert }) => {
    assert.isFalse(shieldConfig.csp.reportOnly)
  })
})

test.group('shield.ts CSP - default-src', () => {
  test('should restrict default-src to self', ({ assert }) => {
    const defaultSrc = directives.defaultSrc
    assert.isArray(defaultSrc)
    assert.include(defaultSrc, '\'self\'')
  })
})

test.group('shield.ts CSP - script-src', () => {
  test('should include self in script-src', ({ assert }) => {
    const scriptSrc = directives.scriptSrc
    assert.isArray(scriptSrc)
    assert.include(scriptSrc, '\'self\'')
  })

  test('should allow DSFR CDN scripts', ({ assert }) => {
    const scriptSrc = directives.scriptSrc
    assert.include(scriptSrc, 'https://cdn.jsdelivr.net')
  })

  test('should allow Matomo analytics', ({ assert }) => {
    const scriptSrc = directives.scriptSrc
    assert.include(scriptSrc, 'https://stats.data.gouv.fr')
    assert.include(scriptSrc, 'https://stats.beta.gouv.fr')
  })
})

test.group('shield.ts CSP - style-src', () => {
  test('should include self in style-src', ({ assert }) => {
    const styleSrc = directives.styleSrc
    assert.isArray(styleSrc)
    assert.include(styleSrc, '\'self\'')
  })

  test('should allow DSFR CDN styles', ({ assert }) => {
    const styleSrc = directives.styleSrc
    assert.include(styleSrc, 'https://cdn.jsdelivr.net')
  })

  test('should allow inline styles for DSFR', ({ assert }) => {
    const styleSrc = directives.styleSrc
    assert.include(styleSrc, '\'unsafe-inline\'')
  })
})

test.group('shield.ts CSP - img-src', () => {
  test('should include self in img-src', ({ assert }) => {
    const imgSrc = directives.imgSrc
    assert.isArray(imgSrc)
    assert.include(imgSrc, '\'self\'')
  })

  test('should allow data: URIs for inline images', ({ assert }) => {
    const imgSrc = directives.imgSrc
    assert.include(imgSrc, 'data:')
  })

  test('should allow HTTPS images', ({ assert }) => {
    const imgSrc = directives.imgSrc
    assert.include(imgSrc, 'https:')
  })
})

test.group('shield.ts CSP - font-src', () => {
  test('should include self in font-src', ({ assert }) => {
    const fontSrc = directives.fontSrc
    assert.isArray(fontSrc)
    assert.include(fontSrc, '\'self\'')
  })

  test('should allow DSFR CDN fonts', ({ assert }) => {
    const fontSrc = directives.fontSrc
    assert.include(fontSrc, 'https://cdn.jsdelivr.net')
  })
})

test.group('shield.ts CSP - connect-src', () => {
  test('should include self in connect-src', ({ assert }) => {
    const connectSrc = directives.connectSrc
    assert.isArray(connectSrc)
    assert.include(connectSrc, '\'self\'')
  })

  test('should allow Matomo analytics connections', ({ assert }) => {
    const connectSrc = directives.connectSrc
    assert.include(connectSrc, 'https://stats.data.gouv.fr')
    assert.include(connectSrc, 'https://stats.beta.gouv.fr')
  })

  test('should allow geo API connections', ({ assert }) => {
    const connectSrc = directives.connectSrc
    assert.include(connectSrc, 'https://geo.api.gouv.fr')
    assert.include(connectSrc, 'https://api-adresse.data.gouv.fr')
  })
})

test.group('shield.ts CSP - Security directives', () => {
  test('should block object-src', ({ assert }) => {
    const objectSrc = directives.objectSrc
    assert.isArray(objectSrc)
    assert.include(objectSrc, '\'none\'')
  })

  test('should restrict base-uri to self', ({ assert }) => {
    const baseUri = directives.baseUri
    assert.isArray(baseUri)
    assert.include(baseUri, '\'self\'')
  })

  test('should restrict form-action to self', ({ assert }) => {
    const formAction = directives.formAction
    assert.isArray(formAction)
    assert.include(formAction, '\'self\'')
  })

  test('should allow iframe embedding', ({ assert }) => {
    const frameAncestors = directives.frameAncestors
    assert.isArray(frameAncestors)
    assert.include(frameAncestors, '\'self\'')
    // Allow embedding from any https/http source for iframe integration
    assert.include(frameAncestors, 'https:')
  })

  test('should restrict frame-src to self', ({ assert }) => {
    const frameSrc = directives.frameSrc
    assert.isArray(frameSrc)
    assert.include(frameSrc, '\'self\'')
  })
})

test.group('shield.ts - HSTS Configuration', () => {
  test('should have HSTS enabled', ({ assert }) => {
    assert.isTrue(shieldConfig.hsts.enabled)
  })

  test('should have reasonable max-age', ({ assert }) => {
    assert.equal(shieldConfig.hsts.maxAge, '180 days')
  })
})

test.group('shield.ts - Content Type Sniffing', () => {
  test('should have content type sniffing protection enabled', ({ assert }) => {
    assert.isTrue(shieldConfig.contentTypeSniffing.enabled)
  })
})

test.group('shield.ts - CSRF Configuration', () => {
  test('should have CSRF enabled', ({ assert }) => {
    assert.isTrue(shieldConfig.csrf.enabled)
  })

  test('should exclude API routes from CSRF', ({ assert }) => {
    const exceptRoutes = shieldConfig.csrf.exceptRoutes as (ctx: { request: { url: () => string } }) => boolean
    assert.isFunction(exceptRoutes)

    // Test that API routes are excluded
    const mockApiRequest = { url: () => '/api/calculate' }
    const mockNonApiRequest = { url: () => '/simulateur/test' }

    assert.isTrue(exceptRoutes({ request: mockApiRequest }))
    assert.isFalse(exceptRoutes({ request: mockNonApiRequest }))
  })

  test('should protect standard HTTP methods', ({ assert }) => {
    const methods = shieldConfig.csrf.methods
    assert.isArray(methods)
    assert.include(methods, 'POST')
    assert.include(methods, 'PUT')
    assert.include(methods, 'PATCH')
    assert.include(methods, 'DELETE')
  })
})
