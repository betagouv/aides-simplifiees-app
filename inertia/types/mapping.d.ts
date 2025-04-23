declare global {
  // TODO: do not set all types as global
  // check for example what should be known by the main website and by the simulators
  export type AidesSimplifieesMapping = OpenFiscaMapping | { exclude: boolean }
  // 'exclude' means that there is no need to map the form input with an openfisca variable
  // this happens when a step in the survey asks for additional information from the user
  // to improve the survey logic etc. but with no effect on the questions to calculate

  export type OpenFiscaMapping =
    | {
      openfiscaVariableName: string
      period: 'ETERNITY' | 'YEAR' | 'YEAR_ROLLING' | 'MONTH'
    }
    | {
      dispatch: (
        answerKey: string,
        answerValue: boolean,
        periodType: 'ETERNITY' | 'YEAR' | 'YEAR_ROLLING' | 'MONTH'
      ) => unknown
      period: 'ETERNITY' | 'YEAR' | 'YEAR_ROLLING' | 'MONTH'
    }
}

export {}
