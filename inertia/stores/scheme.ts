import { ref, reactive, onMounted, watchEffect } from 'vue'
import { defineStore } from 'pinia'
import type { Preferences, UseSchemeResult } from '@gouvminint/vue-dsfr'
import { useScheme } from '@gouvminint/vue-dsfr'

export const useSchemeStore = defineStore('scheme', () => {
  const isModalOpen = ref(false)

  const openModal = () => {
    isModalOpen.value = true
  }

  const closeModal = () => {
    isModalOpen.value = false
  }

  const preferences: Preferences = reactive({
    theme: 'light',
    scheme: 'light',
  })

  onMounted(() => {
    const { theme, scheme, setScheme } = useScheme() as UseSchemeResult
    preferences.scheme = scheme.value as 'light' | 'dark' | 'system'

    watchEffect(() => {
      preferences.theme = theme.value as 'light' | 'dark'
    })

    watchEffect(() => setScheme(preferences.scheme))
  })

  return {
    preferences,
    isModalOpen,
    openModal,
    closeModal,
  }
})
