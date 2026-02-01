/**
 * Result type for type-safe error handling
 * Inspired by Rust's Result type and functional programming patterns
 *
 * @example
 * // Success case
 * const result = ok({ data: 'value' })
 * if (isOk(result)) {
 *   console.log(result.value.data)
 * }
 *
 * @example
 * // Error case
 * const result = err(new Error('Something went wrong'))
 * if (isErr(result)) {
 *   console.error(result.error.message)
 * }
 *
 * @example
 * // With custom error types
 * type FetchError = 'NOT_FOUND' | 'NETWORK_ERROR' | 'TIMEOUT'
 * const result: Result<User, FetchError> = err('NOT_FOUND')
 */
export type Result<T, E = Error>
  = | { success: true, value: T }
    | { success: false, error: E }

/**
 * Create a successful Result
 */
export function ok<T>(value: T): Result<T, never> {
  return { success: true, value }
}

/**
 * Create a failed Result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error }
}

/**
 * Type guard for successful Results
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true, value: T } {
  return result.success
}

/**
 * Type guard for failed Results
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false, error: E } {
  return !result.success
}

/**
 * Unwrap a Result, returning the value or throwing the error
 * Use with caution - prefer pattern matching with isOk/isErr
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value
  }
  throw result.error
}

/**
 * Unwrap a Result, returning the value or a default
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.value
  }
  return defaultValue
}

/**
 * Map over a successful Result
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value))
  }
  return result
}

/**
 * Map over a failed Result
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (isErr(result)) {
    return err(fn(result.error))
  }
  return result
}

/**
 * Chain Results (flatMap)
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.value)
  }
  return result
}
