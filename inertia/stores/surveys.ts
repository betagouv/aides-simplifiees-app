import { defineStore } from 'pinia'
import { useSurveysStoreDefiner } from '~/composables/use_surveys_store_definer'

export const useSurveysStore = defineStore('surveys', useSurveysStoreDefiner({ enableMatomo: true }), {
  persist: {
    pick: [
      'answers',
      'versions',
      'currentPageIds',
    ],
  },
})
