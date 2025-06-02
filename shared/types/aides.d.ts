import type TypeAide from '#models/type_aide'

declare global {

  type UsageAide =
    | 'loyer-logement'
    | 'frais-installation-logement'
    | 'caution-logement'
    | 'pret-garantie-logement'
    | 'credit-impot'
    | 'jeune-entreprise'

  interface SimulationResultsAides {
    [aidesSimplifieesKey: string]: boolean | number
  }

  interface TexteLoi { label: string, url: string }

  interface RichAide {
    id: string
    link: string
    title: string
    description: string
    eligibilite: boolean
    instructeur: string
    montant: number
    usage: UsageAide
    typeAide: TypeAide
    textesLoi: TexteLoi[]
    description: string
  }

  interface RichMontant {
    usageAide: UsageAide
    montant: number
    periode?: string
  }

  interface RichSimulationResults {
    aides: RichAide[]
    montants: RichMontant[]
    aidesNonEligibles: RichAide[]
    textesLoi: TexteLoi[]
  }
}

export {}
