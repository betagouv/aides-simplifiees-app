/**
 * Cookie utility functions for managing browser cookies
 */

/**
 * Get a cookie value by name
 * @param {string} name - The name of the cookie to retrieve
 * @returns {string|null} - The cookie value or null if not found
 */
export function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? match[2] : null
}

/**
 * Set a cookie with the given name and value
 * @param {string} name - The name of the cookie to set
 * @param {string} value - The value to store in the cookie
 * @param {number} days - Number of days until the cookie expires (default: 365)
 */
export function setCookie(name, value, days = 365) {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = `expires=${date.toUTCString()}`
  document.cookie = `${name}=${value};${expires};path=/`
}
