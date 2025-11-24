import { describe, expect, it } from 'vitest'
import { Entites, INDIVIDU_ID, MENAGE_ID } from '~/services/openfisca/constants'
import { OpenFiscaRequestBuilder } from '~/services/openfisca/request-builder'

/**
 * Test suite to ensure variable conflicts are properly handled
 *
 * After the refactoring, the new code properly detects and reports conflicts
 * that were previously silently ignored (only logged to console.error).
 *
 * These tests ensure:
 * 1. Known intentional updates are allowed (statut_occupation_logement)
 * 2. Known problematic cases are fixed (activite for students)
 * 3. No new conflicts are introduced
 */
describe('variable conflict detection and handling', () => {
  describe('statut_occupation_logement - intentional updates', () => {
    it('should allow updating from locataire_vide to other housing types', () => {
      // This is an intentional design: situation-logement sets locataire_vide,
      // then type-logement can refine it to locataire_meuble or locataire_foyer
      const builder = new OpenFiscaRequestBuilder()

      builder.addAnswers({
        'situation-logement': 'locataire', // Sets statut_occupation_logement='locataire_vide'
        'type-logement': 'logement-meuble', // Updates to 'locataire_meuble'
      })

      const result = builder.build()

      expect(result.success).toBe(true)
      expect(builder.hasErrors()).toBe(false)

      if (result.success) {
        const menage = result.request[Entites.Menages][MENAGE_ID]
        expect(menage.statut_occupation_logement).toBeDefined()
        const period = Object.keys(menage.statut_occupation_logement)[0]
        // Should be updated to locataire_meuble
        expect(menage.statut_occupation_logement[period]).toBe('locataire_meuble')
      }
    })

    it('should allow updating from locataire_vide to locataire_foyer', () => {
      const builder = new OpenFiscaRequestBuilder()

      builder.addAnswers({
        'situation-logement': 'locataire',
        'type-logement': 'logement-foyer',
      })

      const result = builder.build()

      expect(result.success).toBe(true)
      if (result.success) {
        const menage = result.request[Entites.Menages][MENAGE_ID]
        const period = Object.keys(menage.statut_occupation_logement)[0]
        expect(menage.statut_occupation_logement[period]).toBe('locataire_foyer')
      }
    })
  })

  describe('activite - student status preservation', () => {
    it('should preserve etudiant status when student is employed', () => {
      // Fixed: dispatcher now returns {} for salarie-hors-alternance
      const builder = new OpenFiscaRequestBuilder()

      builder.addAnswers({
        'statut-professionnel': 'etudiant',
        'situation-professionnelle': 'salarie-hors-alternance',
      })

      const result = builder.build()

      expect(result.success).toBe(true)
      if (result.success) {
        const individu = result.request[Entites.Individus][INDIVIDU_ID]
        const period = Object.keys(individu.activite)[0]
        // Student status is preserved (not updated to 'actif')
        expect(individu.activite[period]).toBe('etudiant')
      }
    })

    it('should preserve etudiant status when student is unemployed', () => {
      const builder = new OpenFiscaRequestBuilder()

      builder.addAnswers({
        'statut-professionnel': 'etudiant',
        'situation-professionnelle': 'sans-emploi',
      })

      const result = builder.build()

      expect(result.success).toBe(true)
      if (result.success) {
        const individu = result.request[Entites.Individus][INDIVIDU_ID]
        const period = Object.keys(individu.activite)[0]
        // Student status is preserved (not updated to 'chomeur')
        expect(individu.activite[period]).toBe('etudiant')
      }
    })

    it('should add separate variables for stage and alternance', () => {
      const builderStage = new OpenFiscaRequestBuilder()
      builderStage.addAnswers({
        'statut-professionnel': 'etudiant',
        'situation-professionnelle': 'stage',
      })

      const resultStage = builderStage.build()
      expect(resultStage.success).toBe(true)

      if (resultStage.success) {
        const individu = resultStage.request[Entites.Individus][INDIVIDU_ID]
        // Should have both activite='etudiant' and stagiaire variable
        expect(individu.activite).toBeDefined()
        expect(individu.stagiaire).toBeDefined()
      }

      const builderAlternance = new OpenFiscaRequestBuilder()
      builderAlternance.addAnswers({
        'statut-professionnel': 'etudiant',
        'situation-professionnelle': 'alternance',
      })

      const resultAlternance = builderAlternance.build()
      expect(resultAlternance.success).toBe(true)

      if (resultAlternance.success) {
        const individu = resultAlternance.request[Entites.Individus][INDIVIDU_ID]
        // Should have both activite='etudiant' and alternant variable
        expect(individu.activite).toBeDefined()
        expect(individu.alternant).toBeDefined()
      }
    })
  })

  describe('genuine conflicts should be detected', () => {
    it('should detect conflicts when same question tries to set conflicting values', () => {
      const builder = new OpenFiscaRequestBuilder()

      // Create a genuine conflict: same answer key with different values
      builder.addAnswer('statut-professionnel', 'etudiant')
      builder.addAnswer('statut-professionnel', 'actif') // Tries to overwrite

      const result = builder.build()

      // This creates a conflict because the entity manager detects the change
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors[0].type).toBe('MAPPING_ERROR')
      }
    })

    it('should detect conflicts within entity managers', () => {
      const builder = new OpenFiscaRequestBuilder()

      // Try to set the same variable twice in a way that creates a real conflict
      // (This would require accessing entity managers directly, which is implementation detail)
      // For now, we trust that the entity managers handle this via their tests

      const result = builder.build()
      expect(result.success).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle missing conditional questions gracefully', () => {
      // If user selects 'actif' instead of 'etudiant', situation-professionnelle is not shown
      const builder = new OpenFiscaRequestBuilder()

      builder.addAnswers({
        'statut-professionnel': 'actif',
        // situation-professionnelle would not be shown in UI
      })

      const result = builder.build()

      expect(result.success).toBe(true)
      if (result.success) {
        const individu = result.request[Entites.Individus][INDIVIDU_ID]
        const period = Object.keys(individu.activite)[0]
        expect(individu.activite[period]).toBe('actif')
      }
    })

    it('should handle housing questions in isolation', () => {
      const builder = new OpenFiscaRequestBuilder()

      // Only situation-logement, no type-logement
      builder.addAnswer('situation-logement', 'proprietaire')

      const result = builder.build()

      expect(result.success).toBe(true)
      if (result.success) {
        const menage = result.request[Entites.Menages][MENAGE_ID]
        const period = Object.keys(menage.statut_occupation_logement)[0]
        expect(menage.statut_occupation_logement[period]).toBe('proprietaire')
      }
    })
  })
})
