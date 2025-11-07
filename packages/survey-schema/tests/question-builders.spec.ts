/**
 * Tests for Question Builders
 */

import { describe, expect, it } from 'vitest'

import {
  BooleanQuestionBuilder,
  CheckboxQuestionBuilder,
  ComboboxQuestionBuilder,
  DateQuestionBuilder,
  NumberQuestionBuilder,
  RadioQuestionBuilder,
} from '../src/builders/question-builder.js'

describe('question builders', () => {
  describe('radio question builder', () => {
    it('should build a valid radio question', () => {
      const question = new RadioQuestionBuilder('employment')
        .title('Employment Status')
        .description('Select your employment status')
        .addChoice('employed', 'Employed')
        .addChoice('unemployed', 'Unemployed')
        .addChoice('student', 'Student')
        .build()

      expect(question.id).toBe('employment')
      expect(question.type).toBe('radio')
      expect(question.title).toBe('Employment Status')
      expect(question.description).toBe('Select your employment status')
      expect(question.choices).toHaveLength(3)
      expect(question.choices[0]).toEqual({ id: 'employed', title: 'Employed' })
    })

    it('should allow setting choices array', () => {
      const choices = [
        { id: 'yes', title: 'Yes' },
        { id: 'no', title: 'No' },
      ]
      const question = new RadioQuestionBuilder('confirm')
        .title('Confirm')
        .choices(choices)
        .build()

      expect(question.choices).toEqual(choices)
    })

    it('should support conditional visibility', () => {
      const question = new RadioQuestionBuilder('follow-up')
        .title('Follow-up')
        .addChoice('a', 'A')
        .visibleWhen('previous=yes')
        .build()

      expect(question.visibleWhen).toBe('previous=yes')
    })

    it('should throw if no title', () => {
      expect(() => {
        new RadioQuestionBuilder('q1')
          .addChoice('a', 'A')
          .build()
      }).toThrow('Question must have a title')
    })

    it('should throw if no choices', () => {
      expect(() => {
        new RadioQuestionBuilder('q1')
          .title('Question')
          .build()
      }).toThrow('Radio question must have at least one choice')
    })
  })

  describe('checkbox question builder', () => {
    it('should build a valid checkbox question', () => {
      const question = new CheckboxQuestionBuilder('hobbies')
        .title('Hobbies')
        .addChoice('sports', 'Sports')
        .addChoice('reading', 'Reading')
        .addChoice('music', 'Music')
        .build()

      expect(question.type).toBe('checkbox')
      expect(question.choices).toHaveLength(3)
    })

    it('should throw if no choices', () => {
      expect(() => {
        new CheckboxQuestionBuilder('q1')
          .title('Question')
          .build()
      }).toThrow('Checkbox question must have at least one choice')
    })
  })

  describe('number question builder', () => {
    it('should build a valid number question', () => {
      const question = new NumberQuestionBuilder('age')
        .title('Age')
        .description('Enter your age')
        .min(0)
        .max(120)
        .build()

      expect(question.type).toBe('number')
      expect(question.min).toBe(0)
      expect(question.max).toBe(120)
    })

    it('should work without min/max constraints', () => {
      const question = new NumberQuestionBuilder('amount')
        .title('Amount')
        .build()

      expect(question.type).toBe('number')
      expect(question.min).toBeUndefined()
      expect(question.max).toBeUndefined()
    })
  })

  describe('date question builder', () => {
    it('should build a valid date question', () => {
      const question = new DateQuestionBuilder('birthdate')
        .title('Date of Birth')
        .build()

      expect(question.type).toBe('date')
      expect(question.title).toBe('Date of Birth')
    })
  })

  describe('combobox question builder', () => {
    it('should build a valid combobox question', () => {
      const question = new ComboboxQuestionBuilder('city')
        .title('City')
        .description('Select your city')
        .build()

      expect(question.type).toBe('combobox')
      expect(question.title).toBe('City')
    })
  })

  describe('boolean question builder', () => {
    it('should build a valid boolean question', () => {
      const question = new BooleanQuestionBuilder('has-children')
        .title('Do you have children?')
        .build()

      expect(question.type).toBe('boolean')
      expect(question.title).toBe('Do you have children?')
    })
  })

  describe('common question features', () => {
    it('should support description', () => {
      const question = new BooleanQuestionBuilder('test')
        .title('Test Question')
        .description('This is a description')
        .build()

      expect(question.description).toBe('This is a description')
    })

    it('should support visibleWhen as string', () => {
      const question = new BooleanQuestionBuilder('test')
        .title('Test')
        .visibleWhen('other=true')
        .build()

      expect(question.visibleWhen).toBe('other=true')
    })

    it('should support visibleWhen as array', () => {
      const question = new BooleanQuestionBuilder('test')
        .title('Test')
        .visibleWhen(['cond1=true', 'cond2=false'])
        .build()

      expect(question.visibleWhen).toEqual(['cond1=true', 'cond2=false'])
    })
  })
})
