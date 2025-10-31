import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import app from '@adonisjs/core/services/app'
import { RateLimiter } from 'limiter'

/**
 * Rate limiting configuration per route
 */
interface ThrottleConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number

  /**
   * Time window in milliseconds
   */
  windowMs: number

  /**
   * Message returned when rate limit is exceeded
   */
  message?: string

  /**
   * Status code returned when rate limit is exceeded
   */
  statusCode?: number
}

/**
 * Default throttle configuration
 */
const DEFAULT_CONFIG: ThrottleConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
  statusCode: 429,
}

/**
 * Rate limiters cache (one per IP address)
 */
const limiters = new Map<string, RateLimiter>()

/**
 * Middleware to throttle requests based on IP address
 *
 * Prevents abuse by limiting the number of requests from a single IP
 * in a given time window.
 *
 * Example usage in routes:
 * ```typescript
 * router.post('/api/calculate', [OpenFiscaController, 'calculate'])
 *   .use(throttleMiddleware({ maxRequests: 10, windowMs: 60000 }))
 * ```
 */
export default function throttleMiddleware(config: Partial<ThrottleConfig> = {}) {
  const finalConfig: ThrottleConfig = { ...DEFAULT_CONFIG, ...config }

  return async ({ request, response }: HttpContext, next: NextFn) => {
    // Skip rate limiting in test environment
    if (app.inTest) {
      return next()
    }

    // Get client IP address
    const ip = request.ip()

    // Get or create rate limiter for this IP
    let limiter = limiters.get(ip)
    if (!limiter) {
      // Create new rate limiter for this IP
      limiter = new RateLimiter({
        tokensPerInterval: finalConfig.maxRequests,
        interval: finalConfig.windowMs,
      })
      limiters.set(ip, limiter)
    }

    // Try to remove a token
    const hasToken = await limiter.tryRemoveTokens(1)

    if (!hasToken) {
      // Rate limit exceeded
      return response.status(finalConfig.statusCode!).json({
        error: finalConfig.message,
        retryAfter: Math.ceil(finalConfig.windowMs / 1000), // seconds
      })
    }

    // Add rate limit headers
    response.header('X-RateLimit-Limit', String(finalConfig.maxRequests))
    response.header('X-RateLimit-Remaining', String(Math.floor(limiter.getTokensRemaining())))
    response.header(
      'X-RateLimit-Reset',
      String(Date.now() + finalConfig.windowMs),
    )

    await next()
  }
}

/**
 * Cleanup function to remove old rate limiters
 * Should be called periodically (e.g., via a cron job)
 * Clears all rate limiters to free memory
 */
export function cleanupRateLimiters() {
  limiters.clear()
}
