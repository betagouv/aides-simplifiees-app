/**
 * Tests for Page and Step Builders
 */

import { describe, expect, it } from 'vitest'

import { PageBuilder } from '../src/builders/page-builder.js'
import { BooleanQuestionBuilder, NumberQuestionBuilder } from '../src/builders/question-builder.js'
import { StepBuilder } from '../src/builders/step-builder.js'

describe('page and step builders', () => {
  describe('page builder', () => {
    it('should build a valid page with questions', () => {
      const q1 = new BooleanQuestionBuilder('q1').title('Question 1').build()
      const q2 = new NumberQuestionBuilder('q2').title('Question 2').build()

      const page = new PageBuilder('page1')
        .addQuestion(q1)
        .addQuestion(q2)
        .build()

      expect(page.id).toBe('page1')
      expect(page.questions).toHaveLength(2)
      expect(page.questions[0].id).toBe('q1')
      expect(page.questions[1].id).toBe('q2')
    })

    it('should support setting questions array', () => {
      const questions = [
        new BooleanQuestionBuilder('q1').title('Q1').build(),
        new BooleanQuestionBuilder('q2').title('Q2').build(),
      ]

      const page = new PageBuilder('page1')
        .questions(questions)
        .build()

      expect(page.questions).toEqual(questions)
    })

    it('should support title', () => {
      const question = new BooleanQuestionBuilder('q1').title('Q1').build()

      const page = new PageBuilder('page1')
        .title('Page Title')
        .addQuestion(question)
        .build()

      expect(page.title).toBe('Page Title')
    })

    it('should throw if no questions', () => {
      expect(() => {
        new PageBuilder('page1').build()
      }).toThrow('Page must have at least one question')
    })
  })

  describe('step builder', () => {
    it('should build a flat step with questions', () => {
      const q1 = new BooleanQuestionBuilder('q1').title('Question 1').build()
      const q2 = new NumberQuestionBuilder('q2').title('Question 2').build()

      const step = new StepBuilder('step1')
        .title('Step 1')
        .addQuestion(q1)
        .addQuestion(q2)
        .build()

      expect(step.id).toBe('step1')
      expect(step.title).toBe('Step 1')
      expect('questions' in step).toBe(true)
      if ('questions' in step) {
        expect(step.questions).toHaveLength(2)
      }
    })

    it('should build a deep step with pages', () => {
      const question = new BooleanQuestionBuilder('q1').title('Q1').build()
      const page = new PageBuilder('page1')
        .addQuestion(question)
        .build()

      const step = new StepBuilder('step1')
        .title('Step 1')
        .addPage(page)
        .build()

      expect(step.id).toBe('step1')
      expect(step.title).toBe('Step 1')
      expect('pages' in step).toBe(true)
      if ('pages' in step) {
        expect(step.pages).toHaveLength(1)
      }
    })

    it('should support setting questions array', () => {
      const questions = [
        new BooleanQuestionBuilder('q1').title('Q1').build(),
        new BooleanQuestionBuilder('q2').title('Q2').build(),
      ]

      const step = new StepBuilder('step1')
        .title('Step 1')
        .questions(questions)
        .build()

      if ('questions' in step) {
        expect(step.questions).toEqual(questions)
      }
    })

    it('should support setting pages array', () => {
      const question = new BooleanQuestionBuilder('q1').title('Q1').build()
      const pages = [
        new PageBuilder('page1').addQuestion(question).build(),
        new PageBuilder('page2').addQuestion(question).build(),
      ]

      const step = new StepBuilder('step1')
        .title('Step 1')
        .pages(pages)
        .build()

      if ('pages' in step) {
        expect(step.pages).toEqual(pages)
      }
    })

    it('should throw if no title', () => {
      const question = new BooleanQuestionBuilder('q1').title('Q1').build()

      expect(() => {
        new StepBuilder('step1')
          .addQuestion(question)
          .build()
      }).toThrow('Step must have a title')
    })

    it('should throw if no pages and no questions', () => {
      expect(() => {
        new StepBuilder('step1')
          .title('Step 1')
          .build()
      }).toThrow('Step must have either pages or questions')
    })

    it('should throw if both pages and questions', () => {
      const question = new BooleanQuestionBuilder('q1').title('Q1').build()
      const page = new PageBuilder('page1').addQuestion(question).build()

      expect(() => {
        new StepBuilder('step1')
          .title('Step 1')
          .addQuestion(question)
          .addPage(page)
          .build()
      }).toThrow('Step cannot have both pages and questions')
    })
  })
})
