import { Entites, INDIVIDU_ID, MENAGE_ID } from '../constants.js'
import { EntityManager } from './entity_manager.js'

/**
 * Menage entity structure in OpenFisca
 */
interface MenageEntity {
  personne_de_reference: string[]
  conjoint: string[]
  enfants: string[]
  [variable: string]: VariableValueOnPeriod | VariableToCalculateOnPeriod | string[]
}

/**
 * Manager for Menage (household) entities in OpenFisca requests
 *
 * Handles household-specific variables like housing status, rent, utilities, etc.
 */
export class MenageManager extends EntityManager {
  private entity: MenageEntity

  constructor(menageId: string = MENAGE_ID, individuId: string = INDIVIDU_ID) {
    super(menageId, Entites.Menages)
    this.entity = {
      personne_de_reference: [individuId],
      conjoint: [],
      enfants: [],
    }
  }

  /**
   * Add a variable to the menage entity
   *
   * @param variableName - OpenFisca variable name
   * @param value - Variable value (null for questions that need calculation)
   * @param period - Period for the variable
   * @param answerKey - Original answer key (for error tracking)
   */
  addVariable(
    variableName: string,
    value: boolean | number | string | null,
    period: string,
    answerKey: string,
  ): void {
    const existingVariable = this.entity[variableName]

    // Skip if it's a member list (personne_de_reference, conjoint, enfants)
    if (Array.isArray(existingVariable)) {
      console.warn(`Cannot set variable '${variableName}' on menage - it's a member list`)
      return
    }

    // For questions (value is null), create variable to calculate
    if (value === null) {
      this.entity[variableName] = { [period]: null }
      return
    }

    if (existingVariable && !Array.isArray(existingVariable)) {
      const existingValue = existingVariable[period]

      if (this.shouldUpdateVariable(variableName, existingValue, value, answerKey)) {
        this.entity[variableName] = { [period]: value } as VariableValueOnPeriod
      }
      else if (existingValue !== undefined && existingValue !== null) {
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
        } as VariableValueOnPeriod
      }
    }
    else {
      // First time setting this variable
      this.entity[variableName] = { [period]: value } as VariableValueOnPeriod
    }
  }

  /**
   * Get the menage entity data structure
   */
  getEntity(): MenageEntity {
    return this.entity
  }

  /**
   * Add a conjoint (spouse) to the menage
   *
   * @param individuId - Individual ID to add as spouse
   */
  addConjoint(individuId: string): void {
    if (!this.entity.conjoint.includes(individuId)) {
      this.entity.conjoint.push(individuId)
    }
  }

  /**
   * Add an enfant (child) to the menage
   *
   * @param individuId - Individual ID to add as child
   */
  addEnfant(individuId: string): void {
    if (!this.entity.enfants.includes(individuId)) {
      this.entity.enfants.push(individuId)
    }
  }

  /**
   * Reset the menage entity (useful for testing)
   */
  reset(individuId: string = INDIVIDU_ID): void {
    this.entity = {
      personne_de_reference: [individuId],
      conjoint: [],
      enfants: [],
    }
    this.errors = []
  }
}
