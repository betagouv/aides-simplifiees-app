/**
 * Tests for ConditionEvaluator
 */

import { describe, expect, it } from 'vitest'
import { ConditionEvaluator } from '../src/core/condition-evaluator'
import type { SurveyAnswers } from '../src/types/answer'

describe('ConditionEvaluator', () => {
  const evaluator = new ConditionEvaluator()

  describe('Basic equality', () => {
    it('should evaluate simple equality', () => {
      const answers: SurveyAnswers = { status: 'student' }
      expect(evaluator.evaluate('status=student', answers)).toBe(true)
      expect(evaluator.evaluate('status=employed', answers)).toBe(false)
    })

    it('should evaluate inequality', () => {
      const answers: SurveyAnswers = { status: 'student' }
      expect(evaluator.evaluate('status!=employed', answers)).toBe(true)
      expect(evaluator.evaluate('status!=student', answers)).toBe(false)
    })

    it('should handle unanswered questions', () => {
      const answers: SurveyAnswers = {}
      expect(evaluator.evaluate('status=student', answers)).toBe(false)
    })
  })

  describe('Numeric comparisons', () => {
    it('should evaluate greater than', () => {
      const answers: SurveyAnswers = { age: 25 }
      expect(evaluator.evaluate('age>18', answers)).toBe(true)
      expect(evaluator.evaluate('age>30', answers)).toBe(false)
    })

    it('should evaluate greater than or equal', () => {
      const answers: SurveyAnswers = { age: 25 }
      expect(evaluator.evaluate('age>=25', answers)).toBe(true)
      expect(evaluator.evaluate('age>=26', answers)).toBe(false)
    })

    it('should evaluate less than', () => {
      const answers: SurveyAnswers = { age: 25 }
      expect(evaluator.evaluate('age<30', answers)).toBe(true)
      expect(evaluator.evaluate('age<20', answers)).toBe(false)
    })

    it('should evaluate less than or equal', () => {
      const answers: SurveyAnswers = { age: 25 }
      expect(evaluator.evaluate('age<=25', answers)).toBe(true)
      expect(evaluator.evaluate('age<=24', answers)).toBe(false)
    })
  })

  describe('Logical operators', () => {
    it('should evaluate AND conditions', () => {
      const answers: SurveyAnswers = { age: 25, status: 'student' }
      expect(evaluator.evaluate('age>=18&&status=student', answers)).toBe(true)
      expect(evaluator.evaluate('age>=30&&status=student', answers)).toBe(false)
    })

    it('should evaluate OR conditions', () => {
      const answers: SurveyAnswers = { status: 'student' }
      expect(evaluator.evaluate('status=student||status=employed', answers)).toBe(true)
      expect(evaluator.evaluate('status=retired||status=employed', answers)).toBe(false)
    })

    it('should handle complex expressions', () => {
      const answers: SurveyAnswers = { age: 25, status: 'student', country: 'FR' }
      expect(
        evaluator.evaluate('age>=18&&age<=30&&status=student||country=FR', answers),
      ).toBe(true)
    })
  })

  describe('Array operations', () => {
    it('should evaluate includes with single value', () => {
      const answers: SurveyAnswers = { interests: ['sports', 'music'] }
      expect(evaluator.evaluate('interests.includes("sports")', answers)).toBe(true)
      expect(evaluator.evaluate('interests.includes("arts")', answers)).toBe(false)
    })

    it('should evaluate includes with multiple values', () => {
      const answers: SurveyAnswers = { interests: ['sports', 'music'] }
      expect(evaluator.evaluate('interests.includes("sports", "music")', answers)).toBe(
        true,
      )
      expect(evaluator.evaluate('interests.includes("arts", "dance")', answers)).toBe(
        false,
      )
    })

    it('should evaluate includes with string answer', () => {
      const answers: SurveyAnswers = { status: 'student' }
      expect(evaluator.evaluate('status.includes("student", "employed")', answers)).toBe(
        true,
      )
    })

    it('should evaluate excludes with array', () => {
      const answers: SurveyAnswers = { interests: ['sports', 'music'] }
      expect(evaluator.evaluate('interests.excludes("arts")', answers)).toBe(true)
      expect(evaluator.evaluate('interests.excludes("sports")', answers)).toBe(false)
    })

    it('should evaluate excludes with string answer', () => {
      const answers: SurveyAnswers = { status: 'student' }
      expect(evaluator.evaluate('status.excludes("employed")', answers)).toBe(true)
      expect(evaluator.evaluate('status.excludes("student")', answers)).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('should return true for empty condition', () => {
      const answers: SurveyAnswers = {}
      expect(evaluator.evaluate('', answers)).toBe(true)
      expect(evaluator.evaluate('   ', answers)).toBe(true)
    })

    it('should handle null and undefined answers', () => {
      const answers: SurveyAnswers = { value1: null, value2: undefined }
      expect(evaluator.evaluate('value1=something', answers)).toBe(false)
      expect(evaluator.evaluate('value2=something', answers)).toBe(false)
    })

    it('should handle boolean comparisons', () => {
      const answers: SurveyAnswers = { isStudent: true }
      expect(evaluator.evaluate('isStudent=true', answers)).toBe(true)
      expect(evaluator.evaluate('isStudent=false', answers)).toBe(false)
    })
  })

  describe('Custom operators', () => {
    it('should support custom operators', () => {
      const customEvaluator = new ConditionEvaluator({
        customOperators: {
          '~=': {
            evaluate: (left, right) => {
              return String(left).toLowerCase() === String(right).toLowerCase()
            },
          },
        },
      })

      const answers: SurveyAnswers = { name: 'John' }
      expect(customEvaluator.evaluate('name~=john', answers)).toBe(true)
      expect(customEvaluator.evaluate('name~=JOHN', answers)).toBe(true)
    })
  })

  describe('Strict mode', () => {
    it('should throw errors in strict mode for invalid expressions', () => {
      const strictEvaluator = new ConditionEvaluator({ strict: true })
      const answers: SurveyAnswers = {}

      expect(() => strictEvaluator.evaluate('invalid expression', answers)).toThrow()
    })

    it('should return false in non-strict mode for invalid expressions', () => {
      const answers: SurveyAnswers = {}
      expect(evaluator.evaluate('invalid expression', answers)).toBe(false)
    })
  })
})
