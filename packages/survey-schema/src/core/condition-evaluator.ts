/**
 * Condition evaluator for survey question visibility logic
 * Evaluates conditional expressions against survey answers
 */

import type { SurveyAnswers, SurveyAnswerValue } from '../types/answer.js'

/**
 * Custom operator definition for extensibility
 */
export interface ConditionOperator {
  /**
   * Evaluate the operator with left and right operands
   */
  evaluate: (left: SurveyAnswerValue, right: SurveyAnswerValue) => boolean
}

/**
 * Options for the condition evaluator
 */
export interface ConditionEvaluatorOptions {
  /**
   * If true, throws errors on invalid expressions
   * If false, returns false for invalid expressions (default)
   */
  strict?: boolean
  /**
   * Custom operators to extend the default set
   * Key is the operator symbol, value is the operator implementation
   */
  customOperators?: Record<string, ConditionOperator>
}

/**
 * Evaluates conditional expressions for survey question visibility
 *
 * Supports:
 * - Comparison: =, !=, >, >=, <, <=
 * - Logical: &&, ||
 * - Array operations: .includes(), .excludes()
 *
 * @example
 * ```typescript
 * const evaluator = new ConditionEvaluator()
 * const answers = { age: 25, status: 'student' }
 *
 * evaluator.evaluate('age>=18', answers) // true
 * evaluator.evaluate('status=student', answers) // true
 * evaluator.evaluate('age>=18&&status=student', answers) // true
 * ```
 */
export class ConditionEvaluator {
  private readonly options: ConditionEvaluatorOptions

  constructor(options: ConditionEvaluatorOptions = {}) {
    this.options = {
      strict: false,
      ...options,
    }
  }

  /**
   * Evaluates a condition string against a set of answers
   *
   * @param conditionStr - The condition expression to evaluate
   * @param answers - The survey answers to evaluate against
   * @returns true if the condition is met, false otherwise
   */
  evaluate(conditionStr: string, answers: SurveyAnswers): boolean {
    if (!conditionStr || conditionStr.trim() === '') {
      return true
    }

    try {
      return this.evaluateExpression(conditionStr.trim(), answers)
    }
    catch (error) {
      if (this.options.strict) {
        throw error
      }
      // In non-strict mode, return false for invalid expressions
      console.warn(`Invalid condition expression: ${conditionStr}`, error)
      return false
    }
  }

  /**
   * Internal method to evaluate an expression
   */
  private evaluateExpression(expression: string, answers: SurveyAnswers): boolean {
    // Handle logical OR conditions by splitting and evaluating each part
    if (expression.includes('||')) {
      const orConditions = expression.split('||').map(c => c.trim())
      return orConditions.some(condition => this.evaluateExpression(condition, answers))
    }

    // Handle logical AND conditions
    if (expression.includes('&&')) {
      const andConditions = expression.split('&&').map(c => c.trim())
      return andConditions.every(condition => this.evaluateExpression(condition, answers))
    }

    // Handle includes syntax for arrays
    // Example: "services.includes("aide-demenagement", "aide-caution")"
    if (expression.includes('.includes(')) {
      return this.evaluateIncludes(expression, answers)
    }

    // Handle excludes syntax for arrays
    // Example: "statuses.excludes('inactive')"
    if (expression.includes('.excludes(')) {
      return this.evaluateExcludes(expression, answers)
    }

    // Handle comparison operations
    return this.evaluateComparison(expression, answers)
  }

  /**
   * Evaluate includes operation
   */
  private evaluateIncludes(expression: string, answers: SurveyAnswers): boolean {
    const matches = expression.match(/^(.+)\.includes\((.+)\)$/)
    if (!matches || matches.length !== 3) {
      throw new Error(`Invalid includes expression: ${expression}`)
    }

    const questionId = matches[1].trim()
    const valuesToCheck = this.parseListArgument(matches[2])
    const selectedValues = answers[questionId]

    // If no selection made yet, return false
    if (!selectedValues) {
      return false
    }

    // For a single value (radio buttons), check if it's in the values to check
    if (typeof selectedValues === 'string') {
      return valuesToCheck.includes(selectedValues)
    }

    // For multiple values (checkboxes), check if at least one value is in the selected values
    if (Array.isArray(selectedValues)) {
      return valuesToCheck.some(v => selectedValues.includes(v))
    }

    return false
  }

