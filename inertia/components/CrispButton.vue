<script setup lang="ts">
import { DsfrButton } from '@gouvminint/vue-dsfr'
import { storeToRefs } from 'pinia'
import { useCrispStore } from '~/stores/crisp'

const crispStore = useCrispStore()
const { isChatOpen } = storeToRefs(useCrispStore())
</script>

<template>
  <DsfrButton
    icon-only
    :label="!isChatOpen ? 'Ouvrir la discussion Crisp' : 'Fermer la discussion Crisp'"
    :icon="{
      name: !isChatOpen ? 'ri:questionnaire-fill' : 'ri:close-fill',
      ssr: true,
    }"
    @click="() => {
      crispStore.toggleChat()
    }"
  />
</template>

<style>
#crisp-chatbox>div>a[role='button'] {
  display: none !important;
}
</style>
