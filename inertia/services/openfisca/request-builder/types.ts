/**
 * Types for OpenFisca Request Builder
 */

/**
 * Error that occurred during request building
 */
export interface RequestBuildError {
  /**
   * Answer key that caused the error
   */
  answerKey: string

  /**
   * Error message
   */
  message: string

  /**
   * Original error if available
   */
  originalError?: unknown

  /**
   * Type of error
   */
  type: 'UNKNOWN_VARIABLE' | 'UNKNOWN_ENTITY' | 'UNDEFINED_VALUE' | 'UNEXPECTED_VALUE' | 'MAPPING_ERROR'
}

/**
 * Result of request building
 */
export type BuildResult
  = | { success: true, request: OpenFiscaCalculationRequest }
    | { success: false, errors: RequestBuildError[] }

/**
 * Options for request builder
 */
export interface RequestBuilderOptions {
  /**
   * Whether to allow undefined/null values (skip them silently)
   * @default true
   */
  allowUndefinedValues?: boolean

  /**
   * Current period for calculations
   * @default getCurrentPeriod()
   */
  currentPeriod?: string

  /**
   * Whether to log warnings
   * @default true
   */
  logWarnings?: boolean

  /**
   * Whether to throw errors or collect them
   * @default false
   */
  throwOnError?: boolean
}
