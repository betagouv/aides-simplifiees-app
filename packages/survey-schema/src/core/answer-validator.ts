/**
 * Answer validator for survey responses
 * Validates user answers against question definitions
 */

import type { SurveyAnswerValue } from '../types/answer.js'
import type { SurveyQuestionData } from '../types/question.js'
import {
  isBooleanQuestion,
  isCheckboxQuestion,
  isComboboxQuestion,
  isDateQuestion,
  isNumberQuestion,
  isRadioQuestion,
} from '../types/question.js'

/**
 * Result of answer validation
 */
export interface ValidationResult {
  /** Whether the answer is valid */
  valid: boolean
  /** Validation errors if any */
  errors?: ValidationError[]
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Question ID that failed validation */
  field: string
  /** Human-readable error message */
  message: string
  /** Error code for programmatic handling */
  code: string
  /** Additional error context */
  context?: Record<string, any>
}

/**
 * Options for answer validation
 */
export interface AnswerValidatorOptions {
  /**
   * If true, treats questions as required by default
   * Default: true
   */
  defaultRequired?: boolean
  /**
   * Custom validation functions for specific question types or IDs
   */
  customValidators?: Record<string, (question: SurveyQuestionData, answer: SurveyAnswerValue) => ValidationResult>
}

/**
 * Validates survey answers against question definitions
 *
 * @example
 * ```typescript
 * const validator = new AnswerValidator()
 * const result = validator.validateAnswer(question, userAnswer)
 * if (!result.valid) {
 *   console.error(result.errors)
 * }
 * ```
 */
export class AnswerValidator {
  private readonly options: Required<AnswerValidatorOptions>

  constructor(options: AnswerValidatorOptions = {}) {
    this.options = {
      defaultRequired: true,
      customValidators: {},
      ...options,
    }
  }

