import { formatDateTime } from './date_time.js'

/**
 * Transforms raw aides data from OpenFisca into rich content for UI display
 */
export async function transformSimulationResults(
  calculationResponse: SimulationResultsAides,
  createdAt: Date,
  simulateurId: string,
  aidesBySlug: unknown,
): Promise<RichSimulationResults> {
  const simulationDateTime = formatDateTime(createdAt)
  const rawAides: RawAide[] = Object.entries(calculationResponse).reduce((acc, [key, value]) => {
    if (key.match('-eligibilite')) {
      // Extract the base aide id by removing '-eligibilite' suffix
      const aideId = key.replace('-eligibilite', '')
      const eligibilite = value
      if (eligibilite === true) {
        const montant = calculationResponse[aideId]
        if (montant && typeof montant === 'number') {
          acc.push({
            id: aideId,
            eligibilite: true,
            montant,
          })
        }
      }
      else {
        acc.push({
          id: aideId,
          eligibilite: false,
        })
      }
    }
    return acc
  }, [] as RawAide[])

  // Handle empty input case
  if (!rawAides || rawAides.length === 0) {
    return {
      createAt: simulationDateTime,
      aides: [],
      montants: [],
      echeances: [],
      aidesNonEligibles: [],
      textesLoi: [],
    }
  }

  async function getRichAide(rawAide: RawAide): Promise<RichAide | null> {
    const aideDetails = aidesBySlug[rawAide.id]

    if (!aideDetails) {
      return null
    }

    const richAide: RichAide = {
      // Data from calculation response
      id: rawAide.id,
      montant: rawAide.montant || 0,
      link: `/simulateurs/${simulateurId}/resultats/${rawAide.id}#simulateur-title`,
      eligibilite: rawAide.eligibilite,
      // Data from content source
      titre: aideDetails.titre || `Aide ${rawAide.id}`,
      description: aideDetails.description || 'Description non disponible',
      textesLoi: aideDetails.textesLoi || [],
      instructeur: aideDetails.instructeur || 'Instructeur non disponible',
      type: aideDetails.type,
      usage: aideDetails.usage,
    }

    return richAide
  }

  // Process each aide and enrich with details
  const richAides = (await Promise.all(rawAides.map(getRichAide).filter(Boolean))) as RichAide[]

  // Group aides by eligibility
  const eligibleAides: RichAide[] = []
  const nonEligibleAides: RichAide[] = []
  richAides.forEach((richAide) => {
    if (richAide.eligibilite) {
      eligibleAides.push(richAide)
    }
    else {
      nonEligibleAides.push(richAide)
    }
  })

  // Calculate montant summaries by type
  const montantsByUsage = new Map<UsageAide, number>()
  eligibleAides.forEach((aide) => {
    const currentTotal = montantsByUsage.get(aide.usage) || 0
    montantsByUsage.set(aide.usage, currentTotal + aide.montant)
  })

  // Transform to rich montants
  const montants: RichMontant[] = Array.from(montantsByUsage.entries()).map(
    ([usageAide, montant]) => {
      return {
        usageAide,
        montant,
      }
    },
  )

  // Mock echeances - in real implementation, this would be derived from data
  const echeances: RichEcheance[] = []

  const textesLoi: TexteLoi[] = []
  richAides.forEach((aide) => {
    textesLoi.push(...aide.textesLoi)
  })

  return {
    createAt: simulationDateTime,
    aides: eligibleAides,
    montants,
    echeances,
    aidesNonEligibles: nonEligibleAides,
    textesLoi,
  }
}
