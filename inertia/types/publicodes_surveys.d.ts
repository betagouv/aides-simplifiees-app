declare global {
  // Fix for EvaluatedValueTypes
  type EvaluatedValueTypes = string | number | boolean | undefined | null

  // Eligibility results interface
  interface EligibilityResults {
    eligibleDispositifs: unknown[]
    potentialDispositifs: unknown[]
    ineligibleDispositifs: unknown[]
    aidesResults: SimulationResultsAides
  }
}

export {}
