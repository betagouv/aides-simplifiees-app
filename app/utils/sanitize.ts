import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitization configuration for different contexts
 */
interface SanitizeConfig {
  /**
   * Allow specific HTML tags
   */
  ALLOWED_TAGS?: string[]

  /**
   * Allow specific attributes
   */
  ALLOWED_ATTR?: string[]

  /**
   * Allow data attributes (data-*)
   */
  ALLOW_DATA_ATTR?: boolean
}

/**
 * Default configuration for rich text content
 * Allows common formatting tags but blocks scripts and iframes
 */
const RICH_TEXT_CONFIG: SanitizeConfig = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'a',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'code',
    'pre',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'img',
    'div',
    'span',
  ],
  ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'class', 'id', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
}

/**
 * Strict configuration for plain text with minimal formatting
 * Only allows basic text formatting
 */
const PLAIN_TEXT_CONFIG: SanitizeConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * 
 * Uses DOMPurify to remove potentially dangerous HTML/JavaScript
 * while preserving safe formatting tags.
 * 
 * @param dirty - Untrusted HTML string
 * @param config - Sanitization configuration (defaults to RICH_TEXT_CONFIG)
 * @returns Sanitized HTML string safe for rendering
 * 
 * @example
 * ```typescript
 * // Sanitize CMS content
 * const clean = sanitizeHtml(cmsContent)
 * 
 * // Sanitize with custom config
 * const clean = sanitizeHtml(userInput, PLAIN_TEXT_CONFIG)
 * 
 * // Sanitize in Vue template
 * <div v-html="sanitizeHtml(content)" />
 * ```
 */
export function sanitizeHtml(dirty: string, config: SanitizeConfig = RICH_TEXT_CONFIG): string {
  if (!dirty || typeof dirty !== 'string') {
    return ''
  }

  return DOMPurify.sanitize(dirty, config)
}

/**
 * Sanitize plain text content with minimal formatting
 * 
 * Allows only basic text formatting (bold, italic, paragraphs)
 * and strips everything else including links and images.
 * 
 * @param dirty - Untrusted HTML string
 * @returns Sanitized HTML string with minimal formatting
 */
export function sanitizePlainText(dirty: string): string {
  return sanitizeHtml(dirty, PLAIN_TEXT_CONFIG)
}

/**
 * Strip all HTML tags and return plain text only
 * 
 * Useful for:
 * - Meta descriptions
 * - Email subject lines
 * - Plain text previews
 * 
 * @param html - HTML string
 * @returns Plain text without any HTML tags
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

/**
 * Sanitize URL to ensure it's safe
 * 
 * Blocks javascript:, data:, and other dangerous protocols
 * 
 * @param url - URL string to sanitize
 * @returns Sanitized URL or empty string if dangerous
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return ''
  }

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
  const normalizedUrl = url.toLowerCase().trim()

  for (const protocol of dangerousProtocols) {
    if (normalizedUrl.startsWith(protocol)) {
      return ''
    }
  }

  // Allow only http, https, mailto, tel, and relative URLs
  if (
    normalizedUrl.startsWith('http://') ||
    normalizedUrl.startsWith('https://') ||
    normalizedUrl.startsWith('mailto:') ||
    normalizedUrl.startsWith('tel:') ||
    normalizedUrl.startsWith('/') ||
    normalizedUrl.startsWith('#')
  ) {
    return url
  }

  // If it doesn't start with a protocol, assume it's relative
  if (!normalizedUrl.includes(':')) {
    return url
  }

  // Block everything else
  return ''
}

export { PLAIN_TEXT_CONFIG, RICH_TEXT_CONFIG }
