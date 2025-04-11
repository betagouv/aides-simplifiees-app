<script setup lang="ts">
import { ref } from 'vue'
import darkThemeSvg from '@gouvfr/dsfr/dist/artwork/pictograms/environment/moon.svg'
import lightThemeSvg from '@gouvfr/dsfr/dist/artwork/pictograms/environment/sun.svg'
import systemThemeSvg from '@gouvfr/dsfr/dist/artwork/pictograms/system/system.svg'
import { storeToRefs } from 'pinia'
import { useSchemeStore } from '../stores/scheme'

// Default values for SSR
const defaultPreferences = {
  scheme: 'light',
  theme: 'light'
}

// Only use the store in browser environment
const isBrowser = typeof window !== 'undefined'
const schemeStore = isBrowser ? useSchemeStore() : null
const { preferences, isModalOpen } = isBrowser
  ? storeToRefs(schemeStore!)
  : {
      preferences: ref(defaultPreferences),
      isModalOpen: ref(false)
    }

const options = [
  {
    label: 'Thème clair',
    value: 'light',
    svgPath: lightThemeSvg,
  },
  {
    label: 'Thème sombre',
    value: 'dark',
    svgPath: darkThemeSvg,
  },
  {
    label: 'Thème système',
    value: 'system',
    hint: 'Utilise les paramètres système',
    svgPath: systemThemeSvg,
  },
]
</script>

<template>
  <div class="fr-container fr-my-2v">
    <DsfrModal
      :opened="isModalOpen"
      title="Changer le thème"
      @close="() => isBrowser && schemeStore?.closeModal()"
    >
      <DsfrRadioButtonSet
        v-model="preferences.scheme"
        :options="options"
        name="theme-selector"
        legend="Choisissez un thème pour personnaliser l'apparence du site."
      />
    </DsfrModal>
  </div>
</template>
