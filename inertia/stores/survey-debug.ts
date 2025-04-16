export const useSurveyDebugStore = defineStore('survey-debug', () => {
  const route = useRoute()
  const debugMode = computed(() => route.query.debug === 'true')

  const debug = {
    log: (...messages: any[]) => {
      if (debugMode.value) {
        // eslint-disable-next-line no-console
        console.log(...messages)
      }
    },
    error: (...messages: any[]) => {
      if (debugMode.value) {
        console.error(...messages)
      }
    },
    warn: (...messages: any[]) => {
      if (debugMode.value) {
        console.warn(...messages)
      }
    }
  }
  return {
    debugMode,
    debug,
  }
})
