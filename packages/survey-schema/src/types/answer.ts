/**
 * Type definitions for survey answer values
 *
 * Survey answers can be various types depending on the question type:
 * - string: radio buttons, dates, text inputs
 * - number: numeric inputs
 * - boolean: boolean toggles
 * - string[]: checkboxes (multiple selections)
 * - ComboboxAnswer: combobox with text/value pair
 * - null/undefined: unanswered questions
 */

/**
 * Represents the value of a combobox answer
 * Contains both the display text and the actual value
 */
export interface ComboboxAnswer {
  /** Display text shown to the user */
  text: string
  /** Actual value stored */
  value: string
}

/**
 * Union type representing all possible survey answer values
 * Maps to question types:
 * - radio/date/text → string
 * - number → number
 * - boolean → boolean
 * - checkbox → string[]
 * - combobox → ComboboxAnswer
 * - unanswered → null | undefined
 */
export type SurveyAnswerValue
  = | string
    | number
    | boolean
    | string[]
    | ComboboxAnswer
    | null
    | undefined

/**
 * Complete set of answers for a survey
 * Keys are question IDs, values are the typed answer values
 */
export type SurveyAnswers = Record<string, SurveyAnswerValue>

/**
 * Type guard to check if an answer is a ComboboxAnswer
 */
export function isComboboxAnswer(value: SurveyAnswerValue): value is ComboboxAnswer {
  return (
    value !== null
    && value !== undefined
    && typeof value === 'object'
    && 'text' in value
    && 'value' in value
  )
}

/**
 * Type guard to check if an answer is a string array (checkbox answer)
 */
export function isCheckboxAnswer(value: SurveyAnswerValue): value is string[] {
  return Array.isArray(value)
}

/**
 * Type guard to check if an answer is a boolean
 */
export function isBooleanAnswer(value: SurveyAnswerValue): value is boolean {
  return typeof value === 'boolean'
}

/**
 * Type guard to check if an answer is a number
 */
export function isNumberAnswer(value: SurveyAnswerValue): value is number {
  return typeof value === 'number'
}

/**
 * Type guard to check if an answer is a string
 */
export function isStringAnswer(value: SurveyAnswerValue): value is string {
  return typeof value === 'string'
}

/**
 * Type guard to check if an answer is defined (not null or undefined)
 */
export function isAnswerDefined(
  value: SurveyAnswerValue,
): value is Exclude<SurveyAnswerValue, null | undefined> {
  return value !== null && value !== undefined
}
