import type {
  Entites,
} from '~/utils/openfisca/constants'

declare global {

  type PeriodType = 'ETERNITY' | 'YEAR' | 'YEAR_ROLLING' | 'MONTH'

  interface DatePeriods {
    MONTH: string
    MONTH_NEXT: string
    YEAR: string
    YEAR_ROLLING: string
  }

  /**
   * In OpenFisca, a variable has a value on a given period (e.g. a month or a year).
   */
  interface VariableValueOnPeriod {
    [date: string]: boolean | number | string
  }

  /**
   * To ask OpenFisca to calculate a variable on a period,
   * we need to provide a 'null' value for the variable on that period.
   */
  interface VariableToCalculateOnPeriod {
    [date: string]: null
  }

  /**
   * On 'VariableValueOnPeriod | VariableToCalculateOnPeriod' items,
   * string[] is added to guarantee typing happiness
   */
  interface OpenFiscaCalculationRequest {
    [Entites.Individus]: {
      [name: string]: {
        [variable: string]: VariableValueOnPeriod | VariableToCalculateOnPeriod
      }
    }
    [Entites.Menages]: {
      [name: string]: {
        personne_de_reference: string[]
        conjoint: string[]
        enfants: string[]
        [variable: string]: VariableValueOnPeriod | VariableToCalculateOnPeriod | string[]
      }
    }
    [Entites.FoyersFiscaux]: {
      [name: string]: {
        declarants: string[]
        personnes_a_charge: string[]
        [variable: string]: VariableValueOnPeriod | VariableToCalculateOnPeriod | string[]
      }
    }
    [Entites.Familles]: {
      [name: string]: {
        parents: string[]
        enfants: string[]
        [variable: string]: VariableValueOnPeriod | VariableToCalculateOnPeriod | string[]
      }
    }
  }

  /**
   * OpenFisca calculation response can be a request or an error
   */
  type OpenFiscaCalculationResponse = OpenFiscaCalculationRequest | { error: string }

  /**
   * OpenFiscaMapping is used to map a form input to an OpenFisca variable
   * It can either be a direct mapping with an OpenFisca variable name and period,
   * or a dispatch function that will return a mapping based on the input value.
   */
  type OpenFiscaMapping = {
    openfiscaVariableName: string
    period: 'ETERNITY' | 'YEAR' | 'YEAR_ROLLING' | 'MONTH'
  } | {
    dispatch: DispatchFunction
    period: 'ETERNITY' | 'YEAR' | 'YEAR_ROLLING' | 'MONTH'
  }

  /**
   * AidesSimplifieesMapping is used to map a form input to an OpenFisca variable
   * It can either be a direct mapping with an OpenFisca variable name and period,
   * or a dispatch function that will return a mapping based on the input value.
   * It can also be an exclusion mapping, which means that the input is not mapped to
   * any OpenFisca variable and is only used for survey logic.
   */
  type AidesSimplifieesMapping = OpenFiscaMapping | { exclude: boolean }

  type DispatchFunction = (
    answerKey: string,
    answerValue: string | number | boolean,
    periodType: 'ETERNITY' | 'YEAR' | 'YEAR_ROLLING' | 'MONTH'
  ) => Record<string, VariableValueOnPeriod>
}

export {}
