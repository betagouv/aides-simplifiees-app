import { Entites, FOYER_FISCAL_ID, INDIVIDU_ID } from '../constants.js'
import { EntityManager } from './entity_manager.js'

/**
 * FoyerFiscal entity structure in OpenFisca
 */
interface FoyerFiscalEntity {
  declarants: string[]
  personnes_a_charge: string[]
  [variable: string]: VariableValueOnPeriod | string[]
}

/**
 * Manager for FoyerFiscal (tax household) entities in OpenFisca requests
 *
 * Handles tax household-specific variables like tax declarations, dependents, etc.
 */
export class FoyerFiscalManager extends EntityManager {
  private entity: FoyerFiscalEntity

  constructor(foyerFiscalId: string = FOYER_FISCAL_ID, individuId: string = INDIVIDU_ID) {
    super(foyerFiscalId, Entites.FoyersFiscaux)
    this.entity = {
      declarants: [individuId],
      personnes_a_charge: [],
    }
  }

  /**
   * Add a variable to the foyer fiscal entity
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

    // Skip if it's a member list (declarants, personnes_a_charge)
    if (Array.isArray(existingVariable)) {
      console.warn(`Cannot set variable '${variableName}' on foyer_fiscal - it's a member list`)
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
   * Get the foyer fiscal entity data structure
   */
  getEntity(): FoyerFiscalEntity {
    return this.entity
  }

  /**
   * Add a declarant to the foyer fiscal
   *
   * @param individuId - Individual ID to add as declarant
   */
  addDeclarant(individuId: string): void {
    if (!this.entity.declarants.includes(individuId)) {
      this.entity.declarants.push(individuId)
    }
  }

  /**
   * Add a personne à charge (dependent) to the foyer fiscal
   *
   * @param individuId - Individual ID to add as dependent
   */
  addPersonneACharge(individuId: string): void {
    if (!this.entity.personnes_a_charge.includes(individuId)) {
      this.entity.personnes_a_charge.push(individuId)
    }
  }

  /**
   * Reset the foyer fiscal entity (useful for testing)
   */
  reset(individuId: string = INDIVIDU_ID): void {
    this.entity = {
      declarants: [individuId],
      personnes_a_charge: [],
    }
    this.errors = []
  }
}
