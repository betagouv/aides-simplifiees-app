const defaultRichResults: RichSimulationResults = {
  createAt: null,
  aides: [],
  montants: [],
  echeances: [],
  aidesNonEligibles: [],
  textesLoi: []
}

const mockCalculationResponse = {
  'aide-personnalisee-logement': 42.23,
  'aide-personnalisee-logement-eligibilite': true,
  'garantie-visale': 1000,
  'garantie-visale-eligibilite': true,
  'locapass': 800,
  'locapass-eligibilite': true,
  'mobilite-master-1': 1000,
  'mobilite-master-1-eligibilite': false,
  'mobilite-parcoursup': 500,
  'mobilite-parcoursup-eligibilite': true
}
/**
 * This will make sure results are loaded when navigating to a simulateur results page
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const simulateurId = to.params.simulateur_id as string
  const resultsStore = useSubmissionStore()
  const isMock = to.query.mock === 'true'

  if (isMock) {
    await useAsyncData(`rich-results-${simulateurId}`, async () => {
      try {
        const transformedData = await transformSimulationResults(mockCalculationResponse, new Date(), simulateurId)
        // eslint-disable-next-line no-console
        console.log('!!!!!!!!------ This is a hardcoded mock test ---------!!!!!!!!')
        return transformedData
      }
      catch (err) {
        console.error('Error transforming results:', err)
        throw err
      }
    }, {
      default: () => defaultRichResults
    })
    return
  }

  const results = resultsStore.getResults(simulateurId)
  if (!results) {
    return navigateTo(`/simulateurs/${simulateurId}#simulateur-title`)
  }

  const { data, error } = await useAsyncData(`rich-results-${simulateurId}`, async () => {
    try {
      const transformedData = await transformSimulationResults(results.data, new Date(results.meta.createdAt), simulateurId)
      return transformedData
    }
    catch (err) {
      console.error('Error transforming results:', err)
      throw err
    }
  }, {
    default: () => defaultRichResults
  })

  if (!data.value || error.value) {
    console.error('Failed to get results:', error.value)
    return createError({
      statusCode: 500,
      message: 'Erreur lors de la récupération des résultats'
    })
  }
})
