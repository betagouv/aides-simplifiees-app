import { describe, expect, it } from 'vitest'
import { Entites, INDIVIDU_ID } from '~/utils/openfisca/constants'
import { OpenFiscaRequestBuilder } from '~/utils/openfisca/request-builder'

describe('openFiscaRequestBuilder', () => {
  describe('initialization', () => {
    it('should initialize with empty entities', () => {
      const builder = new OpenFiscaRequestBuilder()
      const result = builder.build()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.request[Entites.Individus][INDIVIDU_ID]).toBeDefined()
        expect(result.request[Entites.Menages]).toBeDefined()
        expect(result.request[Entites.FoyersFiscaux]).toBeDefined()
        expect(result.request[Entites.Familles]).toBeDefined()
      }
    })

    it('should have no errors initially', () => {
      const builder = new OpenFiscaRequestBuilder()

      expect(builder.hasErrors()).toBe(false)
      expect(builder.getErrors()).toHaveLength(0)
    })
  })

  describe('adding answers', () => {
    it('should add a simple answer', () => {
      const builder = new OpenFiscaRequestBuilder()
      builder.addAnswer('date-naissance', '2000-01-01')
      const result = builder.build()

      expect(result.success).toBe(true)
      if (result.success) {
        const individu = result.request[Entites.Individus][INDIVIDU_ID]
        expect(individu.date_naissance).toBeDefined()
      }
    })

    it('should handle multiple answers', () => {
      const builder = new OpenFiscaRequestBuilder()
      builder.addAnswers({
        'date-naissance': '2000-01-01',
        'boursier': true,
      })
      const result = builder.build()

      expect(result.success).toBe(true)
      if (result.success) {
        const individu = result.request[Entites.Individus][INDIVIDU_ID]
        expect(individu.date_naissance).toBeDefined()
        expect(individu.boursier).toBeDefined()
      }
    })

    it('should support method chaining', () => {
      const builder = new OpenFiscaRequestBuilder()
      const result = builder
        .addAnswer('date-naissance', '2000-01-01')
        .addAnswer('boursier', true)
        .build()

      expect(result.success).toBe(true)
      if (result.success) {
        const individu = result.request[Entites.Individus][INDIVIDU_ID]
        expect(individu.date_naissance).toBeDefined()
        expect(individu.boursier).toBeDefined()
      }
    })
  })

  describe('value handling', () => {
    it('should skip undefined values by default', () => {
      const builder = new OpenFiscaRequestBuilder()
      builder.addAnswer('age', undefined)
      const result = builder.build()

      expect(result.success).toBe(true)
      if (result.success) {
        const individu = result.request[Entites.Individus][INDIVIDU_ID]
        expect(individu.age).toBeUndefined()
      }
    })

    it('should skip null values by default', () => {
      const builder = new OpenFiscaRequestBuilder()
      builder.addAnswer('age', null)
      const result = builder.build()

      expect(result.success).toBe(true)
    })

    it('should handle ComboboxAnswer type', () => {
      const builder = new OpenFiscaRequestBuilder()
      builder.addAnswer('boursier', { value: true, label: 'Oui' })
      const result = builder.build()

      expect(result.success).toBe(true)
      if (result.success) {
        const individu = result.request[Entites.Individus][INDIVIDU_ID]
        expect(individu.boursier).toBeDefined()
      }
    })

    it('should reject arrays as values for non-excluded variables', () => {
      const builder = new OpenFiscaRequestBuilder()
      // Use a real variable that exists but isn't excluded
      builder.addAnswer('date-naissance', ['2000-01-01', '2001-01-01'] as unknown as string)
      const result = builder.build()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).not.toHaveLength(0)
        expect(result.errors[0].type).toBe('UNEXPECTED_VALUE')
      }
    })

    it('should skip excluded variables even with array values', () => {
      const builder = new OpenFiscaRequestBuilder()
      // type-revenus is excluded and has array values (checkbox field)
      builder.addAnswer('type-revenus', ['revenus-activite', 'revenus-chomage'])
      const result = builder.build()

      // Should succeed since the excluded variable is skipped
      expect(result.success).toBe(true)
      expect(builder.hasErrors()).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should collect errors for unknown variables', () => {
      const builder = new OpenFiscaRequestBuilder()
      builder.addAnswer('unknown_variable_xyz', 'test')
      const result = builder.build()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors).not.toHaveLength(0)
        expect(result.errors[0].type).toBe('UNKNOWN_VARIABLE')
        expect(result.errors[0].answerKey).toBe('unknown_variable_xyz')
      }
    })

    it('should track errors with hasErrors()', () => {
      const builder = new OpenFiscaRequestBuilder()
      builder.addAnswer('unknown_var', 'test')

      expect(builder.hasErrors()).toBe(true)
    })

    it('should clear errors', () => {
      const builder = new OpenFiscaRequestBuilder()
      builder.addAnswer('unknown_var', 'test')

      expect(builder.hasErrors()).toBe(true)

      builder.clearErrors()

      expect(builder.hasErrors()).toBe(false)
      expect(builder.getErrors()).toHaveLength(0)
    })

    it('should get current errors', () => {
      const builder = new OpenFiscaRequestBuilder()
      builder.addAnswer('unknown_var1', 'test')
      builder.addAnswer('unknown_var2', 'test')

      const errors = builder.getErrors()
      expect(errors).toHaveLength(2)
      expect(errors[0].answerKey).toBe('unknown_var1')
      expect(errors[1].answerKey).toBe('unknown_var2')
    })
  })

  describe('request state', () => {
    it('should get current request state', () => {
      const builder = new OpenFiscaRequestBuilder()
      builder.addAnswer('age', 25)

      const currentRequest = builder.getRequest()

      expect(currentRequest[Entites.Individus][INDIVIDU_ID]).toBeDefined()
    })
  })

  describe('options', () => {
    it('should respect allowUndefinedValues option', () => {
      const builder = new OpenFiscaRequestBuilder({ allowUndefinedValues: false })
      builder.addAnswer('age', undefined)
      const result = builder.build()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors[0].type).toBe('UNDEFINED_VALUE')
      }
    })
  })
})
