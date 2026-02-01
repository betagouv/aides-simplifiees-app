/**
 * Service for tracking user interactions with Matomo
 *
 * Flow Session Tracking:
 * Each survey session gets a unique flowSessionId that links all events
 * (Start, Answer, Submit, Eligibility) for the same user journey.
 * This enables per-user funnel analysis and drop-off tracking.
 *
 * Rate Limiting:
 * Client-side rate limiting prevents excessive tracking calls.
 * Limits: 60 events/minute, 1000 events/session total.
 */

import { captureMessage } from '~/utils/error_tracker'

/**
 * Valid Matomo event actions (whitelist)
 * Only these actions are allowed to be tracked
 */
const VALID_EVENT_ACTIONS = ['Start', 'Answer', 'Submit', 'Eligibility', 'IntermediaryResults'] as const

type ValidEventAction = typeof VALID_EVENT_ACTIONS[number]

/**
 * Rate limiting configuration
 */
const RATE_LIMITS = {
  /** Maximum events allowed per minute */
  eventsPerMinute: 60,
  /** Maximum events allowed per session (page load) */
  eventsPerSession: 1000,
  /** Window size in milliseconds for per-minute tracking */
  windowMs: 60 * 1000,
}

/**
 * Rate limiting state
 */
const rateLimitState = {
  /** Timestamps of recent events (within current window) */
  recentEvents: [] as number[],
  /** Total events tracked this session */
  sessionEventCount: 0,
  /** Whether rate limit warning has been logged this session */
  rateLimitWarned: false,
}

/**
 * Check if we're within rate limits
 * Returns true if the event should be allowed, false if rate limited
 */
function checkRateLimit(): boolean {
  const now = Date.now()
  const windowStart = now - RATE_LIMITS.windowMs

  // Clean up old events outside the window
  rateLimitState.recentEvents = rateLimitState.recentEvents.filter(ts => ts > windowStart)

  // Check session limit
  if (rateLimitState.sessionEventCount >= RATE_LIMITS.eventsPerSession) {
    if (!rateLimitState.rateLimitWarned) {
      captureMessage(
        `[Matomo Rate Limit] Session limit exceeded: ${rateLimitState.sessionEventCount} events`,
        'warning',
      )
      rateLimitState.rateLimitWarned = true
    }
    return false
  }

  // Check per-minute limit
  if (rateLimitState.recentEvents.length >= RATE_LIMITS.eventsPerMinute) {
    if (!rateLimitState.rateLimitWarned) {
      captureMessage(
        `[Matomo Rate Limit] Per-minute limit exceeded: ${rateLimitState.recentEvents.length} events/min`,
        'warning',
      )
      rateLimitState.rateLimitWarned = true
    }
    return false
  }

  // Track this event
  rateLimitState.recentEvents.push(now)
  rateLimitState.sessionEventCount++

  return true
}

/**
 * Flow session storage
 * Maps simulateurSlug -> flowSessionId for tracking user journeys
 */
const flowSessions = new Map<string, string>()

/**
 * Generate a short unique ID for flow tracking
 * Uses first 8 chars of UUID for reasonable uniqueness while keeping event names readable
 */
function generateFlowSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8)
  }
  // Fallback for older browsers
  return Math.random().toString(36).slice(2, 10)
}

/**
 * Get or create a flow session ID for a simulator
 * Creates new ID on Start action, reuses existing for subsequent events
 */
export function getFlowSessionId(simulateurSlug: string, isNewSession = false): string {
  if (isNewSession || !flowSessions.has(simulateurSlug)) {
    const newId = generateFlowSessionId()
    flowSessions.set(simulateurSlug, newId)
    return newId
  }
  return flowSessions.get(simulateurSlug)!
}

/**
 * Clear flow session (useful for testing or explicit reset)
 */
export function clearFlowSession(simulateurSlug: string): void {
  flowSessions.delete(simulateurSlug)
}

/**
 * Validate that an event action is in the allowed whitelist
 * Protects against SQL injection, template injection, and other attack attempts
 */
function validateEventAction(action: string): action is ValidEventAction {
  return VALID_EVENT_ACTIONS.includes(action as ValidEventAction)
}

/**
 * Track an event in Matomo
 */
