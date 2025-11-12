import { beforeEach, describe, expect, it } from 'vitest'
import { FAMILLE_ID, FOYER_FISCAL_ID, INDIVIDU_ID, MENAGE_ID } from '~/services/openfisca/constants'
import { FamilleManager } from '~/services/openfisca/request-builder/famille_manager'
import { FoyerFiscalManager } from '~/services/openfisca/request-builder/foyer_fiscal_manager'
import { IndividuManager } from '~/services/openfisca/request-builder/individu_manager'
import { MenageManager } from '~/services/openfisca/request-builder/menage_manager'

describe('entity Managers', () => {
  describe('individuManager', () => {
    let manager: IndividuManager

    beforeEach(() => {
      manager = new IndividuManager(INDIVIDU_ID)
    })

    it('should initialize with correct entity type', () => {
      const entity = manager.getEntity()
      expect(entity).toBeDefined()
      expect(Object.keys(entity)).toHaveLength(0)
    })

    it('should add a variable with value', () => {
      manager.addVariable('age', 25, '2025-10', 'age')
      const entity = manager.getEntity()

      expect(entity.age).toBeDefined()
      expect(entity.age['2025-10']).toBe(25)
    })

    it('should add a question (null value)', () => {
      manager.addVariable('aide_mobilite_master', null, '2025-10', 'mobilite-master-1')
      const entity = manager.getEntity()

      expect(entity.aide_mobilite_master).toBeDefined()
      expect(entity.aide_mobilite_master['2025-10']).toBe(null)
    })

    it('should handle multiple variables', () => {
      manager.addVariable('age', 25, '2025-10', 'age')
      manager.addVariable('salaire_net', 1500, '2025-10', 'salaire')
      const entity = manager.getEntity()

      expect(entity.age['2025-10']).toBe(25)
      expect(entity.salaire_net['2025-10']).toBe(1500)
    })

    it('should detect variable conflicts', () => {
      manager.addVariable('age', 25, '2025-10', 'age')
      manager.addVariable('age', 30, '2025-10', 'age-different')

      expect(manager.hasErrors()).toBe(true)
      const errors = manager.getErrors()
      expect(errors).toHaveLength(1)
      expect(errors[0].type).toBe('MAPPING_ERROR')
    })

    it('should allow updating same period with same value', () => {
      manager.addVariable('age', 25, '2025-10', 'age')
      manager.addVariable('age', 25, '2025-11', 'age-next-month')

      expect(manager.hasErrors()).toBe(false)
      const entity = manager.getEntity()
      expect(entity.age['2025-10']).toBe(25)
      expect(entity.age['2025-11']).toBe(25)
    })

    it('should handle demenagement special case', () => {
      manager.addVariable('statut_occupation_logement', 'locataire_vide', '2025-10', 'statut-initial')
      manager.addVariable('statut_occupation_logement', 'proprietaire', '2025-10', 'demenagement')

      expect(manager.hasErrors()).toBe(false)
      const entity = manager.getEntity()
      expect(entity.statut_occupation_logement['2025-10']).toBe('proprietaire')
    })

    it('should reset entity and errors', () => {
      manager.addVariable('age', 25, '2025-10', 'age')
      manager.reset()

      const entity = manager.getEntity()
      expect(Object.keys(entity)).toHaveLength(0)
      expect(manager.hasErrors()).toBe(false)
    })
  })

  describe('menageManager', () => {
    let manager: MenageManager

    beforeEach(() => {
      manager = new MenageManager(MENAGE_ID, INDIVIDU_ID)
    })

    it('should initialize with member lists', () => {
      const entity = manager.getEntity()

      expect(entity.personne_de_reference).toEqual([INDIVIDU_ID])
      expect(entity.conjoint).toEqual([])
      expect(entity.enfants).toEqual([])
    })

    it('should add a variable with value', () => {
      manager.addVariable('loyer', 600, '2025-10', 'loyer')
      const entity = manager.getEntity()

      expect(entity.loyer).toBeDefined()
      expect(entity.loyer['2025-10']).toBe(600)
    })

    it('should add a question (null value)', () => {
      manager.addVariable('visale_montant_max', null, '2025-10', 'garantie-visale')
      const entity = manager.getEntity()

      expect(entity.visale_montant_max).toBeDefined()
      expect(entity.visale_montant_max['2025-10']).toBe(null)
    })

    it('should not allow setting variables on member lists', () => {
      manager.addVariable('personne_de_reference', 'test', '2025-10', 'invalid')
      const entity = manager.getEntity()

      // Should still be array, not overwritten
      expect(Array.isArray(entity.personne_de_reference)).toBe(true)
    })

    it('should add conjoint', () => {
      manager.addConjoint('conjoint_1')
      const entity = manager.getEntity()

      expect(entity.conjoint).toContain('conjoint_1')
    })

    it('should add enfant', () => {
      manager.addEnfant('enfant_1')
      const entity = manager.getEntity()

      expect(entity.enfants).toContain('enfant_1')
    })

    it('should not duplicate members', () => {
      manager.addConjoint('conjoint_1')
      manager.addConjoint('conjoint_1')
      const entity = manager.getEntity()

      expect(entity.conjoint).toHaveLength(1)
    })

    it('should detect variable conflicts', () => {
      manager.addVariable('loyer', 600, '2025-10', 'loyer')
      manager.addVariable('loyer', 700, '2025-10', 'loyer-different')

      expect(manager.hasErrors()).toBe(true)
    })

    it('should reset entity', () => {
      manager.addVariable('loyer', 600, '2025-10', 'loyer')
      manager.addConjoint('conjoint_1')
      manager.reset(INDIVIDU_ID)

      const entity = manager.getEntity()
      expect(entity.personne_de_reference).toEqual([INDIVIDU_ID])
      expect(entity.conjoint).toEqual([])
      expect(entity.loyer).toBeUndefined()
    })
  })

  describe('familleManager', () => {
    let manager: FamilleManager

    beforeEach(() => {
      manager = new FamilleManager(FAMILLE_ID, INDIVIDU_ID)
    })

    it('should initialize with member lists', () => {
      const entity = manager.getEntity()

      expect(entity.parents).toEqual([INDIVIDU_ID])
      expect(entity.enfants).toEqual([])
    })

    it('should add a variable with value', () => {
      manager.addVariable('aide_personnalisee_logement', 150, '2025-10', 'apl')
      const entity = manager.getEntity()

      expect(entity.aide_personnalisee_logement).toBeDefined()
      expect(entity.aide_personnalisee_logement['2025-10']).toBe(150)
    })

    it('should add a question (null value)', () => {
      manager.addVariable('apl', null, '2025-10', 'aide-personnalisee-logement')
      const entity = manager.getEntity()

      expect(entity.apl).toBeDefined()
      expect(entity.apl['2025-10']).toBe(null)
    })

    it('should add parent', () => {
      manager.addParent('parent_2')
      const entity = manager.getEntity()

      expect(entity.parents).toContain('parent_2')
    })

    it('should add enfant', () => {
      manager.addEnfant('enfant_1')
      const entity = manager.getEntity()

      expect(entity.enfants).toContain('enfant_1')
    })

    it('should not duplicate members', () => {
      manager.addParent('parent_2')
      manager.addParent('parent_2')
      const entity = manager.getEntity()

      expect(entity.parents).toHaveLength(2) // INDIVIDU_ID + parent_2
    })

    it('should detect variable conflicts', () => {
      manager.addVariable('apl', 150, '2025-10', 'apl-1')
      manager.addVariable('apl', 200, '2025-10', 'apl-2')

      expect(manager.hasErrors()).toBe(true)
    })

    it('should reset entity', () => {
      manager.addVariable('apl', 150, '2025-10', 'apl')
      manager.addParent('parent_2')
      manager.reset(INDIVIDU_ID)

      const entity = manager.getEntity()
      expect(entity.parents).toEqual([INDIVIDU_ID])
      expect(entity.apl).toBeUndefined()
    })
  })

  describe('foyerFiscalManager', () => {
    let manager: FoyerFiscalManager

    beforeEach(() => {
      manager = new FoyerFiscalManager(FOYER_FISCAL_ID, INDIVIDU_ID)
    })

    it('should initialize with member lists', () => {
      const entity = manager.getEntity()

      expect(entity.declarants).toEqual([INDIVIDU_ID])
      expect(entity.personnes_a_charge).toEqual([])
    })

    it('should add a variable with value', () => {
      manager.addVariable('revenu_fiscal_reference', 20000, '2024', 'rfr')
      const entity = manager.getEntity()

      expect(entity.revenu_fiscal_reference).toBeDefined()
      expect(entity.revenu_fiscal_reference['2024']).toBe(20000)
    })

    it('should add a question (null value)', () => {
      manager.addVariable('impot_revenu', null, '2024', 'impot-question')
      const entity = manager.getEntity()

      expect(entity.impot_revenu).toBeDefined()
      expect(entity.impot_revenu['2024']).toBe(null)
    })

    it('should add declarant', () => {
      manager.addDeclarant('declarant_2')
      const entity = manager.getEntity()

      expect(entity.declarants).toContain('declarant_2')
    })

    it('should add personne à charge', () => {
      manager.addPersonneACharge('enfant_1')
      const entity = manager.getEntity()

      expect(entity.personnes_a_charge).toContain('enfant_1')
    })

    it('should not duplicate members', () => {
      manager.addDeclarant('declarant_2')
      manager.addDeclarant('declarant_2')
      const entity = manager.getEntity()

      expect(entity.declarants).toHaveLength(2) // INDIVIDU_ID + declarant_2
    })

    it('should detect variable conflicts', () => {
      manager.addVariable('revenu_fiscal_reference', 20000, '2024', 'rfr-1')
      manager.addVariable('revenu_fiscal_reference', 25000, '2024', 'rfr-2')

      expect(manager.hasErrors()).toBe(true)
    })

    it('should reset entity', () => {
      manager.addVariable('revenu_fiscal_reference', 20000, '2024', 'rfr')
      manager.addDeclarant('declarant_2')
      manager.reset(INDIVIDU_ID)

      const entity = manager.getEntity()
      expect(entity.declarants).toEqual([INDIVIDU_ID])
      expect(entity.revenu_fiscal_reference).toBeUndefined()
    })
  })

  describe('entity Manager Error Handling', () => {
    it('should collect errors from all managers', () => {
      const individuManager = new IndividuManager(INDIVIDU_ID)
      const menageManager = new MenageManager(MENAGE_ID, INDIVIDU_ID)

      // Create conflicts
      individuManager.addVariable('age', 25, '2025-10', 'age-1')
      individuManager.addVariable('age', 30, '2025-10', 'age-2')

      menageManager.addVariable('loyer', 600, '2025-10', 'loyer-1')
      menageManager.addVariable('loyer', 700, '2025-10', 'loyer-2')

      expect(individuManager.hasErrors()).toBe(true)
      expect(menageManager.hasErrors()).toBe(true)
      expect(individuManager.getErrors()).toHaveLength(1)
      expect(menageManager.getErrors()).toHaveLength(1)
    })

    it('should track answer keys in errors', () => {
      const manager = new IndividuManager(INDIVIDU_ID)

      manager.addVariable('age', 25, '2025-10', 'age-from-question-1')
      manager.addVariable('age', 30, '2025-10', 'age-from-question-2')

      const errors = manager.getErrors()
      expect(errors[0].answerKey).toBe('age-from-question-2')
    })
  })
})
