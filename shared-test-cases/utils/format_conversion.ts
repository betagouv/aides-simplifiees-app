/**
 * Format Conversion Utilities for Shared Test Cases
 *
 * Utilities for converting between OpenFisca variable names (snake_case)
 * and application slugs (kebab-case).
 */

/**
 * Converts an OpenFisca variable name to an application slug
 *
 * @param openfiscaVariable - OpenFisca variable name in snake_case
 * @returns Application slug in kebab-case
 *
 * @example
 * toApplicationSlug('aide_mobili_jeune') // Returns: 'aide-mobili-jeune'
 * toApplicationSlug('apl') // Returns: 'apl'
 */
export function toApplicationSlug(openfiscaVariable: string): string {
  return openfiscaVariable.replace(/_/g, '-')
}

/**
 * Converts an application slug to an OpenFisca variable name
 *
 * @param applicationSlug - Application slug in kebab-case
 * @returns OpenFisca variable name in snake_case
 *
 * @example
 * toOpenfiscaVariable('aide-mobili-jeune') // Returns: 'aide_mobili_jeune'
 * toOpenfiscaVariable('apl') // Returns: 'apl'
 */
export function toOpenfiscaVariable(applicationSlug: string): string {
  return applicationSlug.replace(/-/g, '_')
}

/**
 * Type definitions for test case formats
 */

export interface SimulationResultsAides {
  [key: string]: boolean | number
}
