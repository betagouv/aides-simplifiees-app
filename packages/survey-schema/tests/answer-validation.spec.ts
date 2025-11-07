/**
 * Tests for AnswerValidator
 */

import { describe, expect, it } from 'vitest'
import { AnswerValidator } from '../src/core/answer-validator'
import type { SurveyQuestionData } from '../src/types/question'

describe('AnswerValidator', () => {
  const validator = new AnswerValidator()

  describe('Radio questions', () => {
    const question: SurveyQuestionData = {
      id: 'status',
      title: 'Employment Status',
      type: 'radio',
      choices: [
        { id: 'student', title: 'Student' },
        { id: 'employed', title: 'Employed' },
        { id: 'unemployed', title: 'Unemployed' },
      ],
    }

    it('should validate correct radio answer', () => {
      const result = validator.validateAnswer(question, 'student')
      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should reject invalid choice', () => {
      const result = validator.validateAnswer(question, 'invalid')
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors?.[0].code).toBe('INVALID_CHOICE')
    })

    it('should reject wrong type', () => {
      const result = validator.validateAnswer(question, 123)
      expect(result.valid).toBe(false)
      expect(result.errors?.[0].code).toBe('INVALID_TYPE')
    })

    it('should require answer for required question', () => {
      const result = validator.validateAnswer(question, null)
      expect(result.valid).toBe(false)
      expect(result.errors?.[0].code).toBe('REQUIRED')
    })

    it('should allow empty answer for non-required question', () => {
      const optionalQuestion = { ...question, required: false }
      const result = validator.validateAnswer(optionalQuestion, null)
      expect(result.valid).toBe(true)
    })
  })

  describe('Checkbox questions', () => {
    const question: SurveyQuestionData = {
      id: 'interests',
      title: 'Interests',
      type: 'checkbox',
      choices: [
        { id: 'sports', title: 'Sports' },
        { id: 'music', title: 'Music' },
        { id: 'arts', title: 'Arts' },
      ],
    }

    it('should validate correct checkbox answer', () => {
      const result = validator.validateAnswer(question, ['sports', 'music'])
      expect(result.valid).toBe(true)
    })

    it('should reject invalid choices', () => {
      const result = validator.validateAnswer(question, ['sports', 'invalid'])
      expect(result.valid).toBe(false)
      expect(result.errors?.[0].code).toBe('INVALID_CHOICE')
    })

    it('should reject non-array answer', () => {
      const result = validator.validateAnswer(question, 'sports')
      expect(result.valid).toBe(false)
      expect(result.errors?.[0].code).toBe('INVALID_TYPE')
    })

    it('should validate empty array for non-required question', () => {
      const optionalQuestion = { ...question, required: false }
      const result = validator.validateAnswer(optionalQuestion, [])
      expect(result.valid).toBe(true)
    })
  })

  describe('Number questions', () => {
    const question: SurveyQuestionData = {
      id: 'age',
      title: 'Age',
      type: 'number',
      min: 0,
      max: 120,
    }

    it('should validate correct number', () => {
      const result = validator.validateAnswer(question, 25)
      expect(result.valid).toBe(true)
    })

    it('should reject number below minimum', () => {
      const result = validator.validateAnswer(question, -5)
      expect(result.valid).toBe(false)
      expect(result.errors?.[0].code).toBe('MIN_VALUE')
    })

    it('should reject number above maximum', () => {
      const result = validator.validateAnswer(question, 150)
      expect(result.valid).toBe(false)
      expect(result.errors?.[0].code).toBe('MAX_VALUE')
    })

    it('should accept boundary values', () => {
      expect(validator.validateAnswer(question, 0).valid).toBe(true)
      expect(validator.validateAnswer(question, 120).valid).toBe(true)
    })

    it('should reject non-numeric values', () => {
      const result = validator.validateAnswer(question, 'twenty-five')
      expect(result.valid).toBe(false)
      expect(result.errors?.[0].code).toBe('INVALID_TYPE')
    })

    it('should accept zero as a valid answer', () => {
      const result = validator.validateAnswer(question, 0)
      expect(result.valid).toBe(true)
    })
  })

  describe('Date questions', () => {
    const question: SurveyQuestionData = {
      id: 'birthdate',
      title: 'Birth Date',
      type: 'date',
    }

    it('should validate ISO format date', () => {
      const result = validator.validateAnswer(question, '1990-01-15')
      expect(result.valid).toBe(true)
    })

    it('should validate DD/MM/YYYY format', () => {
      const result = validator.validateAnswer(question, '15/01/1990')
      expect(result.valid).toBe(true)
    })

    it('should reject invalid date format', () => {
      const result = validator.validateAnswer(question, 'January 15, 1990')
      expect(result.valid).toBe(false)
      expect(result.errors?.[0].code).toBe('INVALID_DATE')
    })

    it('should reject non-string values', () => {
      const result = validator.validateAnswer(question, 123)
      expect(result.valid).toBe(false)
      expect(result.errors?.[0].code).toBe('INVALID_TYPE')
    })
  })

  describe('Boolean questions', () => {
    const question: SurveyQuestionData = {
      id: 'isStudent',
      title: 'Are you a student?',
      type: 'boolean',
    }

    it('should validate true', () => {
      const result = validator.validateAnswer(question, true)
      expect(result.valid).toBe(true)
    })

    it('should validate false', () => {
      const result = validator.validateAnswer(question, false)
      expect(result.valid).toBe(true)
    })

    it('should reject non-boolean values', () => {
      const result = validator.validateAnswer(question, 'yes')
      expect(result.valid).toBe(false)
      expect(result.errors?.[0].code).toBe('INVALID_TYPE')
    })
  })

  describe('Combobox questions', () => {
    const question: SurveyQuestionData = {
      id: 'city',
      title: 'City',
      type: 'combobox',
    }

    it('should validate string answer', () => {
      const result = validator.validateAnswer(question, 'Paris')
      expect(result.valid).toBe(true)
    })

    it('should validate object answer with text and value', () => {
      const result = validator.validateAnswer(question, { text: 'Paris', value: 'paris-75' })
      expect(result.valid).toBe(true)
    })

    it('should reject invalid object', () => {
      const result = validator.validateAnswer(question, { invalid: 'data' })
      expect(result.valid).toBe(false)
      expect(result.errors?.[0].code).toBe('INVALID_TYPE')
    })
  })

  describe('validateAllAnswers', () => {
    const questions: SurveyQuestionData[] = [
      {
        id: 'name',
        title: 'Name',
        type: 'radio',
        choices: [{ id: 'john', title: 'John' }],
      },
      {
        id: 'age',
        title: 'Age',
        type: 'number',
        min: 18,
      },
    ]

    it('should validate all valid answers', () => {
      const answers = { name: 'john', age: 25 }
      const result = validator.validateAllAnswers(questions, answers)
      expect(result.valid).toBe(true)
    })

    it('should collect all errors', () => {
      const answers = { name: 'invalid', age: 15 }
      const result = validator.validateAllAnswers(questions, answers)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)
    })
  })

  describe('Custom validators', () => {
    it('should use custom validator when provided', () => {
      const customValidator = new AnswerValidator({
        customValidators: {
          email: (question, answer) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (typeof answer === 'string' && emailRegex.test(answer)) {
              return { valid: true }
            }
            return {
              valid: false,
              errors: [
                {
                  field: question.id,
                  message: 'Invalid email format',
                  code: 'INVALID_EMAIL',
                },
              ],
            }
          },
        },
      })

      const question: SurveyQuestionData = {
        id: 'email',
        title: 'Email',
        type: 'combobox',
      }

      expect(customValidator.validateAnswer(question, 'test@example.com').valid).toBe(true)
      expect(customValidator.validateAnswer(question, 'invalid-email').valid).toBe(false)
    })
  })
})
