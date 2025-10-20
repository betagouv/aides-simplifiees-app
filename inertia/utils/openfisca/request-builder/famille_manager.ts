import { Entites, FAMILLE_ID, INDIVIDU_ID } from '../constants.js'
import { EntityManager } from './entity_manager.js'

/**
 * Famille entity structure in OpenFisca
 */
interface FamilleEntity {
  parents: string[]
  enfants: string[]
  [variable: string]: VariableValueOnPeriod | string[]
}

/**
 * Manager for Famille (family) entities in OpenFisca requests
 *
 * Handles family-specific variables like family benefits, parental leave, etc.
 */
export class FamilleManager extends EntityManager {
  private entity: FamilleEntity

  constructor(familleId: string = FAMILLE_ID, individuId: string = INDIVIDU_ID) {
    super(familleId, Entites.Familles)
    this.entity = {
      parents: [individuId],
      enfants: [],
    }
  }

  /**
   * Add a variable to the famille entity
   *
   * @param variableName - OpenFisca variable name
   * @param value - Variable value
   * @param period - Period for the variable
   * @param answerKey - Original answer key (for error tracking)
   */
  addVariable(
    variableName: string,
    value: boolean | number | string,
    period: string,
    answerKey: string,
  ): void {
    const existingVariable = this.entity[variableName]

    // Skip if it's a member list (parents, enfants)
    if (Array.isArray(existingVariable)) {
      console.warn(`Cannot set variable '${variableName}' on famille - it's a member list`)
      return
    }

    if (existingVariable && !Array.isArray(existingVariable)) {
      const existingValue = existingVariable[period]

      if (this.shouldUpdateVariable(variableName, existingValue, value, answerKey)) {
        this.entity[variableName] = { [period]: value }
      }
      else if (existingValue !== undefined) {
        this.logVariableConflict(variableName, existingValue, value, answerKey)
        this.addError({
          type: 'MAPPING_ERROR',
          message: `Variable '${variableName}' already exists with different value`,
          answerKey,
        })
      }
      else {
        // Update the existing variable with the new period
        this.entity[variableName] = {
          ...existingVariable,
          [period]: value,
        }
      }
    }
    else {
      // First time setting this variable
      this.entity[variableName] = { [period]: value }
    }
  }

  /**
   * Get the famille entity data structure
   */
  getEntity(): FamilleEntity {
    return this.entity
  }

  /**
   * Add a parent to the famille
   *
   * @param individuId - Individual ID to add as parent
   */
  addParent(individuId: string): void {
    if (!this.entity.parents.includes(individuId)) {
      this.entity.parents.push(individuId)
    }
  }

  /**
   * Add an enfant (child) to the famille
   *
   * @param individuId - Individual ID to add as child
   */
  addEnfant(individuId: string): void {
    if (!this.entity.enfants.includes(individuId)) {
      this.entity.enfants.push(individuId)
    }
  }

  /**
   * Reset the famille entity (useful for testing)
   */
  reset(individuId: string = INDIVIDU_ID): void {
    this.entity = {
      parents: [individuId],
      enfants: [],
    }
    this.errors = []
  }
}
