declare global {
  type TypeAide = 'pret' | 'garantie' | 'aide-financiere'

  type UsageAide =
    | 'loyer-logement'
    | 'frais-installation-logement'
    | 'caution-logement'
    | 'pret-garantie-logement'

  interface SimulationResultsAides {
    [aidesSimplifieesKey: string]: boolean | number
  }

  interface RawAide {
    id: string
    eligibilite: boolean
    montant?: number
  }

  type TexteLoi = string | { prefix: string, label: string, url: string } | null

  interface AideDetails {
    title: string
    description: string
    type: TypeAide
    instructeur: string
    description: string
    textesLoi?: TexteLoi[]
  }

  interface RichAide {
    id: string
    link: string
    titre: string
    description: string
    eligibilite: boolean
    instructeur: string
    montant: number
    usage: UsageAide
    type: TypeAide
    textesLoi: TexteLoi[]
    description: string
  }

  interface RichMontant {
    usageAide: UsageAide
    montant: number
    periode?: string
  }

  interface RichEcheance {
    type: TypeAide
    montant: number
    dateStart: Date
    dateEnd: Date
  }

  interface RichSimulationResults {
    aides: RichAide[]
    montants: RichMontant[]
    aidesNonEligibles: RichAide[]
    textesLoi: TexteLoi[]
  }
}

export {}
