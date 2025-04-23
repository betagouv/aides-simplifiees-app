import type { DsfrSelectProps } from '@gouvminint/vue-dsfr'

/**
 * Fonctions d'autocomplétion pour les formulaires
 */

export type AutocompleteFn = (query: string) => Promise<NonNullable<DsfrSelectProps['options']>>

interface Commune {
  code: string
  autocompletion: string
  libelle: string
  distributions_postales: {
    code_commune_insee: string
    nom_de_la_commune: string
    code_postal: string
    libelle_d_acheminement: string
    coordonnees_geographiques: [number, number]
  }[]
  [key: string]: any
}

// Configuration par défaut pour les différentes fonctions d'autocomplétion
export const autocompleteConfigs: Record<string, SurveyQuestionAutocompleteConfig> = {
  getInseeNumber: {
    placeholder: 'Rechercher une commune',
    buttonText: 'Rechercher',
    loadingText: 'Chargement des suggestions de communes...',
    selectLabel: 'Sélectionner une commune dans la liste ci-dessous',
    selectHint: (query: string) =>
      `Il s'agit des communes proches de votre recherche : « ${query} »`,
    noResultsText: 'Aucune commune trouvée pour votre recherche',
    errorTitle: 'Erreur lors de la recherche de communes',
    errorDescription: 'Veuillez réessayer plus tard.',
    defaultUnselectedText: 'Sélectionner une commune',
    resetButtonLabel: 'Réinitialiser',
  },
}

/**
 * Récupère les suggestions de communes et codes postaux depuis l'API
 */
async function getInseeNumber(query: string) {
  try {
    // Encodage de la requête pour l'URL
    const encodedQuery = encodeURIComponent(query)

    // Appel à notre API serveur
    const response = await fetch(`/api/autocomplete/communes?q=${encodedQuery}`)

    // Si la réponse n'est pas OK, lever une erreur
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`)
    }

    const result = (await response.json()) as { suggestions: Commune[] }

    return result?.suggestions?.map((item) => {
      const postalCode = item.distributions_postales?.[0]?.code_postal
      return {
        value: item.code,
        text: `${postalCode} - ${item.libelle}`,
      }
    })
  }
  catch (error) {
    console.error('Erreur lors de la récupération des suggestions:', error)
    return []
  }
}

export const autocompleteFunctions: Record<string, AutocompleteFn> = {
  getInseeNumber,
}
