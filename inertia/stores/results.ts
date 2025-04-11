export const useResultsStore = defineStore('results', () => {
  const results = ref<{ [id: string]: SurveyResults }>({})

  const setResults = (simulateurId: string, data: SimulationResultsAides) => {
    results.value[simulateurId] = {
      data,
      meta: {
        createdAt: new Date()
      }
    }
  }

  const getResults = (simulateurId: string) => {
    return results.value[simulateurId]
  }

  return {
    results,
    setResults,
    getResults
  }
}, {
  persist: true
})
