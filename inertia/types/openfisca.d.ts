declare global {
  interface VariableToCalculateOnPeriod {
    [date: string]: null
  }

  interface VariableValueOnPeriod {
    [date: string]: boolean | number | string
  }

  // On 'VariableValueOnPeriod | VariableToCalculateOnPeriod' items, string[] is added to guarantee typing happiness
  interface OpenFiscaCalculationRequest {
    individus: {
      [name: string]: {
        [variable: string]: VariableValueOnPeriod | VariableToCalculateOnPeriod
      }
    }
    menages: {
      [name: string]: {
        personne_de_reference: string[]
        conjoint: string[]
        enfants: string[]
        [variable: string]: string[] | VariableValueOnPeriod | VariableToCalculateOnPeriod
      }
    }
    foyers_fiscaux: {
      [name: string]: {
        declarants: string[]
        personnes_a_charge: string[]
        [variable: string]: string[] | VariableValueOnPeriod | VariableToCalculateOnPeriod
      }
    }
    familles: {
      [name: string]: {
        parents: string[]
        enfants: string[]
        [variable: string]: string[] | VariableValueOnPeriod | VariableToCalculateOnPeriod
      }
    }
  }

  type OpenFiscaCalculationResponse = OpenFiscaCalculationRequest | { error: string }
}

export {}