export function trackEvent(category: string, action: string, name?: string, value?: number) {
  if (import.meta.env.SSR) {
    return
  }

  // Validate action against whitelist
  if (!validateEventAction(action)) {
    // Track invalid action attempt for security monitoring
    captureMessage(
      `[Matomo Security] Invalid event action rejected: "${action}"`,
      'warning',
    )

    // Also log to console for immediate developer feedback in development
    if (import.meta.env.DEV) {
      console.warn(
        `[Matomo] Rejected invalid event action: "${action}". Only allowed: ${VALID_EVENT_ACTIONS.join(', ')}`,
        { category, name, value },
      )
    }

    return
  }

  // Check rate limits to prevent abuse
  if (!checkRateLimit()) {
    // Rate limited - silently skip (already logged warning)
    return
  }

  // Type assertion needed: Matomo's _paq is an external library without TypeScript definitions
  if (typeof window === 'undefined' || !(window as any)._paq) {
    return
  }

  ;(window as any)._paq.push(['trackEvent', category, action, name, value ?? 1])
}

/**
 * Get Matomo category string based on current page context
 *
 * Architecture:
 * - Main site: aides.beta.numerique.gouv.fr
 * - Partner iframe embeds:
 *   monlogementetudiant.beta.gouv.fr (housing aid simulator)
 *   entreprendre.service-public.gouv.fr (business innovation aid)
 *
 * Source detection:
 * - Direct access → 'website' (catch-all for aides.beta.numerique.gouv.fr direct traffic)
 * - Iframe embed → Reads utm_source parameter from URL
 *   Example: ?iframe=true&utm_source=monlogementetudiant.beta.gouv.fr
 *
 * Note: 'website' source is ambiguous - includes:
 * - Legitimate direct traffic to aides.beta.numerique.gouv.fr
 * - Bots/crawlers (no iframe parameters)
 * - Misconfigured iframe embeds (missing utm_source)
 */
export function getMatomoCategory(baseId: string): string {
  let source = 'website'

  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)

    // Check if in iframe
    const isIframe = url.searchParams.get('iframe') === 'true'

    if (isIframe) {
      // Iframe embed - use utm_source if provided, otherwise mark as unknown
      const utmSource = url.searchParams.get('utm_source')
      source = utmSource ? utmSource.replace('iframe@', '') : 'iframe-unknown'
    }
    else {
      // Direct access - use actual hostname instead of generic 'website'
      source = url.hostname
    }
  }

  return `[${baseId}][${source}]Survey`
}

/**
 * Track an answer to a survey question
 * Includes flowSessionId for user journey correlation
 */
export function trackSurveyAnswer(simulateurSlug: string, questionId: string, questionTitle: string) {
  if (import.meta.env.SSR) {
    return
  }
  const category = getMatomoCategory(simulateurSlug)
  const source = category.split(']')[1].slice(1)
  const flowId = getFlowSessionId(simulateurSlug)
  const name = `[${simulateurSlug}][${source}]|flow:${flowId}|q:${questionId}:${questionTitle}`
  trackEvent(category, 'Answer', name)
}

/**
 * Track the start of a survey
 * Creates a new flowSessionId for this user journey
 */
export function trackSurveyStart(simulateurSlug: string) {
  if (import.meta.env.SSR) {
    return
  }
  const category = getMatomoCategory(simulateurSlug)
  const source = category.split(']')[1].slice(1)
  // Start creates a new flow session
  const flowId = getFlowSessionId(simulateurSlug, true)
  const name = `[${simulateurSlug}][${source}]|flow:${flowId}`
  trackEvent(category, 'Start', name)
}

/**
 * Track the submission of a survey
 * Uses existing flowSessionId to link with Start event
 */
export function trackSurveySubmit(simulateurSlug: string) {
  if (import.meta.env.SSR) {
    return
  }
  const category = getMatomoCategory(simulateurSlug)
  const source = category.split(']')[1].slice(1)
  const flowId = getFlowSessionId(simulateurSlug)
  const name = `[${simulateurSlug}][${source}]|flow:${flowId}`
  trackEvent(category, 'Submit', name)
}

/**
 * Track Eligibility
 * Uses existing flowSessionId to link with Start/Submit events
 */
export function trackEligibility(simulateurSlug: string, aidesLength: number) {
  if (import.meta.env.SSR) {
    return
  }
  const category = getMatomoCategory(simulateurSlug)
  const source = category.split(']')[1].slice(1)
  const flowId = getFlowSessionId(simulateurSlug)
  const name = `[${simulateurSlug}][${source}]|flow:${flowId}`
  trackEvent(category, 'Eligibility', name, aidesLength)
}
