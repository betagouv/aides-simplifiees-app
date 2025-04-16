export const useAutoCompleteHistoryStore = defineStore('autocomplete-history', () => {
  const history = ref<{
    [questionId: string]: {
      [valueKey: string]: string | number
    }
  }>({})
  const addHistory = (questionId: string, valueKey: string | number, value: string | number) => {
    if (!history.value[questionId]) {
      history.value[questionId] = {}
    }
    history.value[questionId][valueKey] = value
  }
  const getHistory = (questionId: string, valueKey: string) => {
    return history.value[questionId]?.[valueKey] || ''
  }
  const clearHistory = (questionId: string) => {
    delete history.value[questionId]
  }
  const clearAllHistory = () => {
    history.value = {}
  }
  return {
    history,
    addHistory,
    getHistory,
    clearHistory,
    clearAllHistory,
  }
})
