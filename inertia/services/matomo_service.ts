/**
 * Service for tracking user interactions with Matomo
 */

/**
 * Track an event in Matomo
 */
export function trackEvent(category: string, action: string, name?: string, value?: number) {
  if (import.meta.env.SSR) {
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
 */
export function getMatomoCategory(baseId: string): string {
  let source = 'website'

  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href)
    // Check if in iframe
    const isIframe = url.searchParams.get('iframe') === 'true'

    // Get source from URL if in iframe
    if (isIframe) {
      const utmSource = url.searchParams.get('utm_source')
      if (utmSource) {
        source = utmSource.replace('iframe@', '')
      }
    }
  }

  return `[${baseId}][${source}]Survey`
}

/**
 * Track an answer to a survey question
 */
export function trackSurveyAnswer(simulateurSlug: string, questionId: string, questionTitle: string) {
  if (import.meta.env.SSR) {
    return
  }
  const category = getMatomoCategory(simulateurSlug)
  const name = `[${simulateurSlug}][${category.split(']')[1].slice(1)}]${questionId}:${questionTitle}`
  trackEvent(category, 'Answer', name)
}

/**
 * Track the start of a survey
 */
export function trackSurveyStart(simulateurSlug: string) {
  if (import.meta.env.SSR) {
    return
  }
  const category = getMatomoCategory(simulateurSlug)
  const name = `[${simulateurSlug}][${category.split(']')[1].slice(1)}]`
  trackEvent(category, 'Start', name)
}

/**
 * Track the submission of a survey
 */
export function trackSurveySubmit(simulateurSlug: string) {
  if (import.meta.env.SSR) {
    return
  }
  const category = getMatomoCategory(simulateurSlug)
  const name = `[${simulateurSlug}][${category.split(']')[1].slice(1)}]`
  trackEvent(category, 'Submit', name)
}

/**
 * Track Eligibility
 */
export function trackEligibility(simulateurSlug: string, aidesLength: number) {
  if (import.meta.env.SSR) {
    return
  }
  const category = getMatomoCategory(simulateurSlug)
  const name = `[${simulateurSlug}][${category.split(']')[1].slice(1)}]`
  trackEvent(category, 'Eligibility', name, aidesLength)
}
