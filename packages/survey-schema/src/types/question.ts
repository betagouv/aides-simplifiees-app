/**
 * Core type definitions for survey schemas
 * These types are framework-agnostic and can be used in any JavaScript/TypeScript project
 */

/**
 * Represents a single choice option in a multiple-choice question
 */
export interface SurveyChoice {
  /** Unique identifier for this choice */
  id: string
  /** Display text for this choice */
  title: string
  /** Optional tooltip to provide additional context */
  tooltip?: string
  /** If true, selecting this choice will deselect all others (for checkbox questions) */
  exclusive?: boolean
}

/**
 * Configuration for autocomplete functionality
 */
export interface SurveyQuestionAutocompleteConfig {
  /** Placeholder text for the autocomplete input */
  placeholder?: string
  /** Text shown while loading results */
  loadingText?: string
  /** Text shown when no results are found */
  noResultsText?: string
  /** Title for error messages */
  errorTitle?: string
  /** Description for error messages */
  errorDescription?: string
  /** Minimum number of characters before triggering search */
  minSearchLength?: number
}

/**
 * Base question properties shared by all question types
 */
export interface SurveyQuestionBase {
  /** Unique identifier for this question */
  id: string
  /** Question text displayed to the user */
  title: string
  /** Optional additional description or help text */
  description?: string
  /** Placeholder text for input fields */
  placeholder?: string
  /** Whether this question must be answered (default: true) */
  required?: boolean
  /** Condition(s) that must be true for this question to be visible */
  visibleWhen?: string | string[]
  /** Default value for this question */
  default?: string | number | boolean
}

/**
 * Radio button question (single choice from options)
 */
export interface SurveyQuestionRadio extends SurveyQuestionBase {
  type: 'radio'
  /** Available choices for this question */
  choices: SurveyChoice[]
}

/**
 * Checkbox question (multiple choices from options)
 */
export interface SurveyQuestionCheckbox extends SurveyQuestionBase {
  type: 'checkbox'
  /** Available choices for this question */
  choices: SurveyChoice[]
}

/**
 * Number input question
 */
export interface SurveyQuestionNumber extends SurveyQuestionBase {
  type: 'number'
  /** Minimum allowed value */
  min?: number
  /** Maximum allowed value */
  max?: number
  /** Step increment for number inputs */
  step?: number
}

/**
 * Date input question
 */
export interface SurveyQuestionDate extends SurveyQuestionBase {
  type: 'date'
}

/**
 * Combobox (autocomplete) question
 */
export interface SurveyQuestionCombobox extends SurveyQuestionBase {
  type: 'combobox'
  /** Name of the autocomplete function to use */
  autocompleteFunction?: string
  /** Configuration for autocomplete behavior */
  autocompleteConfig?: SurveyQuestionAutocompleteConfig
}

/**
 * Boolean (yes/no) question
 */
export interface SurveyQuestionBoolean extends SurveyQuestionBase {
  type: 'boolean'
}

/**
 * Tooltip configuration for questions
 */
export interface SurveyQuestionTooltip {
  /** Text for the tooltip button */
  buttonLabel?: string
  /** Content of the tooltip */
  content: string
}

/**
 * Notion integration for questions
 */
export interface SurveyQuestionNotion {
  /** Notion page ID */
  id: string
  /** Text for the button linking to Notion */
  buttonLabel: string
}

/**
 * Union type of all possible question types
 * Questions can have either a tooltip OR a notion link, but not both
 */
export type SurveyQuestionData = (
  | SurveyQuestionRadio
  | SurveyQuestionCheckbox
  | SurveyQuestionNumber
  | SurveyQuestionDate
  | SurveyQuestionCombobox
  | SurveyQuestionBoolean
) & (
  | {
    notion?: SurveyQuestionNotion
    tooltip?: never
  }
  | {
    notion?: never
    tooltip?: string | SurveyQuestionTooltip
  }
)

/**
 * Type guard to check if a question is a radio question
 */
export function isRadioQuestion(question: SurveyQuestionData): question is SurveyQuestionRadio {
  return question.type === 'radio'
}

/**
 * Type guard to check if a question is a checkbox question
 */
export function isCheckboxQuestion(
  question: SurveyQuestionData,
): question is SurveyQuestionCheckbox {
  return question.type === 'checkbox'
}

/**
 * Type guard to check if a question is a number question
 */
export function isNumberQuestion(question: SurveyQuestionData): question is SurveyQuestionNumber {
  return question.type === 'number'
}

/**
 * Type guard to check if a question is a date question
 */
export function isDateQuestion(question: SurveyQuestionData): question is SurveyQuestionDate {
  return question.type === 'date'
}

/**
 * Type guard to check if a question is a combobox question
 */
export function isComboboxQuestion(
  question: SurveyQuestionData,
): question is SurveyQuestionCombobox {
  return question.type === 'combobox'
}

/**
 * Type guard to check if a question is a boolean question
 */
export function isBooleanQuestion(
  question: SurveyQuestionData,
): question is SurveyQuestionBoolean {
  return question.type === 'boolean'
}

/**
 * Extract the type of a question
 */
export type SurveyQuestionType = SurveyQuestionData['type']
