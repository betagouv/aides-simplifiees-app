<script setup lang="ts">
import { useMutationObserver, useScriptTag } from '@vueuse/core'
import { nextTick, ref } from 'vue'

const props = withDefaults(defineProps<{
  showIntro?: boolean
}>(), {
  showIntro: true,
})

/**
 * @see https://developer.matomo.org/guides/tracking-optout
 */
useScriptTag(
  `https://stats.beta.gouv.fr/index.php?module=CoreAdminHome&action=optOutJS&divId=matomo-opt-out&language=auto&showIntro=${props.showIntro ? '1' : '0'}`,
)

/**
 * The loaded matomo script will create some HTML in the #matomo-opt-out div.
 * We use mutation observer to style the HTML to match the DSFR.
 */
const matomoOptOut = ref(null)
let ignoreMutation = false
useMutationObserver(matomoOptOut, (mutations) => {
  if (ignoreMutation) {
    return
  }
  ignoreMutation = true // Ignore mutations until the next tick to avoid infinite loop
  mutations.forEach((mutation) => {
    const target = mutation.target as HTMLElement
    const input = target.querySelector('input[type="checkbox"]')
    const label = target.querySelector('label')
    if (input && label) {
      const wrapper = document.createElement('div')
      wrapper.className = 'fr-checkbox-group fr-checkbox-group--sm'
      label.className = 'fr-label'
      wrapper.appendChild(input)
      wrapper.appendChild(label)
      mutation.target.appendChild(wrapper)
    }
  })
  nextTick(() => {
    ignoreMutation = false // Observe mutations again
  })
}, { childList: true })
</script>

<template>
  <div
    id="matomo-opt-out"
    ref="matomoOptOut"
  />
</template>
