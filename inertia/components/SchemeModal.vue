<script setup lang="ts">
import darkThemeSvg from '@gouvfr/dsfr/dist/artwork/pictograms/environment/moon.svg'
import lightThemeSvg from '@gouvfr/dsfr/dist/artwork/pictograms/environment/sun.svg'
import systemThemeSvg from '@gouvfr/dsfr/dist/artwork/pictograms/system/system.svg'
import { DsfrModal, DsfrRadioButtonSet } from '@gouvminint/vue-dsfr'
import { storeToRefs } from 'pinia'
import { useSchemeStore } from '~/stores/scheme'

const schemeStore = useSchemeStore()
const { preferences, isModalOpen } = storeToRefs(schemeStore!)

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
      @close="() => schemeStore?.closeModal()"
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