  /**
   * Evaluate excludes operation
   */
  private evaluateExcludes(expression: string, answers: SurveyAnswers): boolean {
    const matches = expression.match(/^(.+)\.excludes\((.+)\)$/)
    if (!matches || matches.length !== 3) {
      throw new Error(`Invalid excludes expression: ${expression}`)
    }

    const questionId = matches[1].trim()
    const valuesToCheck = this.parseListArgument(matches[2])
    const selectedValues = answers[questionId]

    // If no selection made yet, return true (since we're checking for exclusion)
    if (!selectedValues) {
      return true
    }

    // For a single value (radio buttons), check if it's NOT in the values to check
    if (typeof selectedValues === 'string') {
      return !valuesToCheck.includes(selectedValues)
    }

    // For multiple values (checkboxes), check if NONE of the values are in the selected values
    if (Array.isArray(selectedValues)) {
      return !valuesToCheck.some(v => selectedValues.includes(v))
    }

    return true
  }

  /**
   * Parse a comma-separated list argument from function call
   */
  private parseListArgument(arg: string): string[] {
    return arg
      .split(',')
      .map(v => v.trim())
      .map(v => v.replace(/^["'](.+)["']$/, '$1')) // Remove quotes
  }

  /**
   * Evaluate comparison operations
   */
  private evaluateComparison(expression: string, answers: SurveyAnswers): boolean {
    const comparisonOperators = ['>=', '<=', '!=', '>', '<', '=']

    // Include custom operators in the search
    const allOperators = [
      ...comparisonOperators,
      ...Object.keys(this.options.customOperators || {}),
    ]

    // Sort operators by length (longest first) to match multi-char operators before single-char
    // This prevents '~=' from matching '=' first
    allOperators.sort((a, b) => b.length - a.length)

    for (const operator of allOperators) {
      if (expression.includes(operator)) {
        const parts = expression.split(operator)
        if (parts.length !== 2) {
          continue
        }

        const leftSide = parts[0].trim()
        const rightSide = parts[1].trim()
        const leftValue = answers[leftSide]

        // If the question hasn't been answered yet, return false
        if (leftValue === undefined || leftValue === null) {
          return false
        }

        // Parse right side value
        const rightValue = this.parseValue(rightSide)

        // Check for custom operators
        if (this.options.customOperators?.[operator]) {
          return this.options.customOperators[operator].evaluate(leftValue, rightValue)
        }

        // Default comparison logic
        return this.compareValues(leftValue, rightValue, operator)
      }
    }

    throw new Error(`No valid operator found in expression: ${expression}`)
  }

  /**
   * Parse a value from string representation
   */
  private parseValue(value: string): string | number | boolean {
    // Remove quotes if present
    const trimmed = value.replace(/^["'](.+)["']$/, '$1')

    // Try to parse as number
    const asNumber = Number(trimmed)
    if (!Number.isNaN(asNumber)) {
      return asNumber
    }

    // Try to parse as boolean
    if (trimmed === 'true')
      return true
    if (trimmed === 'false')
      return false

    // Return as string
    return trimmed
  }

  /**
   * Compare two values using the specified operator
   */
  private compareValues(
    left: SurveyAnswerValue,
    right: string | number | boolean,
    operator: string,
  ): boolean {
    switch (operator) {
      case '=':
        return left == right // eslint-disable-line eqeqeq
      case '!=':
        return left != right // eslint-disable-line eqeqeq
      case '>':
        return Number(left) > Number(right)
      case '>=':
        return Number(left) >= Number(right)
      case '<':
        return Number(left) < Number(right)
      case '<=':
        return Number(left) <= Number(right)
      default:
        throw new Error(`Unknown operator: ${operator}`)
    }
  }
}
