import { usePage } from '@inertiajs/vue3'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useSurveyDebugStore = defineStore('survey-debug', () => {
  const page = usePage<{
    route?: {
      query?: {
        debug?: string
      }
    }
  }>()

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
