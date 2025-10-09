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

declare global {
  /**
   * Represents the value of a combobox answer
   * Contains both the display text and the actual value
   */
  interface ComboboxAnswer {
    text: string
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
  type SurveyAnswerValue
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
  type SurveyAnswers = Record<string, SurveyAnswerValue>
}

export {}