  /**
   * Validate a single answer against its question definition
   *
   * @param question - The question definition
   * @param answer - The user's answer
   * @returns Validation result
   */
  validateAnswer(question: SurveyQuestionData, answer: SurveyAnswerValue): ValidationResult {
    // Check for custom validator first
    if (this.options.customValidators[question.id]) {
      return this.options.customValidators[question.id](question, answer)
    }

    const errors: ValidationError[] = []

    // Check if the question is required
    const isRequired = question.required ?? this.options.defaultRequired

    // Check if answer is provided
    const hasAnswer = this.hasAnswer(answer)

    // If question is not required and has no answer, it's valid
    if (!isRequired && !hasAnswer) {
      return { valid: true }
    }

    // If question is required and has no answer, it's invalid
    if (isRequired && !hasAnswer) {
      errors.push({
        field: question.id,
        message: `${question.title} is required`,
        code: 'REQUIRED',
      })
      return { valid: false, errors }
    }

    // Validate based on question type
    const typeValidation = this.validateByType(question, answer)
    if (!typeValidation.valid) {
      errors.push(...(typeValidation.errors || []))
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Validate multiple answers at once
   *
   * @param questions - Array of question definitions
   * @param answers - Map of question ID to answer
   * @returns Validation result with all errors
   */
  validateAllAnswers(
    questions: SurveyQuestionData[],
    answers: Record<string, SurveyAnswerValue>,
  ): ValidationResult {
    const allErrors: ValidationError[] = []

    for (const question of questions) {
      const answer = answers[question.id]
      const result = this.validateAnswer(question, answer)
      if (!result.valid && result.errors) {
        allErrors.push(...result.errors)
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors.length > 0 ? allErrors : undefined,
    }
  }

  /**
   * Check if an answer has a value
   */
  private hasAnswer(answer: SurveyAnswerValue): boolean {
    if (answer === null || answer === undefined || answer === '') {
      return false
    }
    if (Array.isArray(answer) && answer.length === 0) {
      return false
    }
    return true
  }

  /**
   * Validate answer based on question type
   */
  private validateByType(
    question: SurveyQuestionData,
    answer: SurveyAnswerValue,
  ): ValidationResult {
    if (isRadioQuestion(question)) {
      return this.validateRadioAnswer(question, answer)
    }
    if (isCheckboxQuestion(question)) {
      return this.validateCheckboxAnswer(question, answer)
    }
    if (isNumberQuestion(question)) {
      return this.validateNumberAnswer(question, answer)
    }
    if (isDateQuestion(question)) {
      return this.validateDateAnswer(question, answer)
    }
    if (isComboboxQuestion(question)) {
      return this.validateComboboxAnswer(question, answer)
    }
    if (isBooleanQuestion(question)) {
      return this.validateBooleanAnswer(question, answer)
    }

    return { valid: true }
  }

  /**
   * Validate radio button answer
   */
  private validateRadioAnswer(
    question: SurveyQuestionData,
    answer: SurveyAnswerValue,
  ): ValidationResult {
    if (typeof answer !== 'string') {
      return {
        valid: false,
        errors: [
          {
            field: question.id,
            message: `${question.title} must be a string`,
            code: 'INVALID_TYPE',
          },
        ],
      }
    }

    // Check if answer is one of the valid choices
    if ('choices' in question && question.choices) {
      const validChoiceIds = question.choices.map((c) => c.id)
      if (!validChoiceIds.includes(answer)) {
        return {
          valid: false,
          errors: [
            {
              field: question.id,
              message: `${question.title} must be one of: ${validChoiceIds.join(', ')}`,
              code: 'INVALID_CHOICE',
              context: { validChoices: validChoiceIds, provided: answer },
            },
          ],
        }
      }
    }

    return { valid: true }
  }

  /**
   * Validate checkbox answer
   */
  private validateCheckboxAnswer(
    question: SurveyQuestionData,
    answer: SurveyAnswerValue,
  ): ValidationResult {
    if (!Array.isArray(answer)) {
      return {
        valid: false,
        errors: [
          {
            field: question.id,
            message: `${question.title} must be an array`,
            code: 'INVALID_TYPE',
          },
        ],
      }
    }

    // Check if all answers are valid choices
    if ('choices' in question && question.choices) {
      const validChoiceIds = question.choices.map((c) => c.id)
      const invalidChoices = answer.filter((a) => !validChoiceIds.includes(a))
      if (invalidChoices.length > 0) {
        return {
          valid: false,
          errors: [
            {
              field: question.id,
              message: `${question.title} contains invalid choices: ${invalidChoices.join(', ')}`,
              code: 'INVALID_CHOICE',
              context: { validChoices: validChoiceIds, invalidChoices },
            },
          ],
        }
      }
    }

    return { valid: true }
  }

  /**
   * Validate number answer
   */
  private validateNumberAnswer(
    question: SurveyQuestionData,
    answer: SurveyAnswerValue,
  ): ValidationResult {
    const numValue = Number(answer)
    if (Number.isNaN(numValue)) {
      return {
        valid: false,
        errors: [
          {
            field: question.id,
            message: `${question.title} must be a number`,
            code: 'INVALID_TYPE',
          },
        ],
      }
    }

    const errors: ValidationError[] = []

    // Check min constraint
    if ('min' in question && question.min !== undefined && numValue < question.min) {
      errors.push({
        field: question.id,
        message: `${question.title} must be at least ${question.min}`,
        code: 'MIN_VALUE',
        context: { min: question.min, provided: numValue },
      })
    }

    // Check max constraint
    if ('max' in question && question.max !== undefined && numValue > question.max) {
      errors.push({
        field: question.id,
        message: `${question.title} must be at most ${question.max}`,
        code: 'MAX_VALUE',
        context: { max: question.max, provided: numValue },
      })
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Validate date answer
   */
  private validateDateAnswer(
    question: SurveyQuestionData,
    answer: SurveyAnswerValue,
  ): ValidationResult {
    if (typeof answer !== 'string') {
      return {
        valid: false,
        errors: [
          {
            field: question.id,
            message: `${question.title} must be a string`,
            code: 'INVALID_TYPE',
          },
        ],
      }
    }

    // Basic date format validation (can be enhanced)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/
    if (!dateRegex.test(answer)) {
      return {
        valid: false,
        errors: [
          {
            field: question.id,
            message: `${question.title} must be a valid date`,
            code: 'INVALID_DATE',
          },
        ],
      }
    }

    return { valid: true }
  }

  /**
   * Validate combobox answer
   */
  private validateComboboxAnswer(
    question: SurveyQuestionData,
    answer: SurveyAnswerValue,
  ): ValidationResult {
    // Combobox can be string or object with text/value
    if (typeof answer === 'string') {
      return { valid: true }
    }

    if (typeof answer === 'object' && answer !== null && 'text' in answer && 'value' in answer) {
      return { valid: true }
    }

    return {
      valid: false,
      errors: [
        {
          field: question.id,
          message: `${question.title} must be a string or object with text and value`,
          code: 'INVALID_TYPE',
        },
      ],
    }
  }

  /**
   * Validate boolean answer
   */
  private validateBooleanAnswer(
    question: SurveyQuestionData,
    answer: SurveyAnswerValue,
  ): ValidationResult {
    if (typeof answer !== 'boolean') {
      return {
        valid: false,
        errors: [
          {
            field: question.id,
            message: `${question.title} must be a boolean`,
            code: 'INVALID_TYPE',
          },
        ],
      }
    }

    return { valid: true }
  }
}
