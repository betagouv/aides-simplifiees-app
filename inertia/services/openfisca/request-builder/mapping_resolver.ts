import type { Entites } from '../constants.js'
import {
  FAMILLE_ID,
  FOYER_FISCAL_ID,
  INDIVIDU_ID,
  MENAGE_ID,
  UNDEFINED_ENTITY_ID,
} from '../constants.js'
import {
  famillesQuestionsVariables,
  foyersFiscauxQuestionsVariables,
  individusQuestionsVariables,
  menagesQuestionsVariables,
} from '../questions_variables.js'
import {
  famillesVariables,
  foyersFiscauxVariables,
  individusVariables,
  menagesVariables,
} from '../variables.js'

/**
 * Resolves answer keys to OpenFisca mappings and entities
 *
 * Handles both direct variable mappings and question-to-variable mappings
 */
export class MappingResolver {
  /**
   * All entity mappings grouped by entity ID
   */
  private readonly entityMappings: Record<string, Record<string, AidesSimplifieesMapping>> = {
    [INDIVIDU_ID]: { ...individusVariables, ...individusQuestionsVariables },
    [MENAGE_ID]: { ...menagesVariables, ...menagesQuestionsVariables },
    [FOYER_FISCAL_ID]: { ...foyersFiscauxVariables, ...foyersFiscauxQuestionsVariables },
    [FAMILLE_ID]: { ...famillesVariables, ...famillesQuestionsVariables },
  }

  /**
   * Resolve an answer key to its OpenFisca mapping
   *
   * @param answerKey - Survey answer key
   * @returns OpenFisca mapping or null if not found
   */
  resolve(answerKey: string): AidesSimplifieesMapping | null {
    for (const entityMappings of Object.values(this.entityMappings)) {
      const mapping = entityMappings[answerKey]
      if (mapping) {
        return mapping
      }
    }
    return null
  }

  /**
   * Resolve an answer key to its entity ID
   *
   * @param answerKey - Survey answer key
   * @returns Entity ID or UNDEFINED_ENTITY_ID if not found
   */
  resolveEntity(answerKey: string): string {
    for (const [entity, mappings] of Object.entries(this.entityMappings)) {
      if (mappings[answerKey]) {
        return entity
      }
    }
    return UNDEFINED_ENTITY_ID
  }

  /**
   * Check if an answer key has a mapping
   *
   * @param answerKey - Survey answer key
   * @returns True if mapping exists
   */
  hasMapping(answerKey: string): boolean {
    return this.resolve(answerKey) !== null
  }

  /**
   * Get all mappings for a specific entity
   *
   * @param entity - Entity type
   * @returns Record of answer keys to mappings
   */
  getMappingsForEntity(entity: Entites): Record<string, AidesSimplifieesMapping> {
    return this.entityMappings[entity] || {}
  }
}
