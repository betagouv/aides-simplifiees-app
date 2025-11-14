import { describe, expect, it } from 'vitest'
import {
  toApplicationSlug,
  toOpenfiscaVariable,
} from '../../../shared-test-cases/utils/format_conversion.js'

describe('format conversion utilities', () => {
  describe('toApplicationSlug', () => {
    it('converts snake_case to kebab-case', () => {
      expect(toApplicationSlug('aide_mobili_jeune')).toBe('aide-mobili-jeune')
      expect(toApplicationSlug('aide_personnalisee_logement')).toBe('aide-personnalisee-logement')
    })

    it('handles single word without underscores', () => {
      expect(toApplicationSlug('apl')).toBe('apl')
      expect(toApplicationSlug('locapass')).toBe('locapass')
    })

    it('handles multiple underscores', () => {
      expect(toApplicationSlug('aide_action_logement_garantie')).toBe('aide-action-logement-garantie')
    })
  })

  describe('toOpenfiscaVariable', () => {
    it('converts kebab-case to snake_case', () => {
      expect(toOpenfiscaVariable('aide-mobili-jeune')).toBe('aide_mobili_jeune')
      expect(toOpenfiscaVariable('aide-personnalisee-logement')).toBe('aide_personnalisee_logement')
    })

    it('handles single word without hyphens', () => {
      expect(toOpenfiscaVariable('apl')).toBe('apl')
      expect(toOpenfiscaVariable('locapass')).toBe('locapass')
    })

    it('handles multiple hyphens', () => {
      expect(toOpenfiscaVariable('aide-action-logement-garantie')).toBe('aide_action_logement_garantie')
    })
  })

  describe('round-trip conversion', () => {
    it('toApplicationSlug and toOpenfiscaVariable are reversible', () => {
      const openfiscaVar = 'aide_mobili_jeune'
      const slug = toApplicationSlug(openfiscaVar)
      const back = toOpenfiscaVariable(slug)

      expect(back).toBe(openfiscaVar)
    })
  })
})
