/**
 * Tests for SchemaValidator
 */

import type { PublicodesSurveySchema, SurveySchema } from '../src/types/schema.js'

import { describe, expect, it } from 'vitest'

import basicSchema from '../examples/basic-survey.json' with { type: 'json' }
import { SchemaValidator } from '../src/validation/schema-validator.js'

describe('schema validator', () => {
  const validator = new SchemaValidator()

  describe('valid schemas', () => {
    it('should validate a complete publicodes schema', () => {
      const result = validator.validate(basicSchema)
      expect(result.valid).toBe(true)
      expect(result.errors).toBeUndefined()
    })

    it('should validate a minimal schema', () => {
      const schema: SurveySchema = {
        id: 'test-survey',
        version: '1.0.0',
        title: 'Test Survey',
        description: 'A test survey',
        engine: 'publicodes',
        forceRefresh: false,
        dispositifs: [],
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            pages: [
              {
                id: 'page1',
                questions: [
                  {
                    id: 'question1',
                    title: 'Question 1',
                    type: 'boolean',
                  },
                ],
              },
            ],
          },
        ],
      }

      const result = validator.validate(schema)
      expect(result.valid).toBe(true)
    })

    it('should validate openfisca schema', () => {
      const schema: SurveySchema = {
        id: 'openfisca-test',
        version: '1.0.0',
        title: 'OpenFisca Test',
        description: 'Test schema',
        engine: 'openfisca',
        forceRefresh: false,
        questionsToApi: ['q1', 'q2'],
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            questions: [
              {
                id: 'q1',
                title: 'Question 1',
                type: 'number',
                min: 0,
              },
            ],
          },
        ],
      }

      const result = validator.validate(schema)
      expect(result.valid).toBe(true)
    })

    it('should validate all question types', () => {
      const schema: PublicodesSurveySchema = {
        id: 'all-types',
        version: '1.0.0',
        title: 'All Question Types',
        description: 'Test all types',
        engine: 'publicodes',
        forceRefresh: false,
        dispositifs: [],
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            pages: [
              {
                id: 'page1',
                questions: [
                  {
                    id: 'radio-q',
                    title: 'Radio',
                    type: 'radio',
                    choices: [{ id: 'opt1', title: 'Option 1' }],
                  },
                  {
                    id: 'checkbox-q',
                    title: 'Checkbox',
                    type: 'checkbox',
                    choices: [{ id: 'opt1', title: 'Option 1' }],
                  },
                  {
                    id: 'number-q',
                    title: 'Number',
                    type: 'number',
                    min: 0,
                    max: 100,
                  },
                  {
                    id: 'date-q',
                    title: 'Date',
                    type: 'date',
                  },
                  {
                    id: 'combobox-q',
                    title: 'Combobox',
                    type: 'combobox',
                  },
                  {
                    id: 'boolean-q',
                    title: 'Boolean',
                    type: 'boolean',
                  },
                ],
              },
            ],
          },
        ],
      }

      const result = validator.validate(schema)
      expect(result.valid).toBe(true)
    })
  })

  describe('invalid schemas', () => {
    it('should reject schema without required fields', () => {
      const schema = {
        id: 'test',
        // Missing version, title, engine, steps
      }

      const result = validator.validate(schema)
      expect(result.valid).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should reject schema with invalid id format', () => {
      const schema = {
        id: 'Invalid ID With Spaces',
        version: '1.0.0',
        title: 'Test',
        engine: 'publicodes',
        dispositifs: [],
        steps: [],
      }

      const result = validator.validate(schema)
      expect(result.valid).toBe(false)
      expect(result.errors?.some((e) => e.keyword === 'pattern')).toBe(true)
    })

    it('should reject schema with invalid version format', () => {
      const schema = {
        id: 'test',
        version: 'v1.0',
        title: 'Test',
        engine: 'publicodes',
        dispositifs: [],
        steps: [],
      }

      const result = validator.validate(schema)
      expect(result.valid).toBe(false)
    })

    it('should reject schema with invalid engine', () => {
      const schema = {
        id: 'test',
        version: '1.0.0',
        title: 'Test',
        engine: 'invalid-engine',
        steps: [],
      }

      const result = validator.validate(schema)
      expect(result.valid).toBe(false)
      expect(result.errors?.some((e) => e.keyword === 'enum')).toBe(true)
    })

    it('should require questionsToApi for openfisca engine', () => {
      const schema = {
        id: 'test',
        version: '1.0.0',
        title: 'Test',
        engine: 'openfisca',
        steps: [],
        // Missing questionsToApi
      }

      const result = validator.validate(schema)
      expect(result.valid).toBe(false)
    })

    it('should require dispositifs for publicodes engine', () => {
      const schema = {
        id: 'test',
        version: '1.0.0',
        title: 'Test',
        engine: 'publicodes',
        steps: [],
        // Missing dispositifs
      }

      const result = validator.validate(schema)
      expect(result.valid).toBe(false)
    })

    it('should require choices for radio questions', () => {
      const schema: PublicodesSurveySchema = {
        id: 'test',
        version: '1.0.0',
        title: 'Test',
        description: 'Test',
        engine: 'publicodes',
        forceRefresh: false,
        dispositifs: [],
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            pages: [
              {
                id: 'page1',
                questions: [
                  {
                    id: 'q1',
                    title: 'Question',
                    type: 'radio',
                    // Missing choices - intentionally invalid for testing
                  } as any,
                ],
              },
            ],
          },
        ],
      }

      const result = validator.validate(schema)
      expect(result.valid).toBe(false)
    })

    it('should validate steps have either pages or questions', () => {
      const schema = {
        id: 'test',
        version: '1.0.0',
        title: 'Test',
        engine: 'publicodes',
        dispositifs: [],
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            // Missing both pages and questions
          },
        ],
      }

      const result = validator.validate(schema)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateOrThrow', () => {
    it('should not throw for valid schema', () => {
      expect(() => validator.validateOrThrow(basicSchema)).not.toThrow()
    })

    it('should throw for invalid schema', () => {
      const invalidSchema = { id: 'test' }
      expect(() => validator.validateOrThrow(invalidSchema)).toThrow(/Schema validation failed/)
    })
  })

  describe('validateJson', () => {
    it('should validate valid JSON string', () => {
      const jsonString = JSON.stringify(basicSchema)
      const result = validator.validateJson(jsonString)
      expect(result.valid).toBe(true)
    })

    it('should reject invalid JSON', () => {
      const result = validator.validateJson('{ invalid json }')
      expect(result.valid).toBe(false)
      expect(result.errors?.[0].keyword).toBe('parse')
    })
  })

  describe('getErrorSummary', () => {
    it('should return success message for valid schema', () => {
      const result = validator.validate(basicSchema)
      const summary = validator.getErrorSummary(result)
      expect(summary).toContain('valid')
    })

    it('should return error summary for invalid schema', () => {
      const result = validator.validate({ id: 'test' })
      const summary = validator.getErrorSummary(result)
      expect(summary).toContain('validation failed')
      expect(summary).toContain('error')
    })
  })

  describe('schema version', () => {
    it('should use default schema version', () => {
      expect(validator.getSchemaVersion()).toBe('2.0.0')
    })

    it('should use custom schema version', () => {
      const customValidator = new SchemaValidator({ schemaVersion: '2.0.0' })
      expect(customValidator.getSchemaVersion()).toBe('2.0.0')
    })
  })

  describe('conditional validations', () => {
    it('should validate visibleWhen as string', () => {
      const schema: PublicodesSurveySchema = {
        id: 'test',
        version: '1.0.0',
        title: 'Test',
        description: 'Test',
        engine: 'publicodes',
        forceRefresh: false,
        dispositifs: [],
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            pages: [
              {
                id: 'page1',
                questions: [
                  {
                    id: 'q1',
                    title: 'Question',
                    type: 'boolean',
                    visibleWhen: 'other=true',
                  },
                ],
              },
            ],
          },
        ],
      }

      const result = validator.validate(schema)
      expect(result.valid).toBe(true)
    })

    it('should validate visibleWhen as array', () => {
      const schema: PublicodesSurveySchema = {
        id: 'test',
        version: '1.0.0',
        title: 'Test',
        description: 'Test',
        engine: 'publicodes',
        forceRefresh: false,
        dispositifs: [],
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            pages: [
              {
                id: 'page1',
                questions: [
                  {
                    id: 'q1',
                    title: 'Question',
                    type: 'boolean',
                    visibleWhen: ['cond1=true', 'cond2=false'],
                  },
                ],
              },
            ],
          },
        ],
      }

      const result = validator.validate(schema)
      expect(result.valid).toBe(true)
    })
  })
})
