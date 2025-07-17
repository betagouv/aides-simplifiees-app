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
 * Additionally, we replace the text "suivi." with "suivi(e)."
 */
const matomoOptOut = ref(null)
let ignoreMutation = false
useMutationObserver(matomoOptOut, (mutations) => {
  if (ignoreMutation) {
    return
  }
  ignoreMutation = true // Ignore mutations until the next tick to avoid infinite loop
  mutations.forEach((mutation) => {
    // replace the default Matomo opt-out checkbox with a DSFR styled checkbox
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
    // replace textContent matching "suivi." with "suivi(e)."
    target.querySelectorAll('span')
      .forEach((span) => {
        if (span.textContent) {
          span.textContent = span.textContent.replaceAll(/suivi\./g, 'suivi(e).')
        }
      })
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
