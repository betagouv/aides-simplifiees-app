import { defineStore } from 'pinia'
import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'

export const useSurveyDebugStore = defineStore('survey-debug', () => {
  const page = usePage()

  const debugMode = computed(() => {
    return page.props.route?.query?.debug === 'true'
  })

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
    },
  }
  return {
    debugMode,
    debug,
  }
})
